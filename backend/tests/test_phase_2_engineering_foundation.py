"""Integration tests for Phase 2 Engineering Foundation & Project API."""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


@pytest.fixture
def auth_headers():
    """Creates a test user and returns auth Bearer token headers."""
    email = "phase2_dev@example.com"
    password = "Password123!"
    # Register user (or ignore if exists)
    resp = client.post(
        "/api/v1/auth/signup",
        json={
            "email": email,
            "password": password,
            "username": "phase2_dev",
            "display_name": "Phase2 Architect",
        },
    )
    if resp.status_code == 409:
        # User already exists, log in
        login_resp = client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": password},
        )
        token = login_resp.json().get("accessToken") or login_resp.json().get("token")
    else:
        token = resp.json().get("accessToken") or resp.json().get("token")

    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def second_user_headers():
    """Creates a second test user to verify ownership isolation."""
    email = "phase2_other@example.com"
    password = "Password123!"
    resp = client.post(
        "/api/v1/auth/signup",
        json={
            "email": email,
            "password": password,
            "username": "phase2_other",
            "display_name": "Other User",
        },
    )
    if resp.status_code == 409:
        login_resp = client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": password},
        )
        token = login_resp.json().get("accessToken") or login_resp.json().get("token")
    else:
        token = resp.json().get("accessToken") or resp.json().get("token")

    return {"Authorization": f"Bearer {token}"}


def test_create_and_retrieve_personal_project(auth_headers):
    # 1. Create project
    create_payload = {
        "name": "CRDT Sync Engine",
        "tagline": "Offline-first sync engine for distributed workspaces",
        "category": "developer-tools",
        "description": "Comprehensive explanation of conflict-free replicated data types...",
        "repository_url": "https://github.com/example/crdt-sync",
        "demo_url": "https://crdt-demo.dev",
    }
    resp = client.post("/api/v1/projects", json=create_payload, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "CRDT Sync Engine"
    assert data["status"] == "draft"
    assert data["isPublic"] is False
    project_id = data["id"]

    # 2. Retrieve project as owner
    get_resp = client.get(f"/api/v1/projects/{project_id}", headers=auth_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == project_id


def test_privacy_and_ownership_isolation(auth_headers, second_user_headers):
    # 1. User 1 creates private project
    create_payload = {
        "name": "Secret Quantum Vault",
        "tagline": "Encrypted credentials storage for cloud secrets",
        "category": "infrastructure",
        "description": "Zero-knowledge encryption for mission-critical enterprise keys...",
    }
    resp = client.post("/api/v1/projects", json=create_payload, headers=auth_headers)
    assert resp.status_code == 201
    project_id = resp.json()["id"]

    # 2. Unauthenticated user tries to read -> 403 Forbidden
    anon_resp = client.get(f"/api/v1/projects/{project_id}")
    assert anon_resp.status_code == 403

    # 3. User 2 (not the owner) tries to read -> 403 Forbidden
    other_resp = client.get(f"/api/v1/projects/{project_id}", headers=second_user_headers)
    assert other_resp.status_code == 403

    # 4. User 2 tries to update -> 403 Forbidden
    hack_resp = client.patch(
        f"/api/v1/projects/{project_id}",
        json={"name": "Hacked Title"},
        headers=second_user_headers,
    )
    assert hack_resp.status_code == 403

    # 5. User 1 publishes to Public Explore
    publish_resp = client.patch(
        f"/api/v1/projects/{project_id}",
        json={"is_public": True},
        headers=auth_headers,
    )
    assert publish_resp.status_code == 200
    assert publish_resp.json()["isPublic"] is True

    # 6. Now User 2 can read it
    read_public_resp = client.get(f"/api/v1/projects/{project_id}", headers=second_user_headers)
    assert read_public_resp.status_code == 200
    assert read_public_resp.json()["name"] == "Secret Quantum Vault"


def test_validation_constraints(auth_headers):
    # Name too short (< 3 chars)
    resp = client.post(
        "/api/v1/projects",
        json={"name": "AB", "tagline": "Valid tagline here", "category": "developer-tools"},
        headers=auth_headers,
    )
    assert resp.status_code == 422

    # Tagline too short (< 10 chars)
    resp = client.post(
        "/api/v1/projects",
        json={"name": "Valid Name", "tagline": "Too short", "category": "developer-tools"},
        headers=auth_headers,
    )
    assert resp.status_code == 422

    # Invalid Category
    resp = client.post(
        "/api/v1/projects",
        json={"name": "Valid Name", "tagline": "Valid long tagline", "category": "unsupported-cat"},
        headers=auth_headers,
    )
    assert resp.status_code == 422


def test_list_personal_and_public_projects(auth_headers):
    # List personal
    list_resp = client.get("/api/v1/projects/personal", headers=auth_headers)
    assert list_resp.status_code == 200
    assert isinstance(list_resp.json(), list)

    # List public
    pub_resp = client.get("/api/v1/projects/public")
    assert pub_resp.status_code == 200
    assert isinstance(pub_resp.json(), list)
