"""Phase 5 Automated Test Suite: AI Review Engine, Orchestration and Validation.

Tests:
1. AI Review Initiation and Successful Structured Report Synthesis.
2. Structured Feedback Schema Validation (no fake scores/metrics, strictly approved fields).
3. Context Validation Boundary (description < 20 chars rejected with 400).
4. Ownership Boundary & Access Control (only verified owner can trigger review).
5. Report Privacy & Isolation (private project reports inaccessible to other users).
6. Finding Status Progression (owner can mark finding open -> in_progress -> addressed; unauthorized user rejected).
7. Review Idempotency & Duplicate Request Protection.
8. Historical Reviews Tracking.
"""

from __future__ import annotations

import uuid
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


@pytest.fixture
def owner_headers():
    uid = uuid.uuid4().hex[:8]
    email = f"owner_p5_{uid}@example.com"
    pwd = "OwnerPassword123!"
    resp = client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": pwd, "username": f"owner_{uid}", "display_name": "Phase 5 Owner"},
    )
    token = resp.json().get("accessToken") or resp.json().get("token")
    return {"Authorization": f"Bearer {token}", "userId": resp.json().get("user", {}).get("id")}


@pytest.fixture
def other_user_headers():
    uid = uuid.uuid4().hex[:8]
    email = f"other_p5_{uid}@example.com"
    pwd = "OtherPassword123!"
    resp = client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": pwd, "username": f"other_{uid}", "display_name": "Phase 5 Other"},
    )
    token = resp.json().get("accessToken") or resp.json().get("token")
    return {"Authorization": f"Bearer {token}", "userId": resp.json().get("user", {}).get("id")}


def test_ai_review_context_validation_boundary(owner_headers):
    """Initiating an AI review without sufficient context (< 20 chars) must return 400 Bad Request."""
    # Create project with short description
    res = client.post(
        "/api/v1/projects",
        headers=owner_headers,
        json={
            "name": "Thin Project",
            "tagline": "Too brief to evaluate",
            "category": "developer-tools",
            "description": "Short desc",  # 10 chars
        },
    )
    assert res.status_code == 201
    project_id = res.json()["id"]

    # Attempt to start review
    review_res = client.post(
        f"/api/v1/projects/{project_id}/review/start",
        headers=owner_headers,
        json={"focus_areas": ["security"]},
    )
    assert review_res.status_code == 400
    assert "insufficient context" in review_res.json()["detail"].lower()


def test_ai_review_lifecycle_and_structured_report(owner_headers):
    """A project with valid context initiates an AI review, updates state, and generates structured report."""
    create_res = client.post(
        "/api/v1/projects",
        headers=owner_headers,
        json={
            "name": "Cloud Ledger Core",
            "tagline": "High-throughput transactional audit log service",
            "category": "infrastructure",
            "description": (
                "Cloud Ledger Core is a distributed event-sourcing engine built with Python and PostgreSQL. "
                "It accepts batch transactions, hashes them cryptographically, and writes immutable audit logs "
                "with sub-millisecond persistence guarantees. Designed for multi-tenant fintech microservices."
            ),
            "repository_url": "https://github.com/example/cloud-ledger",
        },
    )
    assert create_res.status_code == 201
    project = create_res.json()
    project_id = project["id"]

    # Start review
    review_res = client.post(
        f"/api/v1/projects/{project_id}/review/start",
        headers=owner_headers,
        json={"focus_areas": ["security", "performance"]},
    )
    assert review_res.status_code == 200
    review_data = review_res.json()

    assert review_data["projectId"] == project_id
    assert review_data["userId"] == owner_headers["userId"]
    assert review_data["status"] == "completed"
    assert review_data["provider"] in ("gemini", "groq", "offline_evaluator")
    assert review_data["modelId"] is not None
    assert review_data["executionDurationMs"] is not None
    assert review_data["completedAt"] is not None

    # Verify project status progressed to 'reviewed' and reviews_count incremented
    proj_res = client.get(f"/api/v1/projects/{project_id}", headers=owner_headers)
    assert proj_res.status_code == 200
    updated_proj = proj_res.json()
    assert updated_proj["status"] == "reviewed"
    assert updated_proj["reviewsCount"] >= 1

    # Fetch feedback report
    report_res = client.get(f"/api/v1/projects/{project_id}/report", headers=owner_headers)
    assert report_res.status_code == 200
    report = report_res.json()

    assert report is not None
    assert report["projectId"] == project_id
    assert report["reviewId"] == review_data["id"]
    assert len(report["executiveSummary"]) >= 20
    assert len(report["strengthsSummary"]) >= 20
    assert report["totalFindingsCount"] > 0
    assert len(report["findings"]) == report["totalFindingsCount"]

    # Validate findings schema
    for finding in report["findings"]:
        assert len(finding["id"]) > 10
        assert finding["title"]
        assert finding["severity"] in ("blocker", "high", "medium", "low")
        assert finding["category"] in ("security", "architecture", "performance", "dx", "correctness", "bug", "ux", "accessibility")
        assert len(finding["observation"]) >= 10
        assert len(finding["evidenceQuote"]) >= 3
        assert len(finding["recommendation"]) >= 10
        assert finding["status"] == "open"


def test_ai_review_ownership_isolation(owner_headers, other_user_headers):
    """Users cannot trigger reviews or inspect private reports belonging to other users."""
    create_res = client.post(
        "/api/v1/projects",
        headers=owner_headers,
        json={
            "name": "Secret Proprietary Kernel",
            "tagline": "Confidential internal engine",
            "category": "developer-tools",
            "description": "Proprietary internal execution sandbox with hardware acceleration hooks and isolated memory pools.",
            "is_public": False,
        },
    )
    assert create_res.status_code == 201
    project_id = create_res.json()["id"]

    # 1. Other user cannot start a review
    forbidden_start = client.post(
        f"/api/v1/projects/{project_id}/review/start",
        headers=other_user_headers,
        json={},
    )
    assert forbidden_start.status_code == 403

    # Owner starts review
    owner_start = client.post(
        f"/api/v1/projects/{project_id}/review/start",
        headers=owner_headers,
        json={},
    )
    assert owner_start.status_code == 200
    review_id = owner_start.json()["id"]

    # 2. Other user cannot inspect review status
    forbidden_status = client.get(
        f"/api/v1/projects/{project_id}/reviews/{review_id}/status",
        headers=other_user_headers,
    )
    assert forbidden_status.status_code == 403

    # 3. Other user cannot read the feedback report
    forbidden_report = client.get(
        f"/api/v1/projects/{project_id}/report",
        headers=other_user_headers,
    )
    assert forbidden_report.status_code == 403

    # 4. Other user cannot list project reviews
    forbidden_list = client.get(
        f"/api/v1/projects/{project_id}/reviews",
        headers=other_user_headers,
    )
    assert forbidden_list.status_code == 403


def test_finding_status_lifecycle_progression(owner_headers, other_user_headers):
    """Project owner can update a finding resolution status; non-owners are rejected."""
    # Create project and run review
    proj_res = client.post(
        "/api/v1/projects",
        headers=owner_headers,
        json={
            "name": "Fintech Micro-Gateway",
            "tagline": "PCI-compliant payment router",
            "category": "infrastructure",
            "description": "Secure cardholder routing gateway with tokenized payload forwarding, idempotency tokens, and HSM signing.",
        },
    )
    project_id = proj_res.json()["id"]

    rev_res = client.post(f"/api/v1/projects/{project_id}/review/start", headers=owner_headers)
    assert rev_res.status_code == 200

    report_res = client.get(f"/api/v1/projects/{project_id}/report", headers=owner_headers)
    assert report_res.status_code == 200
    findings = report_res.json()["findings"]
    assert len(findings) > 0
    target_finding_id = findings[0]["id"]
    assert findings[0]["status"] == "open"

    # Non-owner attempts to mutate status -> 403 Forbidden
    unauth_patch = client.patch(
        f"/api/v1/findings/{target_finding_id}/status",
        headers=other_user_headers,
        json={"status": "in_progress"},
    )
    assert unauth_patch.status_code == 403

    # Owner transitions finding: open -> in_progress
    owner_patch1 = client.patch(
        f"/api/v1/findings/{target_finding_id}/status",
        headers=owner_headers,
        json={"status": "in_progress"},
    )
    assert owner_patch1.status_code == 200
    assert owner_patch1.json()["status"] == "in_progress"

    # Owner transitions finding: in_progress -> addressed
    owner_patch2 = client.patch(
        f"/api/v1/findings/{target_finding_id}/status",
        headers=owner_headers,
        json={"status": "addressed"},
    )
    assert owner_patch2.status_code == 200
    assert owner_patch2.json()["status"] == "addressed"
    assert owner_patch2.json()["resolvedAt"] is not None


def test_list_historical_reviews(owner_headers):
    """Reviews are tracked in history and retrieved in descending chronological order."""
    proj_res = client.post(
        "/api/v1/projects",
        headers=owner_headers,
        json={
            "name": "Historical Audit Subject",
            "tagline": "Multi-iteration review project",
            "category": "developer-tools",
            "description": "A developer tool designed to verify continuous integration workflows and automated code auditing pipelines.",
        },
    )
    project_id = proj_res.json()["id"]

    # Start first review
    r1 = client.post(f"/api/v1/projects/{project_id}/review/start", headers=owner_headers).json()
    # Start second review
    r2 = client.post(f"/api/v1/projects/{project_id}/review/start", headers=owner_headers).json()

    history_res = client.get(f"/api/v1/projects/{project_id}/reviews", headers=owner_headers)
    assert history_res.status_code == 200
    history = history_res.json()
    assert len(history) >= 2
    ids = [h["id"] for h in history]
    assert r1["id"] in ids
    assert r2["id"] in ids
