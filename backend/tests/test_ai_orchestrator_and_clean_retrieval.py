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
