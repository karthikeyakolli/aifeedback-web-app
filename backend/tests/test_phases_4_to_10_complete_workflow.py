"""Comprehensive End-to-End Verification Test Suite for Phases 4 through 10.

Validates:
- Phase 4: Source Ingestion (files, ZIP archives, zip-slip defense, repo specs, immutable review snapshots).
- Phase 5: Advanced RAG (isolated project KB, reference KB, hybrid BM25 + cosine search, symbol-free citations).
- Phase 6: AI Provider Orchestration (task configs, usage ledger, budget, multi-provider cascade).
- Phase 7: Comprehensive AI Intelligence (4 auditor roles, immediate/comprehensive/guided discovery modes).
- Phase 8: Product Completeness Map (graph topology, gap detection, hierarchy/table projections, author decisions).
- Phase 9: Project Chat, Reports, and Improvement Tasks (message classification, finding actions, automated AI verification).
- Phase 10: Personal, Creator, and Public Spaces (isolation, creator launchpad metrics, public exploration & upvoting).
"""

from __future__ import annotations

import io
import json
import zipfile
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.auth_service import create_access_token
from backend.app.db.connection import db_manager
from backend.app.db.project_repository import project_repo
from backend.app.db.repository import community_repo
from backend.app.services.source_ingestion_service import source_ingestion_service
from backend.app.services.rag_engine import rag_engine
from backend.app.services.ai_orchestrator import ai_orchestrator
from backend.app.services.comprehensive_intelligence_service import comprehensive_intelligence
from backend.app.services.completeness_map_service import completeness_map_service
from backend.app.services.project_chat_service import project_chat_service

client = TestClient(app)

TEST_USER_ID = "usr_phase_lifecycle_tester"
TEST_USER_EMAIL = "tester.lifecycle@example.com"
OTHER_USER_ID = "usr_phase_lifecycle_intruder"


@pytest.fixture(autouse=True)
def ensure_offline_ai(monkeypatch):
    """Ensure network calls fail fast during offline testing and fall back deterministically."""
    from backend.app.config import settings
    monkeypatch.setattr(settings, "gemini_api_key", "")
    monkeypatch.setattr(settings, "openrouter_api_key", "")
    monkeypatch.setattr(settings, "nvidia_api_key", "")
    monkeypatch.setattr(settings, "groq_api_key", "")


@pytest.fixture
def auth_headers():
    token = create_access_token(
        user_id=TEST_USER_ID, email=TEST_USER_EMAIL, username="lifecycletester"
    )
    community_repo.ensure_profile_exists(
        user_id=TEST_USER_ID,
        username="lifecycletester",
        display_name="Lifecycle Architect",
        email=TEST_USER_EMAIL,
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def intruder_headers():
    token = create_access_token(
        user_id=OTHER_USER_ID, email="intruder@example.com", username="intruder"
    )
    community_repo.ensure_profile_exists(
        user_id=OTHER_USER_ID,
        username="intruder",
        display_name="Intruder User",
        email="intruder@example.com",
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def test_project(auth_headers):
    proj = project_repo.create_project(
        user_id=TEST_USER_ID,
        name="Telemetry Stream Gateway",
        tagline="High-throughput distributed telemetry aggregation service with zero loss",
        category="developer-tools",
        description="Processes streaming metrics and traces using write-ahead logging and token-bucket rate limiting.",
        is_public=False,
    )
    return proj


# =============================================================================
# Phase 4: Source Ingestion Tests
# =============================================================================

def test_source_ingestion_single_file_and_rag_indexing(test_project, auth_headers):
    project_id = test_project["id"]

    sample_rfc = (
        "RFC 104: Streaming Architecture Overview\n"
        "The Telemetry Stream Gateway enforces token-bucket rate limits and write-ahead logging (WAL).\n"
        "All incoming payload packets are cryptographically signed using HMAC-SHA256.\n"
        "State reconciliation runs on an isolated background worker thread to prevent thread pool exhaustion."
    )

    res = client.post(
        f"/api/v1/projects/{project_id}/sources/upload",
        headers=auth_headers,
        files={"file": ("architecture_spec.md", io.BytesIO(sample_rfc.encode("utf-8")), "text/markdown")},
    )
    assert res.status_code == 201
    sources = res.json()
    assert len(sources) >= 1
    source_id = sources[0]["id"]
    assert sources[0]["name"] == "architecture_spec.md"

    # Verify source listing
    list_res = client.get(f"/api/v1/projects/{project_id}/sources", headers=auth_headers)
    assert list_res.status_code == 200
    listed = list_res.json()
    assert any(s["id"] == source_id for s in listed)


def test_source_ingestion_zip_archive_with_zipslip_defense(test_project, auth_headers):
    project_id = test_project["id"]

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("src/gateway.py", "def process_telemetry():\n    return 'processed_stream_packet'\n")
        zf.writestr("docs/security.md", "Security Policy: Never store plain text API keys in client bundles.\n")
        # Malicious Zip-Slip attempt: path starting with ../ should be safely ignored
        zf.writestr("../../etc/passwd", "malicious_content_root_escape\n")

    zip_buffer.seek(0)
    res = client.post(
        f"/api/v1/projects/{project_id}/sources/upload",
        headers=auth_headers,
        files={"file": ("sources.zip", zip_buffer, "application/zip")},
    )
    assert res.status_code == 201
    extracted = res.json()
    assert len(extracted) == 2  # gateway.py and security.md extracted, passwd safely ignored!
    extracted_names = [e["name"] for e in extracted]
    assert any("gateway.py" in n for n in extracted_names)
    assert any("security.md" in n for n in extracted_names)
    assert not any("passwd" in n for n in extracted_names)


def test_source_immutable_review_snapshot(test_project):
    import uuid
    project_id = test_project["id"]
    rev_id = f"rev_snap_{uuid.uuid4().hex[:8]}"
    with db_manager.session() as conn:
        conn.execute(
            """
            INSERT INTO ai_reviews (id, project_id, user_id, model_id, provider, status, created_at)
            VALUES (?, ?, ?, 'gemini-2.5-flash', 'gemini', 'completed', datetime('now'))
            """,
            (rev_id, project_id, TEST_USER_ID),
        )
    snapshot = source_ingestion_service.create_review_snapshot(rev_id, project_id)
    assert snapshot["projectId"] == project_id
    assert snapshot["reviewId"] == rev_id
    assert "sources" in snapshot


# =============================================================================
# Phase 5: Advanced RAG & Vector Engine Tests
# =============================================================================

def test_rag_dense_embedding_and_hybrid_search(test_project, auth_headers):
    project_id = test_project["id"]

    # Hybrid RAG search against ingested sources
    query_payload = {"query": "rate limiting and write-ahead logging", "topK": 4, "includeReference": True}
    res = client.post(f"/api/v1/projects/{project_id}/rag/query", headers=auth_headers, json=query_payload)
    assert res.status_code == 200
    results = res.json()
    assert len(results) > 0
    top = results[0]
    assert "cleanQuote" in top
    assert "score" in top
    assert "relevancePercentage" in top
    assert top["relevancePercentage"] >= 5

    # Verify symbol-free clean quote: no markdown headers, hashes, brackets, or code fences
    clean_quote = top["cleanQuote"]
    assert "#" not in clean_quote
    assert "```" not in clean_quote
    assert "*" not in clean_quote


def test_rag_strict_project_isolation(test_project, intruder_headers):
    intruder_proj = project_repo.create_project(
        user_id=OTHER_USER_ID,
        name="Intruder Isolated App",
        tagline="Should have zero visibility into other projects knowledge chunks",
        category="productivity",
        is_public=False,
    )
    # Search intruder project for telemetry terms: should not return the test_project's private chunks
    query_payload = {"query": "HMAC-SHA256 packets", "topK": 4, "includeReference": False}
    res = client.post(f"/api/v1/projects/{intruder_proj['id']}/rag/query", headers=intruder_headers, json=query_payload)
    assert res.status_code == 200
    results = res.json()
    # Zero private project chunks should bleed across tenants
    assert len(results) == 0


# =============================================================================
# Phase 6: AI Provider Orchestration & Usage Ledger Tests
# =============================================================================

def test_ai_provider_config_and_usage_ledger(test_project, auth_headers):
    project_id = test_project["id"]

    # 1. Set AI Provider Config
    config_payload = {
        "taskType": "review",
        "primaryProvider": "openrouter",
        "fallbackProvider": "deterministic",
        "modelOverride": "deepseek/deepseek-chat:free",
    }
    cfg_res = client.post(f"/api/v1/projects/{project_id}/ai-config", headers=auth_headers, json=config_payload)
    assert cfg_res.status_code == 200

    get_cfg = client.get(f"/api/v1/projects/{project_id}/ai-config", headers=auth_headers)
    assert get_cfg.status_code == 200
    configs = get_cfg.json()
    assert configs["review"]["primaryProvider"] == "openrouter"

    # 2. Record simulated usage and verify ledger
    ledger_entry = ai_orchestrator.record_usage(
        user_id=TEST_USER_ID,
        project_id=project_id,
        review_id="rev_test_usage_01",
        provider="openrouter",
        model_id="deepseek/deepseek-chat:free",
        task_type="review",
        prompt_tokens=420,
        completion_tokens=180,
        duration_ms=640,
        status="success",
    )
    assert ledger_entry["costUsd"] >= 0.0

    usage_res = client.get(f"/api/v1/projects/{project_id}/usage", headers=auth_headers)
    assert usage_res.status_code == 200
    usage_data = usage_res.json()
    assert usage_data["totalCalls"] >= 1
    assert usage_data["totalTokens"] >= 600


# =============================================================================
# Phase 7: Comprehensive AI Intelligence Tests
# =============================================================================

def test_multi_role_comprehensive_audit(test_project, auth_headers):
    project_id = test_project["id"]

    res = client.post(
        f"/api/v1/projects/{project_id}/audit?review_mode=comprehensive",
        headers=auth_headers,
    )
    assert res.status_code == 200
    proposal = res.json()
    assert "executive_summary" in proposal
    assert "strengths_summary" in proposal
    assert "findings" in proposal
    assert len(proposal["findings"]) >= 1

    # Verify clean symbol-free text in executive summary and findings
    assert "#" not in proposal["executive_summary"]
    assert "```" not in proposal["executive_summary"]
    for f in proposal["findings"]:
        assert "#" not in f["title"]
        assert "```" not in f["recommendation"]
        assert f["category"] in ["architecture", "security", "performance", "ux", "accessibility", "bug"]


def test_guided_discovery_questions(test_project, auth_headers):
    project_id = test_project["id"]
    res = client.get(f"/api/v1/projects/{project_id}/discovery-questions", headers=auth_headers)
    assert res.status_code == 200
    questions = res.json()
    assert len(questions) >= 3
    assert all("question" in q and "options" in q for q in questions)


# =============================================================================
# Phase 8: Product Completeness Map Tests
# =============================================================================

def test_completeness_map_generation_and_author_decisions(test_project, auth_headers):
    project_id = test_project["id"]

    # 1. Fetch/Generate Map
    res = client.get(f"/api/v1/projects/{project_id}/completeness-map", headers=auth_headers)
    assert res.status_code == 200
    map_data = res.json()
    assert "summary" in map_data
    assert "graph" in map_data
    assert "hierarchy" in map_data
    assert "table" in map_data

    nodes = map_data["graph"]["nodes"]
    assert len(nodes) >= 4
    first_node = nodes[0]

    # 2. Record Author Decision (Approve)
    dec_payload = {
        "nodeId": first_node["id"],
        "decision": "approved",
        "rationale": "Verified through high-throughput architectural load testing.",
    }
    dec_res = client.post(
        f"/api/v1/projects/{project_id}/completeness-map/decisions",
        headers=auth_headers,
        json=dec_payload,
    )
    assert dec_res.status_code == 200
    dec_data = dec_res.json()
    assert dec_data["decision"] == "approved"

    # Refresh map: verify node status updated to 'complete'
    refreshed = client.get(f"/api/v1/projects/{project_id}/completeness-map", headers=auth_headers).json()
    updated_node = next(n for n in refreshed["graph"]["nodes"] if n["id"] == first_node["id"])
    assert updated_node["status"] == "complete"


# =============================================================================
# Phase 9: Project Chat, Findings Actions, and Improvement Tasks Tests
# =============================================================================

def test_project_chat_and_classification(test_project, auth_headers):
    project_id = test_project["id"]

    # 1. Create a scoped chat session
    chat_res = client.post(
        f"/api/v1/projects/{project_id}/chats",
        headers=auth_headers,
        json={"title": "Technical Gateway Architecture", "chatScope": "project_wide"},
    )
    assert chat_res.status_code == 201
    chat = chat_res.json()
    chat_id = chat["id"]

    # 2. Send message
    msg_res = client.post(
        f"/api/v1/projects/{project_id}/chats/{chat_id}/messages",
        headers=auth_headers,
        json={"content": "How does the gateway prevent message loss when a downstream subscriber lags?"},
    )
    assert msg_res.status_code == 200
    res_data = msg_res.json()
    msg = res_data.get("assistantMessage", res_data)
    assert msg["role"] == "assistant"
    assert "content" in msg
    assert msg["classification"] in ["question", "clarification", "decision", "code_generation", "general"]
    # Check that assistant response is symbol-free
    assert "#" not in msg["content"]
    assert "```" not in msg["content"]


def test_finding_action_creates_improvement_task_and_ai_verifies(test_project, auth_headers):
    project_id = test_project["id"]

    # Create a test report and finding in database
    review_id = f"rev_{project_id[:8]}"
    report_id = f"rep_{project_id[:8]}"
    finding_id = f"fnd_test_{project_id[:8]}"
    with db_manager.session() as conn:
        conn.execute(
            """
            INSERT INTO ai_reviews (id, project_id, user_id, model_id, provider, status, created_at)
            VALUES (?, ?, ?, 'gemini-2.5-flash', 'gemini', 'completed', datetime('now'))
            """,
            (review_id, project_id, TEST_USER_ID),
        )
        conn.execute(
            """
            INSERT INTO feedback_reports (
                id, project_id, review_id, executive_summary, strengths_summary,
                total_findings_count, created_at
            ) VALUES (?, ?, ?, 'Summary', 'Strengths', 1, datetime('now'))
            """,
            (report_id, project_id, review_id),
        )
        conn.execute(
            """
            INSERT INTO feedback_findings (
                id, report_id, project_id, title, severity, category,
                observation, evidence_quote, recommendation, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', datetime('now'), datetime('now'))
            """,
            (
                finding_id, report_id, project_id,
                "Missing Write-Ahead Logging in Disconnect Handler",
                "high", "architecture",
                "Sudden disconnects can lose up to 50 uncommitted stream messages.",
                "Stream messages buffered in volatile memory prior to commit.",
                "Enforce immediate append to write-ahead journal before emitting acknowledgement.",
            ),
        )

    # 1. Author takes action: Accept finding
    act_res = client.post(
        f"/api/v1/projects/{project_id}/findings/{finding_id}/actions",
        headers=auth_headers,
        json={"action": "accept", "customRecommendation": "Persist to local WAL journal synchronously."},
    )
    assert act_res.status_code == 200
    act_data = act_res.json()
    assert act_data["newFindingStatus"] == "in_progress"
    task_id = act_data["taskId"]

    # 2. List improvement tasks
    tasks_res = client.get(f"/api/v1/projects/{project_id}/tasks", headers=auth_headers)
    assert tasks_res.status_code == 200
    tasks = tasks_res.json()
    assert any(t["id"] == task_id for t in tasks)

    # 3. Update task status to in_progress
    patch_res = client.patch(
        f"/api/v1/projects/{project_id}/tasks/{task_id}",
        headers=auth_headers,
        json={"status": "in_progress"},
    )
    assert patch_res.status_code == 200

    # 4. Automated AI verification against project sources
    ver_res = client.post(f"/api/v1/projects/{project_id}/tasks/{task_id}/verify", headers=auth_headers)
    assert ver_res.status_code == 200
    ver_data = ver_res.json()
    assert ver_data["verificationStatus"] == "passed"
    assert "verified" in ver_data["feedback"].lower() or "passed" in ver_data["feedback"].lower()


# =============================================================================
# Phase 10: Personal, Creator, and Public Spaces Tests
# =============================================================================

def test_personal_and_public_spaces_publishing_lifecycle(test_project, auth_headers):
    project_id = test_project["id"]

    # 1. While private, project is accessible to owner in Personal Space
    personal_list = client.get("/api/v1/projects/personal", headers=auth_headers).json()
    assert any(p["id"] == project_id for p in personal_list)

    # Public Explore request for private project returns 404
    pub_res = client.get(f"/api/v1/projects/public/{project_id}")
    assert pub_res.status_code == 404

    # 2. Publish project to Public Explore
    update_res = client.patch(
        f"/api/v1/projects/{project_id}",
        headers=auth_headers,
        json={"isPublic": True},
    )
    assert update_res.status_code == 200
    assert update_res.json()["isPublic"] is True

    # 3. Now accessible publicly via safe projection (without private user ID leakage)
    pub_get = client.get(f"/api/v1/projects/public/{project_id}")
    assert pub_get.status_code == 200
    pub_data = pub_get.json()
    assert pub_data["name"] == "Telemetry Stream Gateway"
    assert "userId" not in pub_data or pub_data.get("userId") is None  # Safe public projection!

    # 4. Public Upvoting
    upvote_res = client.post(f"/api/v1/projects/public/{project_id}/upvote", headers=auth_headers)
    assert upvote_res.status_code == 200
    assert upvote_res.json()["upvotesCount"] >= 1
