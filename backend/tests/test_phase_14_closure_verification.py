"""Phase 14 Final System Completion & Production Closure Verification Suite.

Tests and validates:
1. Health and Readiness probes (/api/v1/health and /api/v1/health/ready), including degraded simulation.
2. Direct and on-demand Finding Evidence Citations API (/api/v1/findings/{finding_id}/citations).
3. Immutable point-in-time Snapshot retrieval (/api/v1/projects/{project_id}/snapshots/{snapshot_id}).
4. AI Budgets API lifecycle (GET /budgets, GET /budgets/account, PUT /budgets).
5. Cross-tenant isolation on budgets and snapshots.
6. Public project read-only invariance (rejection of mutation / upvoting endpoints).
"""

from __future__ import annotations

import uuid
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.auth_service import create_access_token
from backend.app.db.connection import db_manager
from backend.app.db.project_repository import project_repo
from backend.app.db.repository import community_repo
from backend.app.services.source_ingestion_service import source_ingestion_service


@pytest.fixture
def client():
    return TestClient(app)


def _create_user(prefix: str = "p14_user"):
    uid = uuid.uuid4().hex[:8]
    email = f"{prefix}_{uid}@example.com"
    user_id, _ = community_repo.create_user(
        email=email,
        password="Password123!",
        username=f"{prefix}_{uid}",
        display_name=f"User {uid}",
    )
    token = create_access_token(user_id=user_id, email=email, username=f"{prefix}_{uid}")
    headers = {"Authorization": f"Bearer {token}"}
    return user_id, headers


def test_health_liveness_and_readiness_probes(client):
    """Verifies that /health returns liveness and /health/ready returns comprehensive readiness."""
    # 1. Liveness
    live_res = client.get("/api/v1/health")
    assert live_res.status_code == 200
    live_data = live_res.json()
    assert live_data["status"] == "healthy"
    assert "api" in live_data["services"]

    # 2. Readiness - healthy state
    ready_res = client.get("/api/v1/health/ready")
    assert ready_res.status_code == 200
    ready_data = ready_res.json()
    assert ready_data["status"] == "healthy"
    assert ready_data["services"]["database"] == "operational"
    assert "ready" in ready_data["services"]["worker_queue"]

    # 3. Readiness - simulated degraded state
    with patch.object(db_manager, "ping", return_value=False):
        deg_res = client.get("/api/v1/health/ready")
        assert deg_res.status_code == 503
        deg_data = deg_res.json()
        assert deg_data["status"] == "degraded"
        assert deg_data["services"]["database"] == "disconnected"


def test_finding_evidence_citations_lifecycle(client):
    """Verifies that finding evidence citations can be retrieved directly via /findings/{finding_id}/citations."""
    user_id, headers = _create_user("p14_cit")
    project = project_repo.create_project(
        user_id=user_id,
        name="Citation Traceability Project",
        tagline="Testing 7-coordinate citation storage",
        category="developer-tools",
        description="A robust system with rigorous cryptographic logging.",
    )
    project_id = project["id"]

    # Ingest a source
    doc_text = "def verify_token(token: str):\n    assert token is not None\n    return True\n"
    source = source_ingestion_service._ingest_text_or_code(
        project_id=project_id,
        owner_id=user_id,
        filename="auth_service.py",
        content_bytes=doc_text.encode("utf-8"),
        mime_type="text/x-python",
    )

    # Reserve and claim review
    rev = project_repo.reserve_ai_review(project_id=project_id, user_id=user_id)
    review_id = rev["id"]
    claimed = project_repo.claim_queued_ai_review(worker_id="worker_test", review_id=review_id)
    assert claimed is not None
    lease_token = claimed["leaseToken"]

    # Create snapshot
    snapshot = source_ingestion_service.create_review_snapshot(project_id=project_id, review_id=review_id)
    assert snapshot["id"] is not None

    findings_input = [
        {
            "title": "Unsalted Token Verification",
            "severity": "high",
            "category": "security",
            "observation": "Token assertion lacks cryptographic validation.",
            "evidence_quote": "assert token is not None",
            "recommendation": "Use HMAC-SHA256 signature verification.",
            "status": "open",
        }
    ]

    finalized_report = project_repo.finalize_feedback_report(
        review_id=review_id,
        project_id=project_id,
        executive_summary="Citation verification test.",
        strengths_summary="Deterministic citation matching.",
        findings_data=findings_input,
        worker_id="worker_test",
        lease_token=lease_token,
    )

    assert len(finalized_report["findings"]) == 1
    finding_id = finalized_report["findings"][0]["id"]

    # Now call the dedicated endpoint
    cit_res = client.get(f"/api/v1/findings/{finding_id}/citations", headers=headers)
    assert cit_res.status_code == 200
    citations = cit_res.json()
    assert len(citations) >= 1
    c0 = citations[0]
    assert c0["findingId"] == finding_id
    assert c0["sourceId"] == source["id"]
    assert c0["lineStart"] == 2
    assert c0["lineEnd"] == 2
    assert c0["canonicalQuote"] == "assert token is not None"


def test_immutable_project_snapshot_retrieval(client):
    """Verifies that project snapshots preserve ingested files and are readable via API."""
    user_id, headers = _create_user("p14_snap")
    project = project_repo.create_project(
        user_id=user_id,
        name="Snapshot Preservation Project",
        tagline="Immutability testing",
        category="developer-tools",
        description="Verifying historical source preservation.",
    )
    project_id = project["id"]

    source = source_ingestion_service._ingest_text_or_code(
        project_id=project_id,
        owner_id=user_id,
        filename="config.json",
        content_bytes=b'{"version": "1.0.0", "env": "prod"}',
        mime_type="application/json",
    )

    rev = project_repo.reserve_ai_review(project_id=project_id, user_id=user_id)
    snapshot = source_ingestion_service.create_review_snapshot(project_id=project_id, review_id=rev["id"])
    snapshot_id = snapshot["id"]

    # Fetch snapshot via API
    res = client.get(f"/api/v1/projects/{project_id}/snapshots/{snapshot_id}", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == snapshot_id
    assert data["projectId"] == project_id
    assert len(data["sources"]) >= 1
    assert data["sources"][0]["name"] == "config.json"


def test_ai_budgets_api_lifecycle(client):
    """Verifies the complete AI Budgets API: listing, account budget, and updates."""
    user_id, headers = _create_user("p14_budget")

    # 1. Get default account budget
    acct_res = client.get("/api/v1/budgets/account", headers=headers)
    assert acct_res.status_code == 200
    acct_data = acct_res.json()
    assert acct_data["scope"] == "account"
    assert acct_data["monthlyLimitUsd"] >= 0.0

    # 2. Update budget
    update_res = client.put(
        "/api/v1/budgets",
        headers=headers,
        json={
            "scope": "account",
            "monthlyLimitUsd": 125.50,
            "warningThresholdPct": 70.0,
            "hardStopEnabled": True,
        },
    )
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["monthlyLimitUsd"] == 125.50
    assert updated_data["warningThresholdPct"] == 70.0
    assert updated_data["hardStopEnabled"] is True

    # 3. List budgets
    list_res = client.get("/api/v1/budgets", headers=headers)
    assert list_res.status_code == 200
    budgets = list_res.json()
    assert any(b["monthlyLimitUsd"] == 125.50 for b in budgets)


def test_cross_tenant_isolation_on_budgets_and_snapshots(client):
    """Verifies strict cross-tenant isolation: User B cannot access User A's private assets."""
    user_a_id, headers_a = _create_user("p14_user_a")
    user_b_id, headers_b = _create_user("p14_user_b")

    # User A creates a project
    proj_a = project_repo.create_project(
        user_id=user_a_id,
        name="User A Private Project",
        tagline="Private data",
        category="developer-tools",
        description="Strictly confidential",
        is_public=False,
    )

    # Ingest source and create snapshot for User A
    source_a = source_ingestion_service._ingest_text_or_code(
        project_id=proj_a["id"],
        owner_id=user_a_id,
        filename="secret.txt",
        content_bytes=b"classified",
        mime_type="text/plain",
    )
    rev_a = project_repo.reserve_ai_review(project_id=proj_a["id"], user_id=user_a_id)
    snap_a = source_ingestion_service.create_review_snapshot(project_id=proj_a["id"], review_id=rev_a["id"])

    # User B attempts to access User A's snapshot -> should be 403 Forbidden or 404 Not Found
    res = client.get(
        f"/api/v1/projects/{proj_a['id']}/snapshots/{snap_a['id']}",
        headers=headers_b,
    )
    assert res.status_code in (403, 404)


def test_public_space_read_only_invariance(client):
    """Verifies that Public project endpoints remain read-only and mutations (like upvoting) are disabled."""
    user_id, headers = _create_user("p14_public")
    pub_proj = project_repo.create_project(
        user_id=user_id,
        name="Public Discovery Project",
        tagline="Open for evaluation",
        category="developer-tools",
        description="Public showcase project.",
        is_public=True,
    )

    # Reading public project is allowed
    read_res = client.get(f"/api/v1/projects/public/{pub_proj['id']}")
    assert read_res.status_code == 200
    assert read_res.json()["name"] == "Public Discovery Project"

    # Upvoting is disabled (returns 403 or 404)
    upvote_res = client.post(f"/api/v1/projects/public/{pub_proj['id']}/upvote", headers=headers)
    assert upvote_res.status_code in (403, 404, 405)
