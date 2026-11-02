"""Comprehensive Security and Authentication Validation Suite for Phase 3.

Validates:
1. Unauthenticated route access rejections (401 Unauthorized).
2. Malformed and invalid Bearer token handling.
3. Expired token rejection.
4. Cross-user unauthorized resource access (403 Forbidden).
5. Cross-user modification and deletion attacks.
6. Space isolation: Private projects in Personal space never leak to Public space.
7. Identity spoofing immunity: Injected user_id fields in payloads are ignored.
"""

import uuid
from datetime import datetime, timezone, timedelta
import jwt
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.config import settings

client = TestClient(app)


@pytest.fixture
def user_a_headers():
    uid = uuid.uuid4().hex[:8]
    email = f"alice_{uid}@example.com"
    pwd = "AlicePassword123!"
    resp = client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": pwd, "username": f"alice_{uid}", "display_name": "Alice Architect"},
    )
    token = resp.json().get("accessToken") or resp.json().get("token")
    return {"Authorization": f"Bearer {token}", "user_id": resp.json().get("user", {}).get("id")}


@pytest.fixture
def user_b_headers():
    uid = uuid.uuid4().hex[:8]
    email = f"bob_{uid}@example.com"
    pwd = "BobPassword123!"
    resp = client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": pwd, "username": f"bob_{uid}", "display_name": "Bob Builder"},
    )
    token = resp.json().get("accessToken") or resp.json().get("token")
    return {"Authorization": f"Bearer {token}", "user_id": resp.json().get("user", {}).get("id")}


def test_unauthenticated_protected_route_rejection():
    """Confirms all protected project and personal routes reject unauthenticated requests."""
    fake_id = str(uuid.uuid4())

    # 1. Project creation requires authentication
    res1 = client.post("/api/v1/projects", json={"name": "Test", "tagline": "Test Tagline", "category": "productivity"})
    assert res1.status_code == 401

    # 2. Personal projects listing requires authentication
    res2 = client.get("/api/v1/projects/personal")
    assert res2.status_code == 401

    # 3. Project modification requires authentication
    res3 = client.patch(f"/api/v1/projects/{fake_id}", json={"name": "Updated"})
    assert res3.status_code == 401

    # 4. Project deletion requires authentication
    res4 = client.delete(f"/api/v1/projects/{fake_id}")
    assert res4.status_code == 401

    # 5. Finding status update requires authentication
    res5 = client.patch(f"/api/v1/findings/{fake_id}/status", json={"status": "addressed"})
    assert res5.status_code == 401


def test_malformed_and_invalid_tokens():
    """Confirms malformed tokens and invalid signatures are strictly rejected with 401."""
    # Garbage token string
    res1 = client.get("/api/v1/projects/personal", headers={"Authorization": "Bearer garbage.jwt.signature"})
    assert res1.status_code == 401

    # Non-bearer scheme
    res2 = client.get("/api/v1/projects/personal", headers={"Authorization": "Basic dXNlcjpwYXNz"})
    assert res2.status_code == 401

    # Empty Bearer header
    res3 = client.get("/api/v1/projects/personal", headers={"Authorization": "Bearer "})
    assert res3.status_code == 401

    # Missing Authorization keyword
    res4 = client.get("/api/v1/projects/personal", headers={"Authorization": "some-random-token"})
    assert res4.status_code == 401


def test_expired_session_token_rejection():
    """Confirms that tokens past their expiration timestamp are rejected."""
    now = datetime.now(timezone.utc)
    expired_payload = {
        "sub": "usr_expired_123",
        "email": "expired@example.com",
        "username": "expired_user",
        "iat": now - timedelta(days=10),
        "exp": now - timedelta(hours=1),  # Expired 1 hour ago
    }
    expired_token = jwt.encode(expired_payload, settings.local_jwt_secret, algorithm="HS256")

    res = client.get(
        "/api/v1/projects/personal",
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert res.status_code == 401
    assert "expired" in res.json().get("detail", "").lower()


def test_cross_user_unauthorized_access_and_mutation(user_a_headers, user_b_headers):
    """Enforces that User B cannot read, mutate, or delete User A's private project."""
    # 1. User A creates private project in Personal Space
    create_res = client.post(
        "/api/v1/projects",
        json={
            "name": "Alice Private AI Vault",
            "tagline": "Confidential neural weights manager",
            "category": "ai-ml",
            "description": "Proprietary model checkpoint encryption and zero-knowledge storage.",
        },
        headers={"Authorization": user_a_headers["Authorization"]},
    )
    assert create_res.status_code == 201
    proj_id = create_res.json()["id"]

    # 2. User B tries to read Alice's project -> 403 Forbidden
    read_res = client.get(
        f"/api/v1/projects/{proj_id}",
        headers={"Authorization": user_b_headers["Authorization"]},
    )
    assert read_res.status_code == 403
    assert "private" in read_res.json().get("detail", "").lower() or "denied" in read_res.json().get("detail", "").lower()

    # 3. User B tries to mutate Alice's project -> 403 Forbidden
    patch_res = client.patch(
        f"/api/v1/projects/{proj_id}",
        json={"name": "Bob Defaced Name"},
        headers={"Authorization": user_b_headers["Authorization"]},
    )
    assert patch_res.status_code == 403

    # 4. User B tries to delete Alice's project -> 403 Forbidden
    del_res = client.delete(
        f"/api/v1/projects/{proj_id}",
        headers={"Authorization": user_b_headers["Authorization"]},
    )
    assert del_res.status_code == 403

    # 5. Verify Alice's project remains untouched
    verify_res = client.get(
        f"/api/v1/projects/{proj_id}",
        headers={"Authorization": user_a_headers["Authorization"]},
    )
    assert verify_res.status_code == 200
    assert verify_res.json()["name"] == "Alice Private AI Vault"


def test_space_isolation_and_leakage_prevention(user_a_headers, user_b_headers):
    """Verifies that private projects in Personal Space never leak into the Public Space feed."""
    unique_tag = f"Tag-{uuid.uuid4().hex[:6]}"
    # 1. Alice creates private project
    res = client.post(
        "/api/v1/projects",
        json={
            "name": f"Private Draft {unique_tag}",
            "tagline": "Unpublished experimental prototype",
            "category": "productivity",
            "description": "Internal research notes not ready for public eyes.",
        },
        headers={"Authorization": user_a_headers["Authorization"]},
    )
    assert res.status_code == 201
    proj_id = res.json()["id"]
    assert res.json()["isPublic"] is False

    # 2. Check Public Explore feed: Alice's project MUST NOT be present
    public_res = client.get("/api/v1/projects/public")
    assert public_res.status_code == 200
    public_items = public_res.json()
    assert not any(p["id"] == proj_id for p in public_items)

    # 3. Alice explicitly publishes project to Public Space
    publish_res = client.patch(
        f"/api/v1/projects/{proj_id}",
        json={"is_public": True},
        headers={"Authorization": user_a_headers["Authorization"]},
    )
    assert publish_res.status_code == 200
    assert publish_res.json()["isPublic"] is True

    # 4. Now project appears on Public Explore
    pub_after = client.get("/api/v1/projects/public")
    assert pub_after.status_code == 200
    assert any(p["id"] == proj_id for p in pub_after.json())

    # 5. Even when public, User B CANNOT edit or delete it
    hack_res = client.patch(
        f"/api/v1/projects/{proj_id}",
        json={"name": "Hacked Public Project"},
        headers={"Authorization": user_b_headers["Authorization"]},
    )
    assert hack_res.status_code == 403


def test_identity_spoofing_immunity(user_a_headers, user_b_headers):
    """Verifies that client-injected userId in payloads is ignored in favor of the JWT token claim."""
    # Alice sends payload claiming to belong to Bob
    fake_payload = {
        "name": "Spoofed Ownership Project",
        "tagline": "Attempting to assign project to another user ID",
        "category": "infrastructure",
        "description": "Security test for client-side claim injection vulnerability.",
        "user_id": "usr_victim_bob_id",
        "userId": "usr_victim_bob_id",
    }
    res = client.post(
        "/api/v1/projects",
        json=fake_payload,
        headers={"Authorization": user_a_headers["Authorization"]},
    )
    assert res.status_code == 201
    created_data = res.json()

    # The project MUST belong to Alice, not the spoofed victim ID
    assert created_data["userId"] != "usr_victim_bob_id"

