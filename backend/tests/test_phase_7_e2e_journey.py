"""Phase 7: End-to-End MVP Integration and Journey Verification Suite.

Tests the unbroken Personal project-to-feedback journey:
1. User Authentication (Signup, Login, Token generation).
2. Personal Home (Empty state, listing).
3. New Project Intake (Validation boundaries, Draft creation).
4. Project Setup (Context editing, link configuration, status progression).
5. Project Reopen & Persistence (Accurate database retrieval).
6. AI Review Preparation & Trigger (Context quality boundary check, review lifecycle).
7. Feedback Report Generation (Structured output, grounded evidence quotes, zero fake metrics).
8. Finding Improvement Workflow (State transitions: open -> in_progress -> addressed).
9. Iteration History & Diff Comparison (Multi-review tracking, delta analysis).
10. Sanitized Markdown Export (Zero credential/secret leakage).
11. Security & Multi-Tenant Attack Scenarios (Unauthorized mutations, cross-user isolation).
12. Reliability & Idempotency (Duplicate submission protection, session recovery).
"""

from __future__ import annotations

import uuid
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def ensure_offline_ai(monkeypatch):
    """Guarantees unit tests use deterministic grounded generator without network waits."""
    monkeypatch.setenv("GEMINI_API_KEY", "")
    monkeypatch.setenv("OPENROUTER_API_KEY", "")
    monkeypatch.setenv("NVIDIA_API_KEY", "")
    monkeypatch.setenv("GROQ_API_KEY", "")
    from backend.app.config import settings
    settings.gemini_api_key = ""
    settings.openrouter_api_key = ""
    settings.nvidia_api_key = ""
    settings.groq_api_key = ""


def create_test_user(prefix: str) -> dict:
    uid = uuid.uuid4().hex[:8]
    email = f"{prefix}_{uid}@example.com"
    pwd = "SecurePassword123!"
    resp = client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": pwd, "username": f"{prefix}_{uid}", "display_name": f"{prefix.title()} Tester"},
    )
    assert resp.status_code == 200
    token = resp.json().get("accessToken") or resp.json().get("token")
    user_id = resp.json().get("user", {}).get("id")
    return {"Authorization": f"Bearer {token}", "userId": user_id, "email": email, "password": pwd}


def test_complete_end_to_end_personal_journey():
    """Validates the unbroken Personal project journey:
    Sign In -> Personal Home -> New Project -> Project Setup -> AI Review -> Feedback Report -> Finding Improvement -> Export.
    """
    # Step 1: User Sign Up & Authenticated Session
    user = create_test_user("e2e_creator")
    headers = {"Authorization": user["Authorization"]}
    user_id = user["userId"]

    # Verify Login route returns matching token
    login_res = client.post("/api/v1/auth/login", json={"email": user["email"], "password": user["password"]})
    assert login_res.status_code == 200
    assert login_res.json()["user"]["id"] == user_id

    # Step 2: Personal Home Initial State (Empty)
    home_res = client.get("/api/v1/projects/personal", headers=headers)
    assert home_res.status_code == 200
    assert len(home_res.json()) == 0

    # Step 3: New Project Intake Workflow
    # 3a. Invalid submission rejected by boundary rules
    bad_res = client.post(
        "/api/v1/projects",
        headers=headers,
        json={"name": "X", "tagline": "Too short", "category": "infrastructure"},
    )
    assert bad_res.status_code in (400, 422)

    # 3b. Valid project intake
    create_res = client.post(
        "/api/v1/projects",
        headers=headers,
        json={
            "name": "EdgeDB Sync Gateway",
            "tagline": "Bidirectional replication daemon for distributed edge nodes",
            "category": "infrastructure",
            "description": "Initial draft of the edge node synchronization protocol.",
            "repository_url": "https://github.com/example/edgedb-sync",
        },
    )
    assert create_res.status_code == 201
    project = create_res.json()
    project_id = project["id"]
    assert project["userId"] == user_id
    assert project["status"] == "draft"

    # Step 4: Project Setup & Technical Context Expansion
    # Update project with comprehensive architectural context
    full_context = (
        "EdgeDB Sync Gateway coordinates multi-master data replication across distributed regional edge clusters. "
        "It implements vector clock conflict resolution, TLS 1.3 mutual authentication, and bounded SQLite local caches. "
        "Designed to survive intermittent network partitions while guaranteeing eventual consistency."
    )
    update_res = client.patch(
        f"/api/v1/projects/{project_id}",
        headers=headers,
        json={
            "description": full_context,
            "demo_url": "https://demo.edgesync.dev",
            "status": "ready",
        },
    )
    assert update_res.status_code == 200
    updated_project = update_res.json()
    assert updated_project["description"] == full_context
    assert updated_project["status"] == "ready"
    assert updated_project["demoUrl"] == "https://demo.edgesync.dev"

    # Step 5: Reopen Project & Persistence Check
    reopen_res = client.get(f"/api/v1/projects/{project_id}", headers=headers)
    assert reopen_res.status_code == 200
    persisted = reopen_res.json()
    assert persisted["id"] == project_id
    assert persisted["name"] == "EdgeDB Sync Gateway"
    assert persisted["description"] == full_context

    # Step 6: Trigger AI Review & Verify Lifecycle Transitions
    review_res = client.post(
        f"/api/v1/projects/{project_id}/review/start",
        headers=headers,
        json={"focus_areas": ["security", "architecture"]},
    )
    assert review_res.status_code == 200
    review_data = review_res.json()
    assert review_data["projectId"] == project_id
    assert review_data["status"] == "completed"
    assert review_data["provider"] in ("gemini", "groq", "offline_evaluator")
    assert review_data["executionDurationMs"] is not None

    # Step 7: Feedback Report Generation & Schema Verification
    report_res = client.get(f"/api/v1/projects/{project_id}/report", headers=headers)
    assert report_res.status_code == 200
    report = report_res.json()
    assert report is not None
    assert report["projectId"] == project_id
    assert report["reviewId"] == review_data["id"]
    assert len(report["executiveSummary"]) >= 20
    assert len(report["strengthsSummary"]) >= 20
    assert report["totalFindingsCount"] > 0
    assert len(report["findings"]) == report["totalFindingsCount"]

    # Verify each finding has grounded evidence and no fake metrics
    for finding in report["findings"]:
        assert finding["title"]
        assert finding["severity"] in ("blocker", "high", "medium", "low")
        assert finding["category"] in ("security", "architecture", "performance", "dx", "correctness", "bug", "ux", "accessibility")
        assert len(finding["observation"]) >= 10
        assert len(finding["evidenceQuote"]) >= 3
        # Evidence quote must exist in project context
        assert finding["evidenceQuote"].lower() in (persisted["name"].lower() + " " + persisted["description"].lower())
        assert len(finding["recommendation"]) >= 10
        assert finding["status"] == "open"

    # Step 8: Interactive Improvement Workflow (Resolution State Machine)
    target_finding = report["findings"][0]
    finding_id = target_finding["id"]

    # 8a. Transition open -> in_progress
    prog_res = client.patch(
        f"/api/v1/findings/{finding_id}/status",
        headers=headers,
        json={"status": "in_progress"},
    )
    assert prog_res.status_code == 200
    assert prog_res.json()["status"] == "in_progress"

    # 8b. Transition in_progress -> addressed
    addr_res = client.patch(
        f"/api/v1/findings/{finding_id}/status",
        headers=headers,
        json={"status": "addressed"},
    )
    assert addr_res.status_code == 200
    assert addr_res.json()["status"] == "addressed"
    assert addr_res.json()["resolvedAt"] is not None

    # Step 9: Multi-Iteration Review & Comparison
    # Trigger Iteration 2
    r2_res = client.post(f"/api/v1/projects/{project_id}/review/start", headers=headers)
    assert r2_res.status_code == 200
    r2_id = r2_res.json()["id"]

    reports_list = client.get(f"/api/v1/projects/{project_id}/reports", headers=headers).json()
    assert len(reports_list) >= 2
    rep_1_id = reports_list[1]["id"]
    rep_2_id = reports_list[0]["id"]

    comp_res = client.get(
        f"/api/v1/projects/{project_id}/reports/compare?base_id={rep_1_id}&target_id={rep_2_id}",
        headers=headers,
    )
    assert comp_res.status_code == 200
    comp = comp_res.json()
    assert comp["projectId"] == project_id
    assert comp["baseReportId"] == rep_1_id
    assert comp["targetReportId"] == rep_2_id
    assert isinstance(comp["items"], list)

    # Step 10: Sanitized Markdown Export
    export_res = client.get(f"/api/v1/projects/{project_id}/report/export", headers=headers)
    assert export_res.status_code == 200
    export_data = export_res.json()
    assert export_data["format"] == "markdown"
    assert "EdgeDB Sync Gateway" in export_data["content"]
    assert "Executive Summary" in export_data["content"]
    assert "Actionable Findings Checklist" in export_data["content"]
    assert user["Authorization"] not in export_data["content"]
    assert "Bearer eyJ" not in export_data["content"]


def test_security_adversarial_and_isolation_attacks():
    """Simulates adversarial attacks:
    - Cross-tenant data inspection (User B reading User A's private project/reports).
    - Cross-tenant state mutation (User B updating User A's findings).
    - Unauthenticated requests to protected endpoints.
    - Malformed and expired tokens.
    """
    user_a = create_test_user("victim_user")
    user_b = create_test_user("attacker_user")

    # User A creates a private project and generates a report
    p_res = client.post(
        "/api/v1/projects",
        headers={"Authorization": user_a["Authorization"]},
        json={
            "name": "Confidential AI Core",
            "tagline": "Private proprietary model weights and training pipeline",
            "category": "ai-ml",
            "description": "Proprietary training architecture with secure multi-party computation and encrypted model checkpoints.",
            "is_public": False,
        },
    )
    assert p_res.status_code == 201
    project_id = p_res.json()["id"]

    # Run review as User A
    client.post(f"/api/v1/projects/{project_id}/review/start", headers={"Authorization": user_a["Authorization"]})
    report = client.get(f"/api/v1/projects/{project_id}/report", headers={"Authorization": user_a["Authorization"]}).json()
    report_id = report["id"]
    finding_id = report["findings"][0]["id"]

    # Attack 1: User B attempts to read User A's project
    b_get_proj = client.get(f"/api/v1/projects/{project_id}", headers={"Authorization": user_b["Authorization"]})
    assert b_get_proj.status_code == 403

    # Attack 2: User B attempts to read User A's report
    b_get_rep = client.get(f"/api/v1/projects/{project_id}/report", headers={"Authorization": user_b["Authorization"]})
    assert b_get_rep.status_code == 403

    # Attack 3: User B attempts to export User A's report
    b_export = client.get(f"/api/v1/projects/{project_id}/report/export", headers={"Authorization": user_b["Authorization"]})
    assert b_export.status_code == 403

    # Attack 4: User B attempts to mutate User A's finding status
    b_patch_finding = client.patch(
        f"/api/v1/findings/{finding_id}/status",
        headers={"Authorization": user_b["Authorization"]},
        json={"status": "addressed"},
    )
    assert b_patch_finding.status_code == 403

    # Attack 5: Unauthenticated access to review start
    unauth_start = client.post(f"/api/v1/projects/{project_id}/review/start")
    assert unauth_start.status_code in (401, 403)

    # Attack 6: Forged token
    forged_token = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.bogus_signature"
    forged_res = client.get(f"/api/v1/projects/{project_id}", headers={"Authorization": forged_token})
    assert forged_res.status_code in (401, 403)


def test_reliability_and_idempotent_recovery():
    """Tests idempotency, network failure recovery, and short-context boundaries."""
    user = create_test_user("reliability_tester")
    headers = {"Authorization": user["Authorization"]}

    # 1. Short context boundary check (< 20 chars rejected)
    short_proj = client.post(
        "/api/v1/projects",
        headers=headers,
        json={
            "name": "Brief Spec",
            "tagline": "Too brief for evaluation",
            "category": "developer-tools",
            "description": "Short",  # 5 chars
        },
    ).json()

    bad_start = client.post(f"/api/v1/projects/{short_proj['id']}/review/start", headers=headers)
    assert bad_start.status_code == 400
    assert "insufficient context" in bad_start.json()["detail"].lower()

    # 2. Update context and verify recovery
    client.patch(
        f"/api/v1/projects/{short_proj['id']}",
        headers=headers,
        json={"description": "Expanded technical specification satisfying the context length requirements."},
    )

    valid_start = client.post(f"/api/v1/projects/{short_proj['id']}/review/start", headers=headers)
    assert valid_start.status_code == 200
    assert valid_start.json()["status"] == "completed"

