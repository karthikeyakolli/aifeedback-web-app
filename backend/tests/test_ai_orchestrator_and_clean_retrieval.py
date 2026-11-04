"""Automated Test Suite for AI Orchestration Engine and Clean Symbol-Free Retrieval.

Verifies:
1. Complete symbol stripping via clean_evidence_quote and clean_output_text (no raw symbols,
   page markers, markdown headers, brackets, backticks, or code fences).
2. AI Orchestrator multi-provider cascade failover and deterministic fallback.
3. BYOK vault key resolution and execution via AI Orchestrator.
4. Scoped RAG retrieval returning clean, symbol-free evidence quotes and normalized source attribution.
"""

import pytest
import uuid
from unittest.mock import patch, MagicMock

from backend.app.schemas.project import (
    StructuredProjectFeedbackProposal,
    RawProjectFindingProposal,
)
from backend.app.services.text_cleaner import (
    clean_evidence_quote,
    clean_output_text,
    clean_input_text,
)
from backend.app.services.ai_orchestrator import ai_orchestrator
from backend.app.services.retrieval_service import retrieval_service, retrieve_evidence
from backend.app.services.vault_service import vault_service
from backend.app.db.project_repository import project_repo


def test_clean_evidence_quote_strips_all_symbols():
    """Verify that all markdown, code fences, page markers, brackets, and bullet symbols are stripped."""
    dirty_text = (
        "--- [Page 1] ---\n"
        "### 2. Architecture & Persistence\n"
        "* **Write-Ahead Logging**: The database relies on WAL (`sqlite3_wal`). [cite: 1] [comment-42]\n"
        "> Recommendation: Ensure {fsync: true} is enforced | col1 | col2 |\n"
        "```sql\nSELECT * FROM ai_reviews;\n```\n"
        "--- [Page 2] ---\n"
        "• State machine recovery must be verified."
    )

    clean = clean_evidence_quote(dirty_text)

    # Assert no symbols remain
    assert "---" not in clean
    assert "[Page 1]" not in clean
    assert "[Page 2]" not in clean
    assert "###" not in clean
    assert "**" not in clean
    assert "`" not in clean
    assert "```" not in clean
    assert "[cite:" not in clean
    assert "[comment-" not in clean
    assert "{" not in clean
    assert "}" not in clean
    assert "[" not in clean
    assert "]" not in clean
    assert "|" not in clean
    assert "•" not in clean
    assert "*" not in clean

    # Assert natural prose words remain
    assert "Architecture" in clean
    assert "Write-Ahead Logging" in clean
    assert "database relies on WAL" in clean
    assert "Ensure fsync: true is enforced" in clean
    assert "State machine recovery must be verified" in clean


def test_ai_orchestrator_sanitizes_proposals():
    """Verify that proposal sanitization cleans all findings and summaries."""
    dirty_proposal = StructuredProjectFeedbackProposal(
        executive_summary="### Summary\n* High quality project with **strong** architecture. [cite: 1]",
        strengths_summary="--- [Page 1] ---\nDemonstrates clean modular patterns.",
        findings=[
            RawProjectFindingProposal(
                title="### Insecure Default `CORS` Configuration",
                severity="high",
                category="security",
                observation="* **Wildcard Origins**: Server allows `*` origin [cite: 99].",
                evidence_quote="--- [Page 3] ---\nallow_origins = ['*']",
                recommendation="Replace `*` with explicit origins from `settings`.",
            )
        ],
    )

    sanitized = ai_orchestrator.sanitize_feedback_proposal(dirty_proposal)

    assert "###" not in sanitized.executive_summary
    assert "**" not in sanitized.executive_summary
    assert "[cite: 1]" not in sanitized.executive_summary
    assert "--- [Page 1] ---" not in sanitized.strengths_summary

    f = sanitized.findings[0]
    assert "###" not in f.title
    assert "`" not in f.title
    assert "CORS" in f.title
    assert "**" not in f.observation
    assert "[cite: 99]" not in f.observation
    assert "--- [Page 3] ---" not in f.evidence_quote
    assert "`" not in f.recommendation


def test_ai_orchestrator_deterministic_fallback():
    """Verify that when remote APIs are unavailable, deterministic proposal is generated."""
    project = {
        "id": f"proj_{uuid.uuid4().hex[:8]}",
        "name": "Audit Target",
        "category": "infrastructure",
        "tagline": "Durable task runner",
        "description": "High throughput task orchestration engine with SQLite WAL persistence and zero symbol leakage.",
    }

    # Call orchestrator explicitly with offline fallback
    proposal = ai_orchestrator.generate_project_feedback(
        project=project,
        focus_areas=["architecture", "security"],
        preferred_provider="deterministic",
    )

    assert proposal is not None
    assert len(proposal.findings) >= 2
    assert "Audit Target" in proposal.executive_summary
    # Ensure findings are symbol-free
    for f in proposal.findings:
        assert "#" not in f.title
        assert "*" not in f.observation
        assert "[" not in f.evidence_quote


def test_ai_orchestrator_byok_vault_integration():
    """Verify that AI Orchestrator resolves active user keys from the encrypted BYOK vault."""
    from backend.app.db.repository import community_repo
    user_id = f"usr_test_{uuid.uuid4().hex[:6]}"
    community_repo.ensure_profile_exists(user_id=user_id, email=f"{user_id}@test.com", username=user_id)

    vault_service.add_credential(
        user_id=user_id,
        provider="openrouter",
        display_name="User Personal Key",
        secret="sk-or-v1-my-secret-byok-test-key",
    )

    resolved_key = ai_orchestrator._resolve_api_key("openrouter", user_id=user_id)
    assert resolved_key == "sk-or-v1-my-secret-byok-test-key"


def test_retrieval_service_produces_clean_evidence():
    """Verify that retrieve_evidence returns symbol-free quotes and valid score percentages."""
    post = {
        "id": f"post_{uuid.uuid4().hex[:8]}",
        "title": "WebSocket Gateway Spec",
        "description": "Real-time communication broker with Redis pub/sub backend.",
        "category": "infrastructure",
    }
    comments = [
        {
            "id": f"c_{uuid.uuid4().hex[:6]}",
            "content": "--- [Page 1] ---\n### Latency Observation\n* Reconnection **throttling** is too aggressive under `lossy` networks. [cite: 2]",
            "author": {"displayName": "NetworkEngineer", "username": "net_eng"},
            "isAnonymous": False,
            "status": "published",
        }
    ]

    result = retrieve_evidence(
        post=post,
        comments=comments,
        question="What are the latency observations regarding WebSocket reconnections?",
    )

    assert result["has_sufficient_evidence"] is True
    assert len(result["retrieved_comments"]) > 0

    c = result["retrieved_comments"][0]
    # Check that content and snippet have no symbol pollution
    assert "--- [Page 1] ---" not in c["content"]
    assert "###" not in c["content"]
    assert "**" not in c["content"]
    assert "`" not in c["content"]
    assert "[cite: 2]" not in c["content"]
    assert "Reconnection throttling is too aggressive" in c["content"]

    # Check enriched fields
    assert "relevance_percentage" in c
    assert isinstance(c["relevance_percentage"], int)
    assert "snippet" in c
    assert c["clean_author"] == "NetworkEngineer"


def test_ai_orchestrator_token_usage_ledger_recording():
    """Verify that AI review execution records actual token usage and cost in ai_usage_ledger."""
    from backend.app.db.connection import db_manager
    project_id = f"prj_{uuid.uuid4().hex[:8]}"
    review_id = f"rev_{uuid.uuid4().hex[:8]}"
    user_id = f"usr_{uuid.uuid4().hex[:8]}"

    test_project = {
        "id": project_id,
        "name": "Distributed Stream Processor",
        "tagline": "High-throughput stream processing with checkpointing and state reconciliation.",
        "description": "Processes partitioned real-time event logs with Raft consensus and rocksdb persistence.",
        "category": "infrastructure",
        "userId": user_id,
    }

    # Run AI orchestrator with review_id
    proposal = ai_orchestrator.generate_project_feedback(
        project=test_project,
        focus_areas=["consensus"],
        user_id=user_id,
        review_id=review_id,
    )

    assert proposal is not None
    assert len(proposal.findings) >= 2

    # Check ai_usage_ledger
    with db_manager.session() as conn:
        row = conn.execute(
            "SELECT * FROM ai_usage_ledger WHERE project_id = ? AND review_id = ?",
            (project_id, review_id),
        ).fetchone()

    assert row is not None
    assert row["user_id"] == user_id
    assert row["prompt_tokens"] > 0
    assert row["completion_tokens"] > 0
    assert row["duration_ms"] >= 0
    assert row["status"] == "success"

    # Test summary aggregator
    summary = ai_orchestrator.get_project_usage_summary(project_id)
    assert summary["totalCalls"] >= 1
    assert summary["totalTokens"] > 0


def test_source_ingestion_preserves_canonical_verbatim_raw_text():
    """Verify that source ingestion canonically preserves verbatim raw code, indentation, and symbols."""
    from backend.app.services.source_ingestion_service import source_ingestion_service
    from backend.app.db.repository import community_repo

    owner_id = f"usr_{uuid.uuid4().hex[:8]}"
    email = f"{owner_id}@example.com"
    community_repo.ensure_profile_exists(user_id=owner_id, username=owner_id, display_name="Dev", email=email)

    proj = project_repo.create_project(
        user_id=owner_id,
        name="Source Raw Verification",
        tagline="Verifying raw code preservation",
        category="developer-tools",
        description="Testing raw code ingestion",
    )
    project_id = proj["id"]

    raw_code = (
        "```python\n"
        "# Verbatim Indentation & Special Symbols: [CRITICAL]\n"
        "def execute_lease_fencing(token: str) -> bool:\n"
        "    if not token or len(token) < 16:\n"
        "        raise ValueError('Invalid token: @#$%^&*')\n"
        "    return True\n"
        "```\n"
    )

    sources = source_ingestion_service.ingest_uploaded_file(
        project_id=project_id,
        owner_id=owner_id,
        filename="lease_manager.py",
        content_bytes=raw_code.encode("utf-8"),
    )

    assert sources and len(sources) > 0
    source = sources[0]
    assert source["name"] == "lease_manager.py"
    # Canonical stored text must contain verbatim raw characters and fences
    assert "```python" in source["contentText"]
    assert "def execute_lease_fencing(token: str) -> bool:" in source["contentText"]
    assert "@#$%^&*" in source["contentText"]


def test_compare_feedback_reports_includes_omitted_findings():
    """Verify that compare_feedback_reports tracks findings omitted in the target report as resolved."""
    from fastapi.testclient import TestClient
    from backend.app.main import app
    from backend.app.db.connection import db_manager
    from backend.app.services.auth_service import create_access_token
    from backend.app.db.repository import community_repo

    client = TestClient(app)
    user_id = f"usr_{uuid.uuid4().hex[:8]}"
    email = f"{user_id}@example.com"
    token = create_access_token(user_id=user_id, email=email, username=user_id)
    community_repo.ensure_profile_exists(user_id=user_id, username=user_id, display_name="Auditor", email=email)
    headers = {"Authorization": f"Bearer {token}"}

    proj = project_repo.create_project(
        user_id=user_id,
        name="Audited Architecture",
        tagline="Testing report diff engine resolution",
        category="developer-tools",
        description="Testing diffing logic",
    )
    project_id = proj["id"]

    # Base report with 2 findings
    base_rep_id = f"rep_base_{uuid.uuid4().hex[:6]}"
    target_rep_id = f"rep_target_{uuid.uuid4().hex[:6]}"
    rev_base = f"rev_{uuid.uuid4().hex[:6]}"
    rev_target = f"rev_{uuid.uuid4().hex[:6]}"

    with db_manager.session() as conn:
        conn.execute("INSERT INTO ai_reviews (id, project_id, user_id, model_id, provider, status, created_at) VALUES (?, ?, ?, 'gemini-2.5-flash', 'gemini', 'completed', datetime('now'))", (rev_base, project_id, user_id))
        conn.execute("INSERT INTO ai_reviews (id, project_id, user_id, model_id, provider, status, created_at) VALUES (?, ?, ?, 'gemini-2.5-flash', 'gemini', 'completed', datetime('now'))", (rev_target, project_id, user_id))

        conn.execute("INSERT INTO feedback_reports (id, review_id, project_id, executive_summary, strengths_summary, total_findings_count, created_at) VALUES (?, ?, ?, 'Base', 'Str', 2, datetime('now'))", (base_rep_id, rev_base, project_id))
        conn.execute("INSERT INTO feedback_reports (id, review_id, project_id, executive_summary, strengths_summary, total_findings_count, created_at) VALUES (?, ?, ?, 'Target', 'Str', 1, datetime('now'))", (target_rep_id, rev_target, project_id))

        # Base findings: Bug 1 (will persist) and Bug 2 (will be omitted in target report)
        conn.execute("INSERT INTO feedback_findings (id, report_id, project_id, title, severity, category, observation, evidence_quote, recommendation, status, created_at, updated_at) VALUES (?, ?, ?, 'Missing Rate Limiter', 'high', 'security', 'obs', 'ev', 'rec', 'open', datetime('now'), datetime('now'))", (f"fnd_1_{project_id[:6]}", base_rep_id, project_id))
        conn.execute("INSERT INTO feedback_findings (id, report_id, project_id, title, severity, category, observation, evidence_quote, recommendation, status, created_at, updated_at) VALUES (?, ?, ?, 'Unencrypted Local Cache', 'medium', 'security', 'obs', 'ev', 'rec', 'open', datetime('now'), datetime('now'))", (f"fnd_2_{project_id[:6]}", base_rep_id, project_id))

        # Target finding: Bug 1 persisted
        conn.execute("INSERT INTO feedback_findings (id, report_id, project_id, title, severity, category, observation, evidence_quote, recommendation, status, created_at, updated_at) VALUES (?, ?, ?, 'Missing Rate Limiter', 'high', 'security', 'obs', 'ev', 'rec', 'open', datetime('now'), datetime('now'))", (f"fnd_3_{project_id[:6]}", target_rep_id, project_id))

    res = client.get(
        f"/api/v1/projects/{project_id}/reports/compare?base_id={base_rep_id}&target_id={target_rep_id}",
        headers=headers,
    )
    assert res.status_code == 200, res.text
    diff = res.json()
    assert diff["resolvedCount"] == 1
    assert diff["persistedCount"] == 1

    # Finding 'Unencrypted Local Cache' was resolved by omission
    omitted = next((item for item in diff["items"] if item["title"] == "Unencrypted Local Cache"), None)
    assert omitted is not None
    assert omitted["changeType"] == "resolved"
    assert omitted["statusInTarget"] is None

