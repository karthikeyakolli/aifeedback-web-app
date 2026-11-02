"""Integration tests for Phase 4 Personal Project Management and Project Intake."""

import uuid
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


@pytest.fixture
def user_a():
    uid = uuid.uuid4().hex[:8]
    email = f"alice_p4_{uid}@example.com"
    pwd = "AlicePassword123!"
    resp = client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": pwd, "username": f"alice_{uid}", "display_name": "Alice Developer"},
    )
    token = resp.json().get("accessToken") or resp.json().get("token")
    return {"Authorization": f"Bearer {token}", "userId": resp.json().get("user", {}).get("id")}


@pytest.fixture
def user_b():
    uid = uuid.uuid4().hex[:8]
    email = f"bob_p4_{uid}@example.com"
    pwd = "BobPassword123!"
    resp = client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": pwd, "username": f"bob_{uid}", "display_name": "Bob Reviewer"},
    )
    token = resp.json().get("accessToken") or resp.json().get("token")
    return {"Authorization": f"Bearer {token}", "userId": resp.json().get("user", {}).get("id")}


def test_create_project_full_intake_workflow(user_a):
    """Verifies complete project creation intake workflow with all approved fields."""
    payload = {
        "name": "Distributed Raft Key-Value Store",
        "tagline": "High-availability consensus engine with zero external dependencies",
        "category": "infrastructure",
        "description": "Implementation of the Raft consensus algorithm featuring leader election and log replication.",
        "repository_url": "https://github.com/example/raft-kv",
        "demo_url": "https://raft-kv-demo.dev",
    }
    resp = client.post("/api/v1/projects", json=payload, headers={"Authorization": user_a["Authorization"]})
    assert resp.status_code == 201
    data = resp.json()

    # Verify field persistence
    assert data["name"] == payload["name"]
    assert data["tagline"] == payload["tagline"]
    assert data["category"] == payload["category"]
    assert data["description"] == payload["description"]
    assert data["repositoryUrl"] == payload["repository_url"]
    assert data["demoUrl"] == payload["demo_url"]

    # Verify approved defaults
    assert data["status"] == "draft"
    assert data["isPublic"] is False
    assert data["upvotesCount"] == 0
    assert data["reviewsCount"] == 0
    assert data["id"] is not None
    assert data["createdAt"] is not None
    assert data["updatedAt"] is not None


def test_field_validation_boundaries(user_a):
    """Enforces strict server-side validation on string lengths, categories, and required fields."""
    headers = {"Authorization": user_a["Authorization"]}

    # Name too short (< 3 chars)
    res1 = client.post(
        "/api/v1/projects",
        json={"name": "AB", "tagline": "Valid length tagline here", "category": "developer-tools"},
        headers=headers,
    )
    assert res1.status_code == 422

    # Name too long (> 120 chars)
    res2 = client.post(
        "/api/v1/projects",
        json={"name": "A" * 121, "tagline": "Valid length tagline here", "category": "developer-tools"},
        headers=headers,
    )
    assert res2.status_code == 422

    # Tagline too short (< 10 chars)
    res3 = client.post(
        "/api/v1/projects",
        json={"name": "Valid Name", "tagline": "Too short", "category": "developer-tools"},
        headers=headers,
    )
    assert res3.status_code == 422

    # Tagline too long (> 200 chars)
    res4 = client.post(
        "/api/v1/projects",
        json={"name": "Valid Name", "tagline": "T" * 201, "category": "developer-tools"},
        headers=headers,
    )
    assert res4.status_code == 422

    # Invalid Category enum
    res5 = client.post(
        "/api/v1/projects",
        json={"name": "Valid Name", "tagline": "Valid length tagline here", "category": "unsupported-category"},
        headers=headers,
    )
    assert res5.status_code == 422

    # Missing required name
    res6 = client.post(
        "/api/v1/projects",
        json={"tagline": "Valid length tagline here", "category": "developer-tools"},
        headers=headers,
    )
    assert res6.status_code == 422


def test_reopen_and_update_project(user_a):
    """Verifies that an existing project can be reopened, viewed, and updated."""
    headers = {"Authorization": user_a["Authorization"]}

    # 1. Create project
    create_res = client.post(
        "/api/v1/projects",
        json={
            "name": "Initial Prototype Draft",
            "tagline": "First iteration summary before setup",
            "category": "productivity",
            "description": "Initial brief description.",
        },
        headers=headers,
    )
    assert create_res.status_code == 201
    proj_id = create_res.json()["id"]

    # 2. Reopen / Retrieve project by ID
    get_res = client.get(f"/api/v1/projects/{proj_id}", headers=headers)
    assert get_res.status_code == 200
    reopened = get_res.json()
    assert reopened["id"] == proj_id
    assert reopened["name"] == "Initial Prototype Draft"

    # 3. Update fields in Project Setup
    patch_payload = {
        "name": "Refactored Core Engine",
        "tagline": "Enhanced description with full technical specifications",
        "description": "# Architectural Overview\n\nThis system implements a lock-free work-stealing thread pool.",
        "repository_url": "https://github.com/example/thread-pool",
        "demo_url": "https://pool-benchmark.dev",
        "status": "ready",
    }
    patch_res = client.patch(f"/api/v1/projects/{proj_id}", json=patch_payload, headers=headers)
    assert patch_res.status_code == 200
    updated = patch_res.json()

    assert updated["name"] == "Refactored Core Engine"
    assert updated["status"] == "ready"
    assert "lock-free" in updated["description"]
    assert updated["repositoryUrl"] == "https://github.com/example/thread-pool"

    # 4. Verify persistent read after reopening again
    verify_res = client.get(f"/api/v1/projects/{proj_id}", headers=headers)
    assert verify_res.status_code == 200
    assert verify_res.json()["name"] == "Refactored Core Engine"
    assert verify_res.json()["status"] == "ready"


def test_lifecycle_status_progression(user_a):
    """Verifies approved status progression: draft -> ready -> in_review -> reviewed -> archived."""
    headers = {"Authorization": user_a["Authorization"]}

    # Create draft
    res = client.post(
        "/api/v1/projects",
        json={"name": "Lifecycle Engine", "tagline": "Testing state machine transitions", "category": "developer-tools"},
        headers=headers,
    )
    assert res.status_code == 201
    proj_id = res.json()["id"]
    assert res.json()["status"] == "draft"

    # Progress to ready
    res_ready = client.patch(f"/api/v1/projects/{proj_id}", json={"status": "ready"}, headers=headers)
    assert res_ready.status_code == 200
    assert res_ready.json()["status"] == "ready"

    # Progress to in_review
    res_reviewing = client.patch(f"/api/v1/projects/{proj_id}", json={"status": "in_review"}, headers=headers)
    assert res_reviewing.status_code == 200
    assert res_reviewing.json()["status"] == "in_review"

    # Progress to reviewed
    res_reviewed = client.patch(f"/api/v1/projects/{proj_id}", json={"status": "reviewed"}, headers=headers)
    assert res_reviewed.status_code == 200
    assert res_reviewed.json()["status"] == "reviewed"

    # Archive project
    res_archived = client.patch(f"/api/v1/projects/{proj_id}", json={"status": "archived"}, headers=headers)
    assert res_archived.status_code == 200
    assert res_archived.json()["status"] == "archived"


def test_delete_project_and_cascade(user_a):
    """Verifies that project deletion removes project and cascades cleanly."""
    headers = {"Authorization": user_a["Authorization"]}

    create_res = client.post(
        "/api/v1/projects",
        json={"name": "Doomed Project", "tagline": "Will be deleted immediately", "category": "productivity"},
        headers=headers,
    )
    assert create_res.status_code == 201
    proj_id = create_res.json()["id"]

    # Delete project
    del_res = client.delete(f"/api/v1/projects/{proj_id}", headers=headers)
    assert del_res.status_code in (200, 204)

    # Project is gone -> 404
    get_res = client.get(f"/api/v1/projects/{proj_id}", headers=headers)
    assert get_res.status_code == 404


def test_cross_user_isolation(user_a, user_b):
    """Enforces that User B cannot read, edit, or delete User A's private project."""
    headers_a = {"Authorization": user_a["Authorization"]}
    headers_b = {"Authorization": user_b["Authorization"]}

    # User A creates private project
    create_res = client.post(
        "/api/v1/projects",
        json={"name": "Alice Secret Project", "tagline": "Confidential algorithm design", "category": "ai-ml"},
        headers=headers_a,
    )
    proj_id = create_res.json()["id"]

    # User B cannot read -> 403
    assert client.get(f"/api/v1/projects/{proj_id}", headers=headers_b).status_code == 403

    # User B cannot edit -> 403
    assert client.patch(f"/api/v1/projects/{proj_id}", json={"name": "Hacked"}, headers=headers_b).status_code == 403

    # User B cannot delete -> 403
    assert client.delete(f"/api/v1/projects/{proj_id}", headers=headers_b).status_code == 403


def test_personal_projects_filtering(user_a):
    """Verifies that listing personal projects supports category and status filters."""
    headers = {"Authorization": user_a["Authorization"]}

    # Create 1 infrastructure draft
    client.post(
        "/api/v1/projects",
        json={"name": "Infra Project", "tagline": "Valid tagline description", "category": "infrastructure"},
        headers=headers,
    )
    # Create 1 design-ux ready project
    p2_res = client.post(
        "/api/v1/projects",
        json={"name": "Design Project", "tagline": "Valid tagline description", "category": "design-ux"},
        headers=headers,
    )
    p2_id = p2_res.json()["id"]
    client.patch(f"/api/v1/projects/{p2_id}", json={"status": "ready"}, headers=headers)

    # Filter by category = design-ux
    cat_res = client.get("/api/v1/projects/personal?category=design-ux", headers=headers)
    assert cat_res.status_code == 200
    cat_items = cat_res.json()
    assert all(p["category"] == "design-ux" for p in cat_items)

    # Filter by status = ready
    status_res = client.get("/api/v1/projects/personal?status=ready", headers=headers)
    assert status_res.status_code == 200
    status_items = status_res.json()
    assert all(p["status"] == "ready" for p in status_items)
