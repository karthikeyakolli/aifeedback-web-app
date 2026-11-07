"""Tests for Recent Comments (Community Voices) and APK Release Management."""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.auth_service import create_access_token
from backend.app.db.connection import db_manager


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def auth_headers():
    token = create_access_token(
        user_id="user_apk_tester",
        email="apk_tester@example.com",
        username="apktester",
    )
    return {"Authorization": f"Bearer {token}"}


def test_recent_comments_endpoint(client):
    """GET /api/v1/comments/recent returns list of recent public comments."""
    res = client.get("/api/v1/comments/recent?limit=5")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)


def test_public_projects_sort_options(client):
    """GET /api/v1/projects/public accepts sort=trending, new, most_discussed."""
    for sort_param in ["trending", "new", "most_discussed"]:
        res = client.get(f"/api/v1/projects/public?sort={sort_param}")
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)


def test_apk_release_lifecycle(client, auth_headers):
    """Tests creating an APK release, listing it, updating quarantine status, and downloading it."""
    # 1. First ensure user exists and create project
    proj_res = client.post(
        "/api/v1/projects",
        headers=auth_headers,
        json={
            "name": "APK Demo App",
            "tagline": "Mobile application feedback and release distribution",
            "category": "mobile",
            "description": "Demonstration project for Android APK releases",
            "is_public": True,
        },
    )
    assert proj_res.status_code == 201
    proj_id = proj_res.json()["id"]

    # 2. Upload APK release
    apk_file_content = b"PK\x03\x04" + b"android_manifest_mock" + bytes(50)
    files = {"file": ("demo-app-v1.0.apk", apk_file_content, "application/vnd.android.package-archive")}
    data = {
        "version_name": "1.0.0",
        "version_code": "1",
        "release_notes": "Initial Android test build",
        "package_name": "com.feedbackai.demo",
    }
    upload_res = client.post(
        f"/api/v1/projects/{proj_id}/releases/apk",
        headers=auth_headers,
        data=data,
        files=files,
    )
    assert upload_res.status_code == 201
    rel = upload_res.json()
    assert rel["versionName"] == "1.0.0"
    assert rel["status"] == "quarantined"
    assert "Pending automated verification scan" in rel["quarantineReason"]
    release_id = rel["id"]

    # 3. Public visitor cannot see quarantined release
    public_list = client.get(f"/api/v1/projects/{proj_id}/releases/apk")
    assert public_list.status_code == 200
    assert len(public_list.json()) == 0

    # 4. Owner can see quarantined release
    owner_list = client.get(f"/api/v1/projects/{proj_id}/releases/apk", headers=auth_headers)
    assert owner_list.status_code == 200
    assert len(owner_list.json()) == 1

    # 5. Public download is forbidden while quarantined
    dl_pub = client.get(f"/api/v1/projects/{proj_id}/releases/apk/{release_id}/download")
    assert dl_pub.status_code == 403

    # 6. Owner transitions status to published
    status_res = client.patch(
        f"/api/v1/projects/{proj_id}/releases/apk/{release_id}/status",
        headers=auth_headers,
        json={"status": "published"},
    )
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "published"

    # 7. Now public visitor can list and download
    public_list_after = client.get(f"/api/v1/projects/{proj_id}/releases/apk")
    assert len(public_list_after.json()) == 1

    dl_pub_after = client.get(f"/api/v1/projects/{proj_id}/releases/apk/{release_id}/download")
    assert dl_pub_after.status_code == 200
    assert dl_pub_after.headers["X-Content-Type-Options"] == "nosniff"
    assert dl_pub_after.headers["X-SHA256"] == rel["fileSha256"]
