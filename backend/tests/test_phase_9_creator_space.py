"""Phase 9: Creator Space Automated Tests & Security Verification.

Verifies:
1. Creator Studio access and launch readiness metrics computation.
2. Creator profile editing and persistence.
3. Explicit publishing and revocation workflows from Creator Space.
4. Ownership validation and non-owner access rejection (403 Forbidden).
5. Public Creator Profile server-side projection (isolation of private projects).
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


def create_user_and_headers(prefix: str = "creator") -> tuple[dict, dict]:
    uid = str(uuid.uuid4())[:8]
    email = f"{prefix}_{uid}@example.com"
    pwd = "SecurePassword123!"
    username = f"{prefix}_{uid}"
    display = f"Creator {uid}"

    res = client.post(
        "/api/v1/auth/signup",
        json={
            "email": email,
            "password": pwd,
            "username": username,
            "display_name": display,
            "bio": "Passionate developer building AI tools.",
        },
    )
    assert res.status_code == 200, res.text
    token = res.json()["accessToken"]
    user = res.json()["user"]
    headers = {"Authorization": f"Bearer {token}"}
    return user, headers


def test_creator_studio_requires_auth_and_computes_metrics():
    """Unauthenticated access returns 401; authenticated returns studio metrics & readiness."""
    # 1. Anonymous access rejected
    res = client.get("/api/v1/creator/studio")
    assert res.status_code == 401

    # 2. Authenticated creator
    user, headers = create_user_and_headers("studio_user")

    # Initial studio empty
    res = client.get("/api/v1/creator/studio", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["profile"]["username"] == user["username"]
    assert data["metrics"]["totalProjectsCount"] == 0
    assert data["metrics"]["publishedProjectsCount"] == 0
    assert len(data["projects"]) == 0

    # Create 2 projects: 1 private, 1 public
    p1 = client.post(
        "/api/v1/projects",
        headers=headers,
        json={
            "name": "Personal Project Alpha",
            "tagline": "Private architecture",
            "category": "developer-tools",
            "is_public": False,
        },
    ).json()

    p2 = client.post(
        "/api/v1/projects",
        headers=headers,
        json={
            "name": "Showcase Tool Beta",
            "tagline": "Public showcase",
            "category": "productivity",
            "repository_url": "https://github.com/maker/beta",
            "demo_url": "https://beta.maker.dev",
            "is_public": True,
        },
    ).json()

    # Re-fetch studio
    res2 = client.get("/api/v1/creator/studio", headers=headers)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["metrics"]["totalProjectsCount"] == 2
    assert data2["metrics"]["publishedProjectsCount"] == 1
    assert data2["metrics"]["privateProjectsCount"] == 1
    assert len(data2["projects"]) == 2

    # Check readiness structure
    p2_item = next(p for p in data2["projects"] if p["id"] == p2["id"])
    assert p2_item["readiness"]["hasRepoUrl"] is True
    assert p2_item["readiness"]["hasDemoUrl"] is True
    assert p2_item["readiness"]["hasAiReview"] is False  # No reviews run yet


def test_creator_profile_editing_and_persistence():
    """Creator can update display name, bio, links, and skills."""
    user, headers = create_user_and_headers("profile_maker")

    update_payload = {
        "displayName": "Alex Rivera, Lead Architect",
        "bio": "Building autonomous AI systems & developer productivity suites.",
        "githubUrl": "https://github.com/alexrivera-dev",
        "websiteUrl": "https://alexrivera.dev",
        "skills": ["Python", "FastAPI", "React", "TypeScript", "LLM Evaluation"],
    }

    patch_res = client.patch(
        "/api/v1/creator/profile",
        headers=headers,
        json=update_payload,
    )
    assert patch_res.status_code == 200
    updated = patch_res.json()
    assert updated["displayName"] == "Alex Rivera, Lead Architect"
    assert "autonomous AI systems" in updated["bio"]
    assert updated["githubUrl"] == "https://github.com/alexrivera-dev"
    assert updated["websiteUrl"] == "https://alexrivera.dev"
    assert "FastAPI" in updated["skills"]

    # Verify reflected in studio
    studio_res = client.get("/api/v1/creator/studio", headers=headers)
    assert studio_res.status_code == 200
    prof = studio_res.json()["profile"]
    assert prof["displayName"] == "Alex Rivera, Lead Architect"
    assert prof["skills"] == ["Python", "FastAPI", "React", "TypeScript", "LLM Evaluation"]


def test_creator_publishing_and_revocation_lifecycle():
    """Creator can explicitly publish and unpublish projects via dedicated endpoints."""
    user, headers = create_user_and_headers("publisher")

    # Create private project
    proj = client.post(
        "/api/v1/projects",
        headers=headers,
        json={
            "name": "Launchpad Rocket",
            "tagline": "Going to the moon",
            "category": "infrastructure",
            "is_public": False,
        },
    ).json()

    pid = proj["id"]

    # Verify private publicly
    pub_res = client.get(f"/api/v1/projects/public/{pid}")
    assert pub_res.status_code == 404

    # Publish project
    publish_res = client.post(f"/api/v1/creator/projects/{pid}/publish", headers=headers)
    assert publish_res.status_code == 200
    assert publish_res.json()["isPublic"] is True

    # Verify now accessible publicly
    pub_res2 = client.get(f"/api/v1/projects/public/{pid}")
    assert pub_res2.status_code == 200
    assert pub_res2.json()["name"] == "Launchpad Rocket"

    # Revoke publication (unpublish)
    unpub_res = client.post(f"/api/v1/creator/projects/{pid}/unpublish", headers=headers)
    assert unpub_res.status_code == 200
    assert unpub_res.json()["isPublic"] is False

    # Immediately returns 404 publicly
    pub_res3 = client.get(f"/api/v1/projects/public/{pid}")
    assert pub_res3.status_code == 404


def test_creator_ownership_isolation_and_permission_checks():
    """User B cannot publish or unpublish User A's project."""
    user_a, headers_a = create_user_and_headers("user_a")
    user_b, headers_b = create_user_and_headers("user_b")

    proj_a = client.post(
        "/api/v1/projects",
        headers=headers_a,
        json={
            "name": "Secret Project of A",
            "tagline": "Private to A",
            "category": "ai-ml",
            "is_public": False,
        },
    ).json()

    pid = proj_a["id"]

    # User B tries to publish User A's project -> 403 Forbidden
    res_b_pub = client.post(f"/api/v1/creator/projects/{pid}/publish", headers=headers_b)
    assert res_b_pub.status_code == 403

    # User B tries to unpublish User A's project -> 403 Forbidden
    res_b_unpub = client.post(f"/api/v1/creator/projects/{pid}/unpublish", headers=headers_b)
    assert res_b_unpub.status_code == 403

    # Publishing nonexistent project -> 404 Not Found
    res_fake = client.post(f"/api/v1/creator/projects/{uuid.uuid4()}/publish", headers=headers_a)
    assert res_fake.status_code == 404


def test_public_creator_profile_data_projection():
    """Public creator profile is readable anonymously and strictly quarantines private projects."""
    user, headers = create_user_and_headers("spotlight_maker")

    # Update maker profile
    client.patch(
        "/api/v1/creator/profile",
        headers=headers,
        json={
            "displayName": "Spotlight Maker",
            "bio": "Building open-source AI tools.",
            "githubUrl": "https://github.com/spotlight",
            "skills": ["Rust", "PyTorch"],
        },
    )

    # 1. Create Private Project
    p_private = client.post(
        "/api/v1/projects",
        headers=headers,
        json={
            "name": "Private Stealthed Engine",
            "tagline": "Internal R&D only",
            "category": "ai-ml",
            "is_public": False,
        },
    ).json()

    # 2. Create Public Project
    p_public = client.post(
        "/api/v1/projects",
        headers=headers,
        json={
            "name": "Public Spotlight Open Engine",
            "tagline": "Community open release",
            "category": "developer-tools",
            "is_public": True,
        },
    ).json()

    # Anonymous request to public creator profile
    res = client.get(f"/api/v1/creators/{user['username']}")
    assert res.status_code == 200
    pub_profile = res.json()

    assert pub_profile["username"] == user["username"]
    assert pub_profile["displayName"] == "Spotlight Maker"
    assert pub_profile["githubUrl"] == "https://github.com/spotlight"
    assert pub_profile["skills"] == ["Rust", "PyTorch"]
    assert pub_profile["totalPublishedProjects"] == 1

    # Inviolable privacy boundary: Private project MUST NOT appear in publishedProjects
    pub_ids = [p["id"] for p in pub_profile["publishedProjects"]]
    assert p_public["id"] in pub_ids
    assert p_private["id"] not in pub_ids

    # Querying nonexistent creator returns 404
    fake_res = client.get(f"/api/v1/creators/nonexistent_user_{uuid.uuid4()}")
    assert fake_res.status_code == 404

