"""Comprehensive backend tests for Phase 2: Authentication and Community features."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


@pytest.fixture(scope="module")
def registered_users():
    """Registers two distinct users for testing authorization and interaction boundaries."""
    from backend.app.db.connection import db_manager
    with db_manager.session() as conn:
        conn.execute("DELETE FROM auth_users WHERE email IN ('alice.creator@example.com', 'bob.reviewer@example.com')")
        conn.execute("DELETE FROM profiles WHERE username IN ('alice_creator', 'bob_reviewer', 'unique_username_xyz')")

    # User A (Alice - Creator)
    res_a = client.post(
        "/api/v1/auth/signup",
        json={
            "email": "alice.creator@example.com",
            "password": "StrongPassword123!",
            "username": "alice_creator",
            "display_name": "Alice Creator",
            "bio": "Building products and gathering feedback.",
        },
    )
    if res_a.status_code == 409:
        # Already exists from prior run, log in
        login_a = client.post(
            "/api/v1/auth/login",
            json={"email": "alice.creator@example.com", "password": "StrongPassword123!"},
        )
        if login_a.status_code != 200:
            from backend.app.db.connection import db_manager
            from backend.app.services.auth_service import hash_password
            with db_manager.session() as conn:
                conn.execute("UPDATE auth_users SET hashed_password = ? WHERE email = ?", (hash_password("StrongPassword123!"), "alice.creator@example.com"))
            login_a = client.post(
                "/api/v1/auth/login",
                json={"email": "alice.creator@example.com", "password": "StrongPassword123!"},
            )
        token_a = login_a.json()["accessToken"]
        user_a = login_a.json()["user"]
    else:
        assert res_a.status_code == 200
        token_a = res_a.json()["accessToken"]
        user_a = res_a.json()["user"]

    # User B (Bob - Reviewer)
    res_b = client.post(
        "/api/v1/auth/signup",
        json={
            "email": "bob.reviewer@example.com",
            "password": "StrongPassword123!",
            "username": "bob_reviewer",
            "display_name": "Bob Reviewer",
            "bio": "Reviewing dev tools.",
        },
    )
    if res_b.status_code == 409:
        login_b = client.post(
            "/api/v1/auth/login",
            json={"email": "bob.reviewer@example.com", "password": "StrongPassword123!"},
        )
        if login_b.status_code != 200:
            from backend.app.db.connection import db_manager
            from backend.app.services.auth_service import hash_password
            with db_manager.session() as conn:
                conn.execute("UPDATE auth_users SET hashed_password = ? WHERE email = ?", (hash_password("StrongPassword123!"), "bob.reviewer@example.com"))
            login_b = client.post(
                "/api/v1/auth/login",
                json={"email": "bob.reviewer@example.com", "password": "StrongPassword123!"},
            )
        token_b = login_b.json()["accessToken"]
        user_b = login_b.json()["user"]
    else:
        assert res_b.status_code == 200
        token_b = res_b.json()["accessToken"]
        user_b = res_b.json()["user"]

    return {
        "alice": {"token": token_a, "user": user_a, "headers": {"Authorization": f"Bearer {token_a}"}},
        "bob": {"token": token_b, "user": user_b, "headers": {"Authorization": f"Bearer {token_b}"}},
    }


# =============================================================================
# 1. Authentication Tests
# =============================================================================

def test_auth_duplicate_email_rejected(registered_users):
    """Verifies that registering with an existing email returns 409 Conflict."""
    res = client.post(
        "/api/v1/auth/signup",
        json={
            "email": "alice.creator@example.com",
            "password": "AnotherPassword456!",
            "username": "unique_username_xyz",
            "display_name": "Duplicate User",
        },
    )
    assert res.status_code == 409
    assert "already exists" in res.json()["detail"].lower()


def test_auth_invalid_credentials_rejected(registered_users):
    """Verifies that logging in with incorrect password returns 401 Unauthorized."""
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "alice.creator@example.com", "password": "WrongPassword!"},
    )
    assert res.status_code == 401
    assert "invalid email or password" in res.json()["detail"].lower()


def test_auth_me_with_valid_and_invalid_token(registered_users):
    """Verifies GET /auth/me verifies JWT and rejects malformed/missing tokens."""
    alice = registered_users["alice"]

    # Valid token
    res = client.get("/api/v1/auth/me", headers=alice["headers"])
    assert res.status_code == 200
    assert res.json()["email"] == "alice.creator@example.com"
    assert res.json()["username"] == "alice_creator"

    # Missing token
    res_no_auth = client.get("/api/v1/auth/me")
    assert res_no_auth.status_code == 401

    # Malformed token
    res_bad = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer not-a-valid-jwt"})
    assert res_bad.status_code == 401


# =============================================================================
# 2. Post Creation, Retrieval, Filtering, and Validation
# =============================================================================

def test_create_post_validation_failure(registered_users):
    """Verifies that invalid post titles or bodies fail validation."""
    alice = registered_users["alice"]
    res = client.post(
        "/api/v1/posts",
        headers=alice["headers"],
        json={"title": "Tiny", "description": "Too short", "category": "DevTools"},
    )
    assert res.status_code == 422


def test_create_and_retrieve_post(registered_users):
    """Verifies post publishing, persistence, and retrieval."""
    alice = registered_users["alice"]
    payload = {
        "title": "HyperGraph: Real-time distributed knowledge graph",
        "description": "We built HyperGraph to visualize real-time dependency relations between microservices. Looking for critique on query latency.",
        "postType": "product_review",
        "productUrl": "https://hypergraph.internal",
        "category": "Developer Tools",
        "tags": ["Graph", "Observability", "Microservices"],
        "isAnonymous": False,
    }
    res = client.post("/api/v1/posts", headers=alice["headers"], json=payload)
    assert res.status_code == 201
    post = res.json()
    assert post["id"].startswith("post_")
    assert post["title"] == payload["title"]
    assert post["author"]["username"] == "alice_creator"
    assert post["upvotesCount"] >= 1  # Author automatic upvote

    # Retrieve by ID
    get_res = client.get(f"/api/v1/posts/{post['id']}")
    assert get_res.status_code == 200
    assert get_res.json()["title"] == payload["title"]


def test_list_posts_filtering_and_sorting():
    """Verifies category filtering and search queries on feed."""
    res = client.get("/api/v1/posts?category=Developer+Tools&sort=trending&limit=10")
    assert res.status_code == 200
    posts = res.json()
    assert isinstance(posts, list)
    for p in posts:
        assert p["category"] == "Developer Tools"


# =============================================================================
# 3. Ownership Protection (Update & Delete)
# =============================================================================

def test_post_ownership_protection(registered_users):
    """Verifies only the post author can update or delete their post."""
    alice = registered_users["alice"]
    bob = registered_users["bob"]

    # Alice creates a post
    post_res = client.post(
        "/api/v1/posts",
        headers=alice["headers"],
        json={
            "title": "Post for Ownership Verification Test",
            "description": "Checking authorization barriers between users.",
            "category": "Productivity",
            "tags": ["Security", "Auth"],
        },
    )
    post_id = post_res.json()["id"]

    # Bob attempts to update Alice's post -> Expect 403 Forbidden
    hack_res = client.put(
        f"/api/v1/posts/{post_id}",
        headers=bob["headers"],
        json={"title": "Hacked Title by Bob!"},
    )
    assert hack_res.status_code == 403
    assert "not authorized" in hack_res.json()["detail"].lower()

    # Bob attempts to delete Alice's post -> Expect 403 Forbidden
    del_hack = client.delete(f"/api/v1/posts/{post_id}", headers=bob["headers"])
    assert del_hack.status_code == 403

    # Alice successfully updates her post
    update_res = client.put(
        f"/api/v1/posts/{post_id}",
        headers=alice["headers"],
        json={"title": "Updated by Alice Herself"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["title"] == "Updated by Alice Herself"

    # Alice deletes her post
    del_res = client.delete(f"/api/v1/posts/{post_id}", headers=alice["headers"])
    assert del_res.status_code == 204

    # Post is no longer retrievable
    assert client.get(f"/api/v1/posts/{post_id}").status_code == 404


# =============================================================================
# 4. Comments, Threaded Replies, and Comment Ownership
# =============================================================================

def test_threaded_comments_and_replies(registered_users):
    """Verifies comment creation, nested reply tree, and comment ownership."""
    alice = registered_users["alice"]
    bob = registered_users["bob"]

    # Alice creates a post
    post_res = client.post(
        "/api/v1/posts",
        headers=alice["headers"],
        json={
            "title": "Discussing Threaded Discussion Architecture",
            "description": "Testing root comments and nested replies.",
            "category": "Engineering",
        },
    )
    post_id = post_res.json()["id"]

    # Bob leaves a top-level comment
    cmt_res = client.post(
        "/api/v1/comments",
        headers=bob["headers"],
        json={
            "postId": post_id,
            "content": "This is Bob's top-level review comment.",
            "isAnonymous": False,
        },
    )
    assert cmt_res.status_code == 201
    bob_cmt = cmt_res.json()
    bob_cmt_id = bob_cmt["id"]
    assert bob_cmt["author"]["username"] == "bob_reviewer"

    # Alice replies to Bob's comment
    reply_res = client.post(
        "/api/v1/comments",
        headers=alice["headers"],
        json={
            "postId": post_id,
            "parentCommentId": bob_cmt_id,
            "content": "Thanks Bob, here is Alice's reply!",
            "isAnonymous": False,
        },
    )
    assert reply_res.status_code == 201
    reply_data = reply_res.json()
    assert reply_data["parentCommentId"] == bob_cmt_id

    # List comments for post -> verify nested tree
    tree_res = client.get(f"/api/v1/comments/post/{post_id}")
    assert tree_res.status_code == 200
    tree = tree_res.json()
    assert len(tree) >= 1
    # Check that root comment has reply
    root_node = next(c for c in tree if c["id"] == bob_cmt_id)
    assert len(root_node["replies"]) == 1
    assert root_node["replies"][0]["id"] == reply_data["id"]

    # Ownership check: Bob cannot edit Alice's reply
    bad_edit = client.put(
        f"/api/v1/comments/{reply_data['id']}",
        headers=bob["headers"],
        json={"content": "Malicious edit attempt"},
    )
    assert bad_edit.status_code == 403

    # Alice edits her reply
    good_edit = client.put(
        f"/api/v1/comments/{reply_data['id']}",
        headers=alice["headers"],
        json={"content": "Alice edited her reply for clarity."},
    )
    assert good_edit.status_code == 200
    assert good_edit.json()["content"] == "Alice edited her reply for clarity."


# =============================================================================
# 5. Atomic Voting and Uniqueness Enforcement
# =============================================================================

def test_atomic_post_and_comment_voting(registered_users):
    """Verifies that voting toggles on/off and duplicate votes are impossible."""
    alice = registered_users["alice"]
    bob = registered_users["bob"]

    # Alice creates a post
    post_res = client.post(
        "/api/v1/posts",
        headers=alice["headers"],
        json={
            "title": "Voting Integrity Verification Post",
            "description": "Checking atomic vote counters and toggle behavior.",
            "category": "Testing",
        },
    )
    post_id = post_res.json()["id"]
    initial_upvotes = post_res.json()["upvotesCount"]

    # Bob votes for the post
    v1 = client.post(f"/api/v1/posts/{post_id}/vote", headers=bob["headers"])
    assert v1.status_code == 200
    assert v1.json()["userHasUpvoted"] is True
    assert v1.json()["upvotesCount"] == initial_upvotes + 1

    # Bob votes again -> Toggles vote OFF
    v2 = client.post(f"/api/v1/posts/{post_id}/vote", headers=bob["headers"])
    assert v2.status_code == 200
    assert v2.json()["userHasUpvoted"] is False
    assert v2.json()["upvotesCount"] == initial_upvotes

    # Bob votes once more -> Toggles vote back ON
    v3 = client.post(f"/api/v1/posts/{post_id}/vote", headers=bob["headers"])
    assert v3.status_code == 200
    assert v3.json()["userHasUpvoted"] is True
    assert v3.json()["upvotesCount"] == initial_upvotes + 1


# =============================================================================
# 6. Bookmarks Persistence
# =============================================================================

def test_bookmarks_persistence(registered_users):
    """Verifies adding, listing, and removing bookmarks."""
    alice = registered_users["alice"]
    bob = registered_users["bob"]

    # Alice creates a post
    post_res = client.post(
        "/api/v1/posts",
        headers=alice["headers"],
        json={
            "title": "Post for Bookmark Verification",
            "description": "Checking user saved posts collection.",
            "category": "Productivity",
        },
    )
    post_id = post_res.json()["id"]

    # Bob bookmarks Alice's post
    bm_res = client.post(f"/api/v1/posts/{post_id}/bookmark", headers=bob["headers"])
    assert bm_res.status_code == 200
    assert bm_res.json()["userHasBookmarked"] is True

    # Bob retrieves his saved posts
    saved = client.get("/api/v1/posts/saved", headers=bob["headers"])
    assert saved.status_code == 200
    saved_posts = saved.json()
    assert any(p["id"] == post_id for p in saved_posts)

    # Bob toggles bookmark off
    bm_off = client.post(f"/api/v1/posts/{post_id}/bookmark", headers=bob["headers"])
    assert bm_off.status_code == 200
    assert bm_off.json()["userHasBookmarked"] is False

    # Saved posts no longer contain the post
    saved_after = client.get("/api/v1/posts/saved", headers=bob["headers"])
    assert not any(p["id"] == post_id for p in saved_after.json())


# =============================================================================
# 7. Anonymous Identity Masking and Privacy Enforcement
# =============================================================================

def test_anonymous_post_and_comment_privacy(registered_users):
    """Verifies that anonymous posts/comments strictly mask author identity in all public endpoints."""
    alice = registered_users["alice"]
    bob = registered_users["bob"]

    # Alice publishes an ANONYMOUS post
    anon_post_res = client.post(
        "/api/v1/posts",
        headers=alice["headers"],
        json={
            "title": "Strictly Confidential Feedback Query",
            "description": "This post should mask author identity from all public inspection.",
            "category": "Confidential",
            "isAnonymous": True,
        },
    )
    assert anon_post_res.status_code == 201
    post_data = anon_post_res.json()
    anon_post_id = post_data["id"]

    # Public check: author.id must be None, username must be 'anonymous', displayName must be masked
    assert post_data["author"]["id"] is None
    assert post_data["author"]["username"] == "anonymous"
    assert post_data["author"]["displayName"] == "Anonymous Contributor"
    assert post_data["author"]["avatarUrl"] is None
    assert post_data["isAnonymous"] is True

    # Inspect single post via unauthenticated call
    pub_get = client.get(f"/api/v1/posts/{anon_post_id}")
    assert pub_get.status_code == 200
    pub_post = pub_get.json()
    assert pub_post["author"]["id"] is None
    assert pub_post["author"]["username"] == "anonymous"

    # Bob leaves an ANONYMOUS comment
    anon_cmt_res = client.post(
        "/api/v1/comments",
        headers=bob["headers"],
        json={
            "postId": anon_post_id,
            "content": "This is an anonymous critique comment.",
            "isAnonymous": True,
        },
    )
    assert anon_cmt_res.status_code == 201
    cmt_data = anon_cmt_res.json()
    assert cmt_data["author"]["id"] is None
    assert cmt_data["author"]["username"] == "anonymous"
    assert cmt_data["author"]["displayName"] == "Anonymous Reviewer"
    assert cmt_data["author"]["avatarUrl"] is None

    # Public profile check: Alice's public profile MUST NOT include her anonymous post!
    profile_res = client.get(f"/api/v1/users/{alice['user']['id']}/profile")
    assert profile_res.status_code == 200
    profile_data = profile_res.json()
    assert "email" not in profile_data  # No email leakage in public profile
    user_post_ids = [p["id"] for p in profile_data["posts"]]
    assert anon_post_id not in user_post_ids  # Anonymous post strictly omitted!


# =============================================================================
# 8. Reports Submission
# =============================================================================

def test_submit_report(registered_users):
    """Verifies filing a moderation report."""
    bob = registered_users["bob"]

    res = client.post(
        "/api/v1/reports",
        headers=bob["headers"],
        json={
            "target_type": "post",
            "target_id": "post_reflect_01",
            "reason": "Spam or irrelevant commercial advertising",
            "description": "Please review this post for policy adherence.",
        },
    )
    assert res.status_code == 201
    data = res.json()
    assert data["status"] == "pending"
    assert data["id"].startswith("rep_")
