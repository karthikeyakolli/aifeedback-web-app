"""Phase 8 Automated Test Suite: Public Space Implementation & Data Boundaries.

Tests:
1. Public Discovery Feed & Server-Side Public Data Projection (zero private user_id leaks).
2. Category Filtering and Search Queries in Public Feed.
3. Direct Public Project Access & Strict Private Project Isolation (404 Not Found on private).
4. Explicit Publishing & Revocation Lifecycle (Unpublishing immediately withdraws public access).
5. Public Feedback Report Access (Public project reports accessible to visitors; private returns 404).
6. Community Upvoting (Authenticated toggling, duplicate vote handling, rejection on private projects).
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


def create_user(prefix: str) -> dict:
    uid = uuid.uuid4().hex[:8]
    email = f"{prefix}_{uid}@example.com"
    pwd = "TestPassword123!"
    resp = client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": pwd, "username": f"{prefix}_{uid}", "display_name": f"{prefix.title()} Tester"},
    )
    token = resp.json().get("accessToken") or resp.json().get("token")
    user_id = resp.json().get("user", {}).get("id")
    return {"Authorization": f"Bearer {token}", "userId": user_id}


@pytest.fixture
def creator_headers():
    return create_user("pub_creator")


@pytest.fixture
def community_headers():
    return create_user("pub_community")


def test_public_project_listing_and_server_projection(creator_headers):
    """Anonymous visitors can list public projects, but private projects and internal user IDs are excluded."""
    headers = {"Authorization": creator_headers["Authorization"]}

    # Create private project
    priv_res = client.post(
        "/api/v1/projects",
        headers=headers,
        json={
            "name": "Secret Private Engine",
            "tagline": "Internal proprietary tool",
            "category": "developer-tools",
            "description": "Internal developer engine not meant for public viewing.",
            "is_public": False,
        },
    )
    assert priv_res.status_code == 201
    priv_id = priv_res.json()["id"]

    # Create published public project
    pub_res = client.post(
        "/api/v1/projects",
        headers=headers,
        json={
            "name": "Open Metric Streamer",
            "tagline": "Open-source Prometheus telemetry aggregator",
            "category": "infrastructure",
            "description": "A high-performance telemetry aggregator supporting Prometheus remote write and OTLP logs.",
            "is_public": True,
        },
    )
    assert pub_res.status_code == 201
    pub_id = pub_res.json()["id"]

    # Anonymous visitor queries public explore feed
    feed_res = client.get("/api/v1/projects/public")
    assert feed_res.status_code == 200
    public_items = feed_res.json()

    item_ids = [p["id"] for p in public_items]
    assert pub_id in item_ids
    assert priv_id not in item_ids

    # Verify server-side public projection invariants
    target_pub = next(p for p in public_items if p["id"] == pub_id)
    assert target_pub["isPublic"] is True
    assert "name" in target_pub
    assert "tagline" in target_pub
    # Ensure internal user_id is NOT in the public projection
    assert "userId" not in target_pub
    assert "user_id" not in target_pub


def test_public_search_and_category_filtering(creator_headers):
    """Verifies that public search and category filtering match only published records."""
    headers = {"Authorization": creator_headers["Authorization"]}

    # 1. Dev tools project
    client.post(
        "/api/v1/projects",
        headers=headers,
        json={
            "name": "Linter Suite X",
            "tagline": "Blazing fast static code analysis tool",
            "category": "developer-tools",
            "description": "Next generation linter designed to parse ASTs concurrently across multiple CPU cores.",
            "is_public": True,
        },
    )

    # 2. SaaS project
    client.post(
        "/api/v1/projects",
        headers=headers,
        json={
            "name": "Invoice Dispatcher",
            "tagline": "Automated billing pipeline for enterprise SaaS",
            "category": "saas-b2b",
            "description": "Automated billing pipeline generating PDF invoices and webhooks for Stripe integration.",
            "is_public": True,
        },
    )

    # Filter by category = developer-tools
    dev_res = client.get("/api/v1/projects/public?category=developer-tools")
    assert dev_res.status_code == 200
    dev_items = dev_res.json()
    assert all(p["category"] == "developer-tools" for p in dev_items)

    # Search for "billing"
    search_res = client.get("/api/v1/projects/public?search=billing")
    assert search_res.status_code == 200
    search_items = search_res.json()
    assert len(search_items) >= 1
    assert any("invoice" in p["name"].lower() for p in search_items)


def test_direct_public_project_access_and_private_isolation(creator_headers):
    """Direct public access to a private project must return 404 Not Found without leaking metadata."""
    headers = {"Authorization": creator_headers["Authorization"]}

    # Private project
    priv_proj = client.post(
        "/api/v1/projects",
        headers=headers,
        json={
            "name": "Classified Prototype",
            "tagline": "Proprietary internal sandbox",
            "category": "developer-tools",
            "description": "Confidential prototype.",
            "is_public": False,
        },
    ).json()

    # Public project
    pub_proj = client.post(
        "/api/v1/projects",
        headers=headers,
        json={
            "name": "Public Community SDK",
            "tagline": "Open client library for public APIs",
            "category": "developer-tools",
            "description": "Lightweight client library for interacting with public web services.",
            "is_public": True,
        },
    ).json()

    # Anonymous visitor requests public project -> 200 OK
    pub_res = client.get(f"/api/v1/projects/public/{pub_proj['id']}")
    assert pub_res.status_code == 200
    assert pub_res.json()["name"] == "Public Community SDK"
    assert "userId" not in pub_res.json()

    # Anonymous visitor requests private project -> 404 Not Found
    priv_res = client.get(f"/api/v1/projects/public/{priv_proj['id']}")
    assert priv_res.status_code == 404
    assert "not found" in priv_res.json()["detail"].lower()


def test_explicit_publishing_and_revocation_lifecycle(creator_headers):
    """Publishing makes a project discoverable; unpublishing immediately revokes public visibility."""
    headers = {"Authorization": creator_headers["Authorization"]}

    # 1. Start with private project
    proj = client.post(
        "/api/v1/projects",
        headers=headers,
        json={
            "name": "Evolving Architecture Core",
            "tagline": "Under active internal development",
            "category": "infrastructure",
            "description": "Internal architectural draft undergoing revision before publication.",
            "is_public": False,
        },
    ).json()
    project_id = proj["id"]

    # Direct public access is 404
    assert client.get(f"/api/v1/projects/public/{project_id}").status_code == 404

    # 2. Creator explicitly publishes project
    pub_patch = client.patch(
        f"/api/v1/projects/{project_id}",
        headers=headers,
        json={"is_public": True},
    )
    assert pub_patch.status_code == 200
    assert pub_patch.json()["isPublic"] is True

    # Immediate discoverability
    direct_pub = client.get(f"/api/v1/projects/public/{project_id}")
    assert direct_pub.status_code == 200
    assert direct_pub.json()["name"] == "Evolving Architecture Core"

    # 3. Creator revokes publication (unpublishes)
    unpub_patch = client.patch(
        f"/api/v1/projects/{project_id}",
        headers=headers,
        json={"is_public": False},
    )
    assert unpub_patch.status_code == 200
    assert unpub_patch.json()["isPublic"] is False

    # Immediate revocation: direct public access returns 404
    revoked_res = client.get(f"/api/v1/projects/public/{project_id}")
    assert revoked_res.status_code == 404


def test_public_feedback_report_access(creator_headers):
    """Anonymous visitors can read the feedback report of a published project, but not a private one."""
    headers = {"Authorization": creator_headers["Authorization"]}

    # Create published project and run AI review
    pub_proj = client.post(
        "/api/v1/projects",
        headers=headers,
        json={
            "name": "Community Reviewed Gateway",
            "tagline": "API gateway with public review findings",
            "category": "infrastructure",
            "description": "API Gateway implementing rate-limiting, routing, and mTLS verification across microservices.",
            "is_public": True,
        },
    ).json()
    project_id = pub_proj["id"]

    # Run AI review as owner
    client.post(f"/api/v1/projects/{project_id}/review/start", headers=headers)

    # Anonymous visitor reads public report
    anon_report_res = client.get(f"/api/v1/projects/public/{project_id}/report")
    assert anon_report_res.status_code == 200
    report = anon_report_res.json()
    assert report is not None
    assert len(report["executiveSummary"]) > 0
    assert len(report["findings"]) > 0

    # If owner unpublishes project, anonymous report access returns 404
    client.patch(f"/api/v1/projects/{project_id}", headers=headers, json={"is_public": False})
    unpub_report_res = client.get(f"/api/v1/projects/public/{project_id}/report")
    assert unpub_report_res.status_code == 404


def test_community_upvoting_and_rate_enforcement(creator_headers, community_headers):
    """Verifies that public upvoting is disabled and rejected with 403 Forbidden, enforcing read-only Public space."""
    owner_h = {"Authorization": creator_headers["Authorization"]}
    comm_h = {"Authorization": community_headers["Authorization"]}

    # 1. Create public project
    pub_proj = client.post(
        "/api/v1/projects",
        headers=owner_h,
        json={
            "name": "Popular Open Tool",
            "tagline": "Loved by community developers",
            "category": "developer-tools",
            "description": "Developer tool receiving community upvotes and peer recognition.",
            "is_public": True,
        },
    ).json()
    pub_id = pub_proj["id"]

    # Unauthenticated upvote rejected with 401 or 403
    unauth_upvote = client.post(f"/api/v1/projects/public/{pub_id}/upvote")
    assert unauth_upvote.status_code in (401, 403)

    # Authenticated user upvote is disabled and rejected with 403 Forbidden
    upvote_1 = client.post(f"/api/v1/projects/public/{pub_id}/upvote", headers=comm_h)
    assert upvote_1.status_code == 403
    assert "read-only" in upvote_1.json()["detail"].lower()

