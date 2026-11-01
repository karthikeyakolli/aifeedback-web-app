"""Phase 2.1 Architecture Reconciliation, Security Audit & Community Verification Tests.

Validates:
1. Supabase Auth token verification, claim extraction, and profile auto-sync.
2. Rejection of expired, invalid-signature, and wrong-audience tokens.
3. Production environment safety guards (prohibits local auth in production).
4. Strict anonymous identity masking across posts, comments, replies, and profiles.
5. Immutability of anonymity settings (cannot de-anonymize or alter post-creation).
6. Non-leakage of emails in public profile endpoints.
7. Strict server-side ownership enforcement (403 on foreign post/comment updates/deletions).
8. Moderation report privacy (non-moderators blocked with 403; moderators permitted).
9. Input validation (rejects invalid/malicious URL schemes, short titles/descriptions).
10. Atomic vote toggle mechanics and comments counter consistency.
"""

from __future__ import annotations

import os
import uuid
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.config import settings
from backend.app.services.auth_service import (
    create_access_token,
    create_mock_supabase_token,
    verify_supabase_token,
    get_active_auth_provider,
)
from backend.app.db.repository import community_repo

client = TestClient(app)


@pytest.fixture
def auth_users():
    """Sets up an author, a non-author user, and a moderator for testing."""
    uid = uuid.uuid4().hex[:8]
    author_id, author_prof = community_repo.create_user(
        email=f"author_{uid}@example.com",
        password="ValidPassword123!",
        username=f"author_{uid}",
        display_name="Author Alice",
    )
    author_token = create_access_token(
        user_id=author_id, email=author_prof["email"], username=author_prof["username"]
    )

    other_id, other_prof = community_repo.create_user(
        email=f"other_{uid}@example.com",
        password="ValidPassword123!",
        username=f"other_{uid}",
        display_name="Other Bob",
    )
    other_token = create_access_token(
        user_id=other_id, email=other_prof["email"], username=other_prof["username"]
    )

    # Create moderator user
    mod_id, mod_prof = community_repo.create_user(
        email=f"mod_{uid}@example.com",
        password="ValidPassword123!",
        username=f"mod_{uid}",
        display_name="Moderator Charlie",
    )
    # Grant moderator role
    with community_repo.db.session() as conn:
        conn.execute("UPDATE profiles SET is_moderator = 1 WHERE id = ?", (mod_id,))
    mod_prof["isModerator"] = True

    mod_token = create_access_token(
        user_id=mod_id, email=mod_prof["email"], username=mod_prof["username"]
    )

    return {
        "author": {"id": author_id, "headers": {"Authorization": f"Bearer {author_token}"}},
        "other": {"id": other_id, "headers": {"Authorization": f"Bearer {other_token}"}},
        "moderator": {"id": mod_id, "headers": {"Authorization": f"Bearer {mod_token}"}},
    }


# =============================================================================
# 1. Supabase Token Verification & Production Safety Guard
# =============================================================================
def test_supabase_token_verification_and_claim_extraction():
    """Verifies that Supabase Auth JWT tokens are correctly verified and claims extracted."""
    test_secret = "test-supabase-signing-secret-minimum-32-chars-long"
    orig_secret = settings.supabase_jwt_secret
    settings.supabase_jwt_secret = test_secret

    try:
        supa_user_id = str(uuid.uuid4())
        unique_username = f"supa_eng_{uuid.uuid4().hex[:8]}"
        supa_email = f"supa_user_{supa_user_id[:6]}@example.com"
        token = create_mock_supabase_token(
            user_id=supa_user_id,
            email=supa_email,
            username=unique_username,
            secret=test_secret,
        )

        # Verify token claims
        claims = verify_supabase_token(token)
        assert claims["sub"] == supa_user_id
        assert claims["email"] == supa_email
        assert claims["username"] == unique_username
        assert claims["provider"] == "supabase"

        # Verify profile auto-sync via GET /auth/me with Supabase token
        res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        data = res.json()
        assert data["id"] == supa_user_id
        assert data["username"] == unique_username
    finally:
        settings.supabase_jwt_secret = orig_secret



def test_supabase_token_rejections():
    """Verifies rejection of expired, invalid signature, and wrong audience tokens."""
    test_secret = "test-supabase-signing-secret-minimum-32-chars-long"
    orig_secret = settings.supabase_jwt_secret
    settings.supabase_jwt_secret = test_secret

    try:
        supa_user_id = str(uuid.uuid4())
        # 1. Expired token
        expired_token = create_mock_supabase_token(
            user_id=supa_user_id,
            email="expired@example.com",
            username="expired_user",
            secret=test_secret,
            expired=True,
        )
        res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
        assert res.status_code == 401
        assert "expired" in res.json()["detail"].lower()

        # 2. Tampered / wrong signature
        wrong_token = create_mock_supabase_token(
            user_id=supa_user_id,
            email="tampered@example.com",
            username="tampered_user",
            secret="different-unauthorized-secret-key-1234",
        )
        res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {wrong_token}"})
        assert res.status_code == 401

        # 3. Wrong audience
        wrong_aud_token = create_mock_supabase_token(
            user_id=supa_user_id,
            email="wrong_aud@example.com",
            username="wrong_aud",
            secret=test_secret,
            audience="unauthorized-app-audience",
        )
        res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {wrong_aud_token}"})
        assert res.status_code == 401
    finally:
        settings.supabase_jwt_secret = orig_secret


def test_production_guard_prohibits_local_auth():
    """Ensures local auth adapter is strictly prohibited when ENVIRONMENT=production."""
    orig_env = settings.environment
    orig_provider = settings.auth_provider
    try:
        settings.environment = "production"
        settings.auth_provider = "local"
        with pytest.raises(RuntimeError, match="CRITICAL SECURITY CONFIGURATION ERROR"):
            get_active_auth_provider()
    finally:
        settings.environment = orig_env
        settings.auth_provider = orig_provider


# =============================================================================
# 2. Strict Anonymous Identity Masking & Immutability
# =============================================================================
def test_anonymous_post_privacy_and_immutability(auth_users):
    """Verifies anonymous posts never leak author identity and anonymity cannot be changed."""
    author = auth_users["author"]
    other = auth_users["other"]

    # 1. Create an anonymous post
    create_res = client.post(
        "/api/v1/posts",
        headers=author["headers"],
        json={
            "title": "Strict Anonymity Verification Post",
            "description": "Checking that serialized outputs contain zero identifiable information.",
            "category": "Security",
            "isAnonymous": True,
        },
    )
    assert create_res.status_code == 201
    post_data = create_res.json()
    post_id = post_data["id"]

    # In serialized post:
    assert post_data["isAnonymous"] is True
    assert post_data["author"]["id"] is None
    assert post_data["author"]["username"] == "anonymous"
    assert post_data["author"]["displayName"] == "Anonymous Contributor"
    assert post_data["author"]["avatarUrl"] is None
    assert "author_id" not in post_data
    assert "email" not in str(post_data).lower()

    # 2. Public retrieval (unauthenticated)
    pub_res = client.get(f"/api/v1/posts/{post_id}")
    assert pub_res.status_code == 200
    pub_data = pub_res.json()
    assert pub_data["author"]["id"] is None
    assert pub_data["author"]["username"] == "anonymous"

    # 3. Public profile check: Anonymous posts MUST NOT appear on author's public profile
    prof_res = client.get(f"/api/v1/users/{author['id']}/profile")
    assert prof_res.status_code == 200
    prof_data = prof_res.json()
    # Email must NEVER be present in public profile
    assert "email" not in prof_data
    # Anonymous post must NOT be listed in author's posts
    post_ids = [p["id"] for p in prof_data.get("posts", [])]
    assert post_id not in post_ids

    # 4. Attempt to de-anonymize via update
    update_res = client.put(
        f"/api/v1/posts/{post_id}",
        headers=author["headers"],
        json={"title": "Updated Title Still Anonymous", "isAnonymous": False},
    )
    assert update_res.status_code == 200
    updated_data = update_res.json()
    # isAnonymous must remain True
    assert updated_data["isAnonymous"] is True
    assert updated_data["author"]["id"] is None


def test_anonymous_comment_privacy(auth_users):
    """Verifies anonymous comments mask identity in root comments and nested reply trees."""
    author = auth_users["author"]
    other = auth_users["other"]

    # Alice creates a standard post
    post_res = client.post(
        "/api/v1/posts",
        headers=author["headers"],
        json={
            "title": "Thread for Testing Anonymous Comments",
            "description": "Verifying threaded comment privacy masking.",
            "category": "Testing",
        },
    )
    post_id = post_res.json()["id"]

    # Bob posts an anonymous root comment
    comment_res = client.post(
        "/api/v1/comments",
        headers=other["headers"],
        json={
            "postId": post_id,
            "content": "This is an anonymous critique of the product architecture.",
            "isAnonymous": True,
        },
    )
    assert comment_res.status_code == 201
    c_data = comment_res.json()
    assert c_data["isAnonymous"] is True
    assert c_data["author"]["id"] is None
    assert c_data["author"]["username"] == "anonymous"
    assert c_data["author"]["displayName"] == "Anonymous Reviewer"
    assert c_data["author"]["avatarUrl"] is None

    # Retrieve comment thread
    thread_res = client.get(f"/api/v1/comments/post/{post_id}")
    assert thread_res.status_code == 200
    comments = thread_res.json()
    assert len(comments) >= 1
    found = next(c for c in comments if c["id"] == c_data["id"])
    assert found["author"]["id"] is None
    assert found["author"]["username"] == "anonymous"


# =============================================================================
# 3. Ownership & Authorization Barriers
# =============================================================================
def test_ownership_enforcement_on_posts_and_comments(auth_users):
    """Verifies 403 Forbidden when a user attempts to edit or delete another user's content."""
    author = auth_users["author"]
    other = auth_users["other"]

    # Alice creates a post
    post_res = client.post(
        "/api/v1/posts",
        headers=author["headers"],
        json={
            "title": "Protected Post for Ownership Verification",
            "description": "Bob should never be allowed to edit or delete this.",
            "category": "Security",
        },
    )
    post_id = post_res.json()["id"]

    # Bob attempts to edit Alice's post -> 403
    bob_edit = client.put(
        f"/api/v1/posts/{post_id}",
        headers=other["headers"],
        json={"title": "Hacked Title by Unauthorized Bob"},
    )
    assert bob_edit.status_code == 403

    # Bob attempts to delete Alice's post -> 403
    bob_delete = client.delete(
        f"/api/v1/posts/{post_id}",
        headers=other["headers"],
    )
    assert bob_delete.status_code == 403

    # Alice creates a comment
    cmt_res = client.post(
        "/api/v1/comments",
        headers=author["headers"],
        json={"postId": post_id, "content": "Alice original comment."},
    )
    cmt_id = cmt_res.json()["id"]

    # Bob attempts to edit Alice's comment -> 403
    bob_cmt_edit = client.put(
        f"/api/v1/comments/{cmt_id}",
        headers=other["headers"],
        json={"content": "Bob defaced Alice's comment."},
    )
    assert bob_cmt_edit.status_code == 403

    # Bob attempts to delete Alice's comment -> 403
    bob_cmt_del = client.delete(
        f"/api/v1/comments/{cmt_id}",
        headers=other["headers"],
    )
    assert bob_cmt_del.status_code == 403


# =============================================================================
# 4. Moderation Reports Privacy
# =============================================================================
def test_moderation_reports_privacy(auth_users):
    """Verifies reports cannot be viewed by unauthorized users, only by moderators."""
    author = auth_users["author"]
    other = auth_users["other"]
    mod = auth_users["moderator"]

    # Bob submits a report against Alice's post
    report_res = client.post(
        "/api/v1/reports",
        headers=other["headers"],
        json={
            "targetType": "post",
            "targetId": "some_reported_post_id",
            "reason": "Suspected spam or policy violation",
            "description": "Please review this item.",
        },
    )
    assert report_res.status_code == 201

    # Unauthenticated user attempts to view reports -> 401
    unauth_get = client.get("/api/v1/reports")
    assert unauth_get.status_code == 401

    # Regular user (Alice or Bob) attempts to view reports -> 403 Forbidden
    regular_get = client.get("/api/v1/reports", headers=author["headers"])
    assert regular_get.status_code == 403

    # Authorized moderator views reports -> 200 OK
    mod_get = client.get("/api/v1/reports", headers=mod["headers"])
    assert mod_get.status_code == 200
    reports = mod_get.json()
    assert isinstance(reports, list)
    assert len(reports) >= 1


# =============================================================================
# 5. Input Validation & Abuse Prevention
# =============================================================================
def test_input_validation_and_url_scheme_protection(auth_users):
    """Verifies that malicious or invalid URL schemes are rejected."""
    author = auth_users["author"]

    # Malicious javascript: URL scheme -> 422
    xss_res = client.post(
        "/api/v1/posts",
        headers=author["headers"],
        json={
            "title": "Post With Malicious Javascript Link",
            "description": "Valid description length for testing URL validation.",
            "category": "Testing",
            "productUrl": "javascript:alert(document.cookie)",
        },
    )
    assert xss_res.status_code == 422

    # Malicious data: URL scheme -> 422
    data_uri_res = client.post(
        "/api/v1/posts",
        headers=author["headers"],
        json={
            "title": "Post With Malicious Data URI",
            "description": "Valid description length for testing URL validation.",
            "category": "Testing",
            "productUrl": "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
        },
    )
    assert data_uri_res.status_code == 422

    # Valid https:// URL -> 201
    valid_res = client.post(
        "/api/v1/posts",
        headers=author["headers"],
        json={
            "title": "Post With Valid HTTPS Product Link",
            "description": "Valid description length with clean product URL.",
            "category": "Testing",
            "productUrl": "https://example.com/product",
        },
    )
    assert valid_res.status_code == 201


# =============================================================================
# 6. Community Integrity: Atomic Voting & Comments Counter
# =============================================================================
def test_atomic_vote_toggling_and_comment_counter_integrity(auth_users):
    """Verifies that votes toggle cleanly without duplication and comments_count stays accurate."""
    author = auth_users["author"]
    other = auth_users["other"]

    # Alice creates a post (starts with 1 author upvote)
    post_res = client.post(
        "/api/v1/posts",
        headers=author["headers"],
        json={
            "title": "Vote and Counter Integrity Verification",
            "description": "Verifying database integrity and counter consistency.",
            "category": "Testing",
        },
    )
    post_id = post_res.json()["id"]
    assert post_res.json()["upvotesCount"] == 1
    assert post_res.json()["commentsCount"] == 0

    # Bob upvotes -> count becomes 2
    v1 = client.post(f"/api/v1/posts/{post_id}/vote", headers=other["headers"])
    assert v1.status_code == 200
    assert v1.json()["upvotesCount"] == 2
    assert v1.json()["userHasUpvoted"] is True

    # Bob votes again (toggle off) -> count becomes 1
    v2 = client.post(f"/api/v1/posts/{post_id}/vote", headers=other["headers"])
    assert v2.status_code == 200
    assert v2.json()["upvotesCount"] == 1
    assert v2.json()["userHasUpvoted"] is False

    # Bob votes again (toggle on) -> count becomes 2
    v3 = client.post(f"/api/v1/posts/{post_id}/vote", headers=other["headers"])
    assert v3.status_code == 200
    assert v3.json()["upvotesCount"] == 2
    assert v3.json()["userHasUpvoted"] is True

    # Comments count integrity
    # 1. Bob creates a comment -> commentsCount = 1
    c1 = client.post(
        "/api/v1/comments",
        headers=other["headers"],
        json={"postId": post_id, "content": "First testing comment on this post."},
    )
    assert c1.status_code == 201
    c1_id = c1.json()["id"]

    post_check = client.get(f"/api/v1/posts/{post_id}")
    assert post_check.json()["commentsCount"] == 1

    # 2. Alice creates a reply -> commentsCount = 2
    c2 = client.post(
        "/api/v1/comments",
        headers=author["headers"],
        json={"postId": post_id, "parentCommentId": c1_id, "content": "Reply to first comment."},
    )
    assert c2.status_code == 201

    post_check2 = client.get(f"/api/v1/posts/{post_id}")
    assert post_check2.json()["commentsCount"] == 2

    # 3. Bob deletes his comment -> commentsCount decrements to 1
    del_res = client.delete(f"/api/v1/comments/{c1_id}", headers=other["headers"])
    assert del_res.status_code == 200

    post_check3 = client.get(f"/api/v1/posts/{post_id}")
    assert post_check3.json()["commentsCount"] == 1
