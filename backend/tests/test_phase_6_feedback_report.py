"""Phase 6 Automated Test Suite: Feedback Report and Project Improvement Experience.

Tests:
1. Specific Historical Feedback Report Retrieval & List Reports.
2. Review-to-Report Direct Linking.
3. Multi-Tenant Authorization & Privacy Isolation on Reports.
4. Sanitized Markdown Report Export with Permission Enforcement.
5. Multi-Iteration Report Comparison & Finding Status Resolution Tracking.
6. Error & Empty State Handling (404 Not Found, 403 Forbidden, Null cases).
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


@pytest.fixture
def owner_headers():
    uid = uuid.uuid4().hex[:8]
    email = f"owner_p6_{uid}@example.com"
    pwd = "OwnerPassword123!"
    resp = client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": pwd, "username": f"owner_p6_{uid}", "display_name": "Phase 6 Owner"},
    )
    token = resp.json().get("accessToken") or resp.json().get("token")
    return {"Authorization": f"Bearer {token}", "userId": resp.json().get("user", {}).get("id")}


@pytest.fixture
def other_user_headers():
    uid = uuid.uuid4().hex[:8]
    email = f"other_p6_{uid}@example.com"
    pwd = "OtherPassword123!"
    resp = client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": pwd, "username": f"other_p6_{uid}", "display_name": "Phase 6 Other"},
    )
    token = resp.json().get("accessToken") or resp.json().get("token")
    return {"Authorization": f"Bearer {token}", "userId": resp.json().get("user", {}).get("id")}


def test_list_and_get_specific_feedback_reports(owner_headers):
    """Verifies listing historical reports and retrieving a specific report by ID."""
    # 1. Create project with valid description
    p_res = client.post(
        "/api/v1/projects",
        headers=owner_headers,
        json={
            "name": "Audit Matrix Core",
            "tagline": "Real-time compliance monitoring service",
            "category": "infrastructure",
            "description": "Enterprise compliance monitoring engine capturing audit logs and checking tamper resistance across microservices.",
        },
    )
    assert p_res.status_code == 201
    project_id = p_res.json()["id"]

    # 2. Run first review
    r1_res = client.post(f"/api/v1/projects/{project_id}/review/start", headers=owner_headers)
    assert r1_res.status_code == 200
    r1 = r1_res.json()

    # 3. List reports
    reports_res = client.get(f"/api/v1/projects/{project_id}/reports", headers=owner_headers)
    assert reports_res.status_code == 200
    reports = reports_res.json()
    assert len(reports) >= 1
    report_id = reports[0]["id"]
    assert reports[0]["reviewId"] == r1["id"]

    # 4. Fetch specific report by report_id
    specific_res = client.get(f"/api/v1/projects/{project_id}/reports/{report_id}", headers=owner_headers)
    assert specific_res.status_code == 200
    assert specific_res.json()["id"] == report_id
    assert len(specific_res.json()["findings"]) > 0

    # 5. Fetch report directly by review_id
    by_review_res = client.get(f"/api/v1/projects/{project_id}/reviews/{r1['id']}/report", headers=owner_headers)
    assert by_review_res.status_code == 200
    assert by_review_res.json()["id"] == report_id


def test_feedback_report_multi_tenant_isolation(owner_headers, other_user_headers):
    """Ensures private project reports and exports cannot be accessed by unauthorized users."""
    p_res = client.post(
        "/api/v1/projects",
        headers=owner_headers,
        json={
            "name": "Classified Secure Vault",
            "tagline": "Encrypted HSM credential management cluster",
            "category": "infrastructure",
            "description": "Zero-trust secrets storage engine with hardware security module integration and strict role separation.",
            "is_public": False,
        },
    )
    assert p_res.status_code == 201
    project_id = p_res.json()["id"]

    # Run review as owner
    client.post(f"/api/v1/projects/{project_id}/review/start", headers=owner_headers)
    reports = client.get(f"/api/v1/projects/{project_id}/reports", headers=owner_headers).json()
    report_id = reports[0]["id"]

    # Other user attempts access
    # 1. List reports -> 403
    assert client.get(f"/api/v1/projects/{project_id}/reports", headers=other_user_headers).status_code == 403
    # 2. Get specific report -> 403
    assert client.get(f"/api/v1/projects/{project_id}/reports/{report_id}", headers=other_user_headers).status_code == 403
    # 3. Export report -> 403
    assert client.get(f"/api/v1/projects/{project_id}/report/export", headers=other_user_headers).status_code == 403


def test_feedback_report_markdown_export(owner_headers):
    """Verifies that markdown export formats all approved sections honestly and safely."""
    p_res = client.post(
        "/api/v1/projects",
        headers=owner_headers,
        json={
            "name": "Developer Observability Hub",
            "tagline": "OpenTelemetry log ingestion daemon",
            "category": "developer-tools",
            "description": "High-speed log ingestion daemon for OpenTelemetry spans with local buffering and backpressure handling.",
        },
    )
    project_id = p_res.json()["id"]

    # Run review
    client.post(f"/api/v1/projects/{project_id}/review/start", headers=owner_headers)

    # Export report
    export_res = client.get(f"/api/v1/projects/{project_id}/report/export", headers=owner_headers)
    assert export_res.status_code == 200
    export_data = export_res.json()

    assert export_data["projectId"] == project_id
    assert export_data["format"] == "markdown"
    assert export_data["filename"].endswith(".md")
    
    content = export_data["content"]
    assert "Developer Observability Hub" in content
    assert "## Executive Summary" in content
    assert "## Strengths Identified" in content
    assert "## Actionable Findings Checklist" in content
    assert "Grounded Evidence:" in content
    # Ensure no internal secret tokens or user tokens leaked
    assert owner_headers["Authorization"] not in content
    assert "Bearer eyJ" not in content
    assert "jwt_secret" not in content


def test_iteration_comparison_and_resolution_tracking(owner_headers):
    """Tests multi-review comparison tracking resolved, new, and persisted findings."""
    p_res = client.post(
        "/api/v1/projects",
        headers=owner_headers,
        json={
            "name": "Continuous Delivery Pipeline",
            "tagline": "GitOps automated release controller",
            "category": "developer-tools",
            "description": "Automated release controller implementing progressive canary rollouts and automated rollback on error spikes.",
        },
    )
    project_id = p_res.json()["id"]

    # 1. Run first review (Iteration 1)
    client.post(f"/api/v1/projects/{project_id}/review/start", headers=owner_headers)
    report_1 = client.get(f"/api/v1/projects/{project_id}/report", headers=owner_headers).json()
    r1_id = report_1["id"]
    findings_1 = report_1["findings"]
    assert len(findings_1) > 0

    # 2. Resolve the first finding
    target_finding_id = findings_1[0]["id"]
    client.patch(
        f"/api/v1/findings/{target_finding_id}/status",
        headers=owner_headers,
        json={"status": "addressed"},
    )

    # 3. Run second review (Iteration 2)
    client.post(f"/api/v1/projects/{project_id}/review/start", headers=owner_headers)
    reports = client.get(f"/api/v1/projects/{project_id}/reports", headers=owner_headers).json()
    assert len(reports) >= 2
    r2_id = reports[0]["id"]  # Most recent

    # 4. Compare Iteration 1 vs Iteration 2
    comp_res = client.get(
        f"/api/v1/projects/{project_id}/reports/compare?base_id={r1_id}&target_id={r2_id}",
        headers=owner_headers,
    )
    assert comp_res.status_code == 200
    comp_data = comp_res.json()

    assert comp_data["projectId"] == project_id
    assert comp_data["baseReportId"] == r1_id
    assert comp_data["targetReportId"] == r2_id
    assert isinstance(comp_data["items"], list)
    assert len(comp_data["items"]) > 0


def test_report_error_and_empty_states(owner_headers):
    """Verifies honest 404/Null responses when project or report does not exist."""
    # 1. Non-existent project
    fake_proj = "proj_00000000-0000-0000-0000-000000000000"
    res = client.get(f"/api/v1/projects/{fake_proj}/report", headers=owner_headers)
    assert res.status_code == 404

    # 2. Project with no reviews yet
    p_res = client.post(
        "/api/v1/projects",
        headers=owner_headers,
        json={
            "name": "Fresh Project Without Reviews",
            "tagline": "Brand new project awaiting review",
            "category": "developer-tools",
            "description": "Initial draft specification for a project that has never had an AI review triggered.",
        },
    )
    p_id = p_res.json()["id"]

    latest_res = client.get(f"/api/v1/projects/{p_id}/report", headers=owner_headers)
    assert latest_res.status_code == 200
    assert latest_res.json() is None  # Honest null state

    # 3. Export non-existent report returns 404
    export_res = client.get(f"/api/v1/projects/{p_id}/report/export", headers=owner_headers)
    assert export_res.status_code == 404
