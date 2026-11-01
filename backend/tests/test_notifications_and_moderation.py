"""Unit tests for Phase 6 Notifications and Moderation endpoints."""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.db.repository import community_repo

client = TestClient(app)


def test_notifications_lifecycle():
    """Tests creating, listing, unread count, and marking notifications as read."""
    # Create test user
    signup_res = client.post(
        "/api/v1/auth/signup",
        json={
            "email": "notif_tester@example.com",
            "password": "StrongPassword123!",
            "username": "notif_tester",
            "display_name": "Notification Tester",
        },
    )
    if signup_res.status_code == 409:
        login_res = client.post(
            "/api/v1/auth/login",
            json={"email": "notif_tester@example.com", "password": "StrongPassword123!"},
        )
        token = login_res.json()["accessToken"]
        user_id = login_res.json()["user"]["id"]
    else:
        assert signup_res.status_code == 200
        token = signup_res.json()["accessToken"]
        user_id = signup_res.json()["user"]["id"]

    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create notification directly via repo
    notif = community_repo.create_notification(
        user_id=user_id,
        type="reply",
        title="New Reply",
        message="Someone replied to your comment.",
        link_url="/posts/test_post_1",
    )
    assert notif["id"] is not None

    # 2. Check unread count
    cnt_res = client.get("/api/v1/notifications/unread-count", headers=headers)
    assert cnt_res.status_code == 200
    assert cnt_res.json()["unreadCount"] >= 1

    # 3. List notifications
    list_res = client.get("/api/v1/notifications", headers=headers)
    assert list_res.status_code == 200
    items = list_res.json()
    assert len(items) >= 1
    target = next((item for item in items if item["id"] == notif["id"]), None)
    assert target is not None
    assert target["isRead"] is False

    # 4. Mark single notification as read
    mark_res = client.patch(f"/api/v1/notifications/{notif['id']}/read", headers=headers)
    assert mark_res.status_code == 200
    assert mark_res.json()["isRead"] is True

    # 5. Mark all as read
    all_res = client.post("/api/v1/notifications/read-all", headers=headers)
    assert all_res.status_code == 200
    assert all_res.json()["isRead"] is True


def test_moderation_report_submission_and_resolution():
    """Tests submitting reports, listing by moderator, and resolving (hide/restore/dismiss)."""
    # Create moderator user
    mod_res = client.post(
        "/api/v1/auth/signup",
        json={
            "email": "mod_user@example.com",
            "password": "StrongPassword123!",
            "username": "mod_user",
            "display_name": "Moderator User",
        },
    )
    if mod_res.status_code == 409:
        login_res = client.post(
            "/api/v1/auth/login",
            json={"email": "mod_user@example.com", "password": "StrongPassword123!"},
        )
        mod_token = login_res.json()["accessToken"]
        mod_id = login_res.json()["user"]["id"]
    else:
        assert mod_res.status_code == 200
        mod_token = mod_res.json()["accessToken"]
        mod_id = mod_res.json()["user"]["id"]

    # Grant moderator role
    with community_repo.db.session() as conn:
        conn.execute("UPDATE profiles SET is_moderator = 1 WHERE id = ?", (mod_id,))

    mod_headers = {"Authorization": f"Bearer {mod_token}"}

    # Create a test post to report
    post_res = client.post(
        "/api/v1/posts",
        headers=mod_headers,
        json={
            "title": "Post to Report and Moderate",
            "description": "This is a test post that will be reported.",
            "category": "Productivity",
            "post_type": "product_review",
            "tags": ["mod-test"],
            "is_anonymous": False,
        },
    )
    assert post_res.status_code == 201
    post_id = post_res.json()["id"]

    # Submit report
    rep_res = client.post(
        "/api/v1/reports",
        headers=mod_headers,
        json={
            "targetType": "post",
            "targetId": post_id,
            "reason": "Harassment or policy violation",
            "description": "Contains policy-violating text.",
        },
    )
    assert rep_res.status_code == 201
    report_id = rep_res.json()["id"]

    # Moderator lists reports
    queue_res = client.get("/api/v1/reports", headers=mod_headers)
    assert queue_res.status_code == 200
    queue = queue_res.json()
    assert any(r["id"] == report_id for r in queue)

    # Moderator resolves with 'hide'
    hide_res = client.patch(
        f"/api/v1/reports/{report_id}/resolve",
        headers=mod_headers,
        json={"action": "hide", "notes": "Hiding due to policy violation."},
    )
    assert hide_res.status_code == 200
    assert hide_res.json()["status"] == "resolved"

    # Moderator locks post
    lock_res = client.patch(
        f"/api/v1/reports/posts/{post_id}/lock",
        headers=mod_headers,
        json={"locked": True},
    )
    assert lock_res.status_code == 200
    assert lock_res.json()["isLocked"] is True
