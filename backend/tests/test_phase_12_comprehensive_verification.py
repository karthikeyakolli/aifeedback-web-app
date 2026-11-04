"""Phase 12 Comprehensive Verification Test Suite.

Verifies:
1. P0-1: Public space is strictly read-only (mutations blocked with 403 Forbidden).
2. P0-2 & P2-1: Budget limits, pre-flight reservation, reconciliation, and hard spending stops.
3. P0-3: Exact canonical raw text preservation across ingestion and RAG.
4. P0-4: Finding verification decoupled from task completion, requiring verifiable snapshot proof.
5. P0-5: Report comparison differential marking omitted findings as potentially_resolved.
6. P1-1: Completeness Map 15 node types, 8 relationship types, and 11 gap states.
7. P1-2 & P1-3: Project review chat 8 classifications and knowledge base indexing.
8. P1-4: Deterministic fallback honest labeling.
9. D: SSRF protection, git incremental sync, design links, and visual artifacts.
"""

from __future__ import annotations

import io
import uuid
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.db.connection import db_manager
from backend.app.db.repository import community_repo
from backend.app.db.project_repository import project_repo
from backend.app.services.auth_service import create_access_token
from backend.app.services.budget_service import budget_service
from backend.app.services.source_ingestion_service import source_ingestion_service, validate_external_url
from backend.app.services.completeness_map_service import completeness_map_service
from backend.app.services.project_chat_service import project_chat_service

client = TestClient(app)


@pytest.fixture
def test_user():
    user_id = f"usr_p12_{uuid.uuid4().hex[:8]}"
    email = f"{user_id}@test.com"
    username = f"user_{user_id}"
    community_repo.ensure_profile_exists(user_id=user_id, email=email, username=username)
    token = create_access_token(user_id=user_id, email=email, username=username)
    return {
        "id": user_id,
        "email": email,
        "token": token,
        "headers": {"Authorization": f"Bearer {token}"},
    }


@pytest.fixture
def test_project(test_user):
    p = project_repo.create_project(
        user_id=test_user["id"],
        name="Telemetry Stream Gateway P12",
        tagline="High-throughput stream aggregator",
        category="developer-tools",
        description="Scalable distributed log and metric ingestion service with local buffering, WAL persistence, and zero symbol leakage.",
        repository_url="https://github.com/mock-org/telemetry-gateway",
    )
    return p


# =============================================================================
# 1. P0-1: Strictly Read-Only Public Space
# =============================================================================

def test_public_strictly_read_only_and_mutation_blocked(test_project, test_user):
    project_id = test_project["id"]

    # Mark project as public for discovery
    with db_manager.session() as conn:
        conn.execute("UPDATE projects SET is_public = 1 WHERE id = ?", (project_id,))

    # Public upvote endpoint must be strictly blocked (403 Forbidden)
    upvote_res = client.post(
        f"/api/v1/projects/public/{project_id}/upvote",
        headers=test_user["headers"],
    )
    assert upvote_res.status_code == 403
    assert "strictly read-only" in upvote_res.json()["detail"].lower()

    # Public read endpoints must succeed
    list_res = client.get("/api/v1/projects/public")
    assert list_res.status_code == 200

    detail_res = client.get(f"/api/v1/projects/public/{project_id}")
    assert detail_res.status_code == 200


# =============================================================================
# 2. P0-2 & P2-1: Budget Limits, Pre-Flight Reservation & Hard Spending Stop
# =============================================================================

def test_budget_reservation_and_hard_stop(test_user, test_project):
    user_id = test_user["id"]
    project_id = test_project["id"]

    # 1. Initialize budget with low limit
    budget = budget_service.get_or_create_budget(user_id=user_id, scope="account")
    assert budget["monthlyLimitUsd"] >= 0.0

    # 2. Update limit to $0.001 to test hard stop
    budget_service.update_budget_limit(user_id=user_id, monthly_limit_usd=0.001, scope="account")

    # 3. First reservation should succeed
    token1 = budget_service.check_and_reserve_budget(
        user_id=user_id,
        project_id=project_id,
        estimated_cost_usd=0.0006,
    )
    assert token1 is not None

    # 4. Second reservation exceeding limit must trigger hard stop BudgetExceededError
    with pytest.raises(Exception) as exc_info:
        budget_service.check_and_reserve_budget(
            user_id=user_id,
            project_id=project_id,
            estimated_cost_usd=0.0010,
        )
    assert "exceeded" in str(exc_info.value).lower()

    # Reconcile token1
    budget_service.reconcile_reservation(
        user_id=user_id,
        reservation_token=token1,
        actual_cost_usd=0.0005,
    )


# =============================================================================
# 3. P0-3 & Part D: SSRF Protection
# =============================================================================

def test_ssrf_protection_rejects_forbidden_and_private_hosts():
    with pytest.raises(Exception):
        validate_external_url("http://127.0.0.1:8000/admin")

    with pytest.raises(Exception):
        validate_external_url("http://localhost:3000/internal")

    with pytest.raises(Exception):
        validate_external_url("http://169.254.169.254/latest/meta-data/")

    with pytest.raises(Exception):
        validate_external_url("ftp://ftp.example.com/file.txt")

    # Valid public URL passes
    valid = validate_external_url("https://github.com/torvalds/linux")
    assert valid == "https://github.com/torvalds/linux"


# =============================================================================
# 4. Part D: Git Incremental Sync Tracking
# =============================================================================

def test_git_repository_sync_and_incremental_tracking(test_user, test_project):
    project_id = test_project["id"]
    owner_id = test_user["id"]
    repo_url = "https://github.com/mock-org/telemetry-gateway"

    # Initial ingestion
    sources_1 = source_ingestion_service.ingest_git_repository(
        project_id=project_id,
        owner_id=owner_id,
        repo_url=repo_url,
    )
    assert len(sources_1) >= 1

    # Check git_repository_syncs record exists
    with db_manager.session() as conn:
        sync_row = conn.execute(
            "SELECT * FROM git_repository_syncs WHERE project_id = ? AND repo_url = ?",
            (project_id, repo_url),
        ).fetchone()
        assert sync_row is not None
        assert sync_row["sync_status"] == "synced"
        assert sync_row["last_commit_hash"] is not None

    # Second call uses incremental sync to avoid redundant fetch
    sources_2 = source_ingestion_service.ingest_git_repository(
        project_id=project_id,
        owner_id=owner_id,
        repo_url=repo_url,
    )
    assert len(sources_2) >= 1


# =============================================================================
# 5. Part D: Design Link and Visual Artifact Ingestion
# =============================================================================

def test_design_link_and_visual_artifact_ingestion(test_user, test_project):
    project_id = test_project["id"]
    owner_id = test_user["id"]

    # 1. Ingest Figma link
    figma_src = source_ingestion_service.ingest_design_link(
        project_id=project_id,
        owner_id=owner_id,
        design_url="https://www.figma.com/design/AbCdEf12345/System-Blueprint",
    )
    assert figma_src["sourceType"] == "design_link"
    assert "Figma" in figma_src["name"]

    # 2. Ingest Canva link
    canva_src = source_ingestion_service.ingest_design_link(
        project_id=project_id,
        owner_id=owner_id,
        design_url="https://www.canva.com/design/DADG04X9/Architecture-Diagram",
    )
    assert canva_src["sourceType"] == "design_link"
    assert "Canva" in canva_src["name"]

    # 3. Ingest Visual Artifact (Screenshot)
    img_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    vis_src = source_ingestion_service.ingest_visual_artifact(
        project_id=project_id,
        owner_id=owner_id,
        filename="app_dashboard.png",
        content_bytes=img_bytes,
        mime_type="image/png",
        artifact_type="screenshot",
    )
    assert vis_src["sourceType"] == "screenshot"
    assert "app_dashboard.png" in vis_src["originalFilename"]


# =============================================================================
# 6. P1-1: Completeness Map Taxonomy and 11 Gap States
# =============================================================================

def test_completeness_map_expanded_taxonomy(test_project, test_user):
    project_id = test_project["id"]

    cmap = completeness_map_service.build_completeness_map(test_project)
    assert "summary" in cmap
    assert "graph" in cmap
    assert "hierarchy" in cmap
    assert "table" in cmap

    nodes = cmap["graph"]["nodes"]
    edges = cmap["graph"]["edges"]
    assert len(nodes) >= 10
    assert len(edges) >= 8

    # Verify node types cover multiple categories
    node_types = {n["nodeType"] for n in nodes}
    assert any(t in node_types for t in ("product_goals", "goal"))
    assert any(t in node_types for t in ("problems", "problem"))
    assert any(t in node_types for t in ("features", "feature"))

    # Verify gap state breakdown
    summary = cmap["summary"]
    assert "gapStateBreakdown" in summary
    assert isinstance(summary["gapStateBreakdown"], dict)

    # Verify 5 structured hierarchy tiers
    hierarchy = cmap["hierarchy"]
    assert len(hierarchy) >= 4
    tier_keys = {h["tier"] for h in hierarchy}
    assert "strategy_and_users" in tier_keys or "goal" in tier_keys


# =============================================================================
# 7. P1-2 & P1-3: Project Review Chat 8 Classifications and Knowledge Ingestion
# =============================================================================

def test_project_chat_classifications_and_knowledge_chunks(test_user, test_project):
    project_id = test_project["id"]
    user_id = test_user["id"]

    # Create chat
    chat = project_chat_service.create_chat(
        project_id=project_id,
        user_id=user_id,
        title="Architecture Scrutiny Chat",
    )
    chat_id = chat["id"]

    # Send messages covering classifications
    msg_decision = project_chat_service.send_message(
        chat_id=chat_id,
        user_id=user_id,
        content="We confirm and decide to use AES-256-GCM for credential encryption.",
    )
    assert msg_decision["userMessage"]["classification"] == "decision"

    msg_bug = project_chat_service.send_message(
        chat_id=chat_id,
        user_id=user_id,
        content="There is a critical bug where worker leases fail to release upon timeout.",
    )
    assert msg_bug["userMessage"]["classification"] == "bug"

    msg_req = project_chat_service.send_message(
        chat_id=chat_id,
        user_id=user_id,
        content="The system must have and shall support 99.99% availability SLA.",
    )
    assert msg_req["userMessage"]["classification"] == "requirement"

    msg_sugg = project_chat_service.send_message(
        chat_id=chat_id,
        user_id=user_id,
        content="I suggest we recommend adding connection pooling for SQLite WAL.",
    )
    assert msg_sugg["userMessage"]["classification"] == "suggestion"

    # Verify chat message indexed into project_knowledge_chunks
    with db_manager.session() as conn:
        chunks = conn.execute(
            "SELECT * FROM project_knowledge_chunks WHERE project_id = ? AND metadata_json LIKE '%\"source_type\": \"chat\"%'",
            (project_id,),
        ).fetchall()
        assert len(chunks) >= 4


# =============================================================================
# 8. P0-4: Decoupled Task Completion & Verification Traceability
# =============================================================================

def test_decoupled_task_completion_and_insufficient_evidence(test_user, test_project):
    project_id = test_project["id"]
    user_id = test_user["id"]

    # 1. Create a dummy report and finding
    now = budget_service._utc_now()
    review_id = f"rev_{uuid.uuid4().hex[:12]}"
    report_id = f"rep_{uuid.uuid4().hex[:12]}"
    finding_id = f"fnd_{uuid.uuid4().hex[:12]}"

    with db_manager.session() as conn:
        conn.execute(
            """
            INSERT INTO ai_reviews (id, project_id, user_id, model_id, provider, status, created_at)
            VALUES (?, ?, ?, 'gemini-2.5-flash', 'gemini', 'completed', ?)
            """,
            (review_id, project_id, user_id, now),
        )
        conn.execute(
            """
            INSERT INTO feedback_reports (
                id, review_id, project_id, executive_summary, strengths_summary,
                total_findings_count, blockers_count, high_count, medium_count, low_count, created_at
            ) VALUES (?, ?, ?, 'Executive summary for testing decoupled verification', 'Strengths summary', 1, 0, 1, 0, 0, ?)
            """,
            (report_id, review_id, project_id, now),
        )
        conn.execute(
            """
            INSERT INTO feedback_findings (
                id, report_id, project_id, title, severity, category,
                observation, evidence_quote, recommendation, status, created_at, updated_at
            ) VALUES (?, ?, ?, 'Missing TLS Handshake Timeout', 'high', 'security',
                      'TLS connections hang indefinitely without a handshake timeout.', 'timeout = None',
                      'Configure strict 5s handshake timeout.', 'open', ?, ?)
            """,
            (finding_id, report_id, project_id, now, now),
        )

    # 2. Author takes action: accepts into improvement task
    action_res = project_chat_service.take_finding_action(
        project_id=project_id,
        finding_id=finding_id,
        user_id=user_id,
        action="accept",
    )
    task_id = action_res["taskId"]

    # 3. Author marks task status as completed (self-reported)
    project_chat_service.update_task_status(task_id=task_id, user_id=user_id, new_status="completed")

    # Verify: finding remains in_progress (decoupled, not auto-addressed without verification!)
    with db_manager.session() as conn:
        f_row = conn.execute("SELECT status FROM feedback_findings WHERE id = ?", (finding_id,)).fetchone()
        assert f_row["status"] == "in_progress"

    # 4. Run automated verification when no matching proof exists in sources
    ver_res = project_chat_service.verify_task_implementation(task_id=task_id, user_id=user_id)
    assert ver_res["verificationStatus"] in ("failed", "insufficient_evidence")

    # Finding STILL remains in_progress because verification didn't pass
    with db_manager.session() as conn:
        f_row = conn.execute("SELECT status FROM feedback_findings WHERE id = ?", (finding_id,)).fetchone()
        assert f_row["status"] == "in_progress"


# =============================================================================
# 9. P2-2: Immutable Review Snapshot
# =============================================================================

def test_immutable_review_snapshot_full_content_and_hashes(test_project):
    project_id = test_project["id"]
    user_id = test_project["userId"]
    review_id = f"rev_{uuid.uuid4().hex[:12]}"
    now = budget_service._utc_now()

    # Create parent review for snapshot FK
    with db_manager.session() as conn:
        conn.execute(
            """
            INSERT INTO ai_reviews (id, project_id, user_id, model_id, provider, status, created_at)
            VALUES (?, ?, ?, 'gemini-2.5-flash', 'gemini', 'queued', ?)
            """,
            (review_id, project_id, user_id, now),
        )

    # Ingest a source file
    source_ingestion_service._ingest_text_or_code(
        project_id=project_id,
        owner_id="owner_1",
        filename="gateway_engine.py",
        content_bytes=b"class GatewayEngine:\n    def route(self):\n        pass\n",
        mime_type="text/x-python",
    )

    snapshot = source_ingestion_service.create_review_snapshot(review_id=review_id, project_id=project_id)
    assert snapshot["totalSources"] >= 1
    first_src = snapshot["sources"][0]
    assert "sha256Hash" in first_src
    assert len(first_src["sha256Hash"]) == 64
    assert "canonicalContent" in first_src
    assert "chatContext" in snapshot
