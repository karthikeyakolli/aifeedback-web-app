"""Test suite for AI Online Sources Brain, Multi-Grounding, Moderation Shield, Changelogs, and Reddit-Style Discussion Lounge."""

import uuid
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.db.connection import db_manager
from backend.app.db.repository import community_repo
from backend.app.db.project_repository import project_repo
from backend.app.services.text_cleaner import audit_and_moderate_content
from backend.app.services.web_search_service import web_intelligence_service
from backend.app.services.project_chat_service import project_chat_service

client = TestClient(app)


def _signup_user(prefix: str):
    uid = uuid.uuid4().hex[:8]
    email = f"{prefix}_{uid}@example.com"
    pwd = f"Pass_{uid}_123!"
    resp = client.post(
        "/api/v1/auth/signup",
        json={
            "email": email,
            "password": pwd,
            "username": f"{prefix}_{uid}",
            "display_name": f"{prefix.title()} User",
        },
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    return {
        "user_id": data["user"]["id"],
        "token": data["accessToken"],
        "headers": {"Authorization": f"Bearer {data['accessToken']}"},
    }


def test_web_intelligence_service_standards_and_cache():
    """Verifies that online sources search returns structured evidence and caches properly."""
    res = web_intelligence_service.search_online_intelligence(
        query="OWASP API security authentication and tokens",
        project_domain="developer-tools",
        max_results=3,
    )
    assert len(res) > 0
    first = res[0]
    assert "title" in first
    assert "snippet" in first
    assert "domain" in first
    assert first["sourceType"] == "online_source"
    assert first["relevancePercentage"] >= 70

    # Second call should pull from SQLite cache
    cached_res = web_intelligence_service.search_online_intelligence(
        query="OWASP API security authentication and tokens",
        project_domain="developer-tools",
        max_results=3,
    )
    assert len(cached_res) == len(res)
    assert cached_res[0]["title"] == first["title"]


def test_recent_comments_discussion_feed_filtering():
    """Tests the Reddit-style global discussion endpoint with sorting and project filtering."""
    now = "2026-11-07T20:00:00Z"
    with db_manager.session() as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO auth_users (id, email, hashed_password, created_at)
            VALUES ('usr_test_lounge', 'lounge_test@example.com', 'hash', ?)
            """,
            (now,),
        )
        conn.execute(
            """
            INSERT OR REPLACE INTO profiles (id, username, display_name, created_at, updated_at)
            VALUES ('usr_test_lounge', 'lounge_tester', 'Lounge Tester', ?, ?)
            """,
            (now, now),
        )
        conn.execute(
            """
            INSERT OR REPLACE INTO projects (id, user_id, name, tagline, description, category, status, is_public, created_at, updated_at)
            VALUES ('proj_lounge_1', 'usr_test_lounge', 'Lounge Demo Project', 'Lounge Tagline', 'Testing lounge tags', 'developer-tools', 'published', 1, ?, ?)
            """,
            (now, now),
        )
        conn.execute(
            """
            INSERT OR REPLACE INTO posts (id, author_id, title, description, post_type, category, status, created_at, updated_at)
            VALUES ('proj_lounge_1', 'usr_test_lounge', 'Lounge Demo Project', 'Testing lounge tags', 'product_review', 'developer-tools', 'published', ?, ?)
            """,
            (now, now),
        )
        conn.execute(
            """
            INSERT OR REPLACE INTO comments (id, post_id, author_id, content, upvotes_count, is_anonymous, status, created_at, updated_at)
            VALUES ('cmt_lounge_1', 'proj_lounge_1', 'usr_test_lounge', 'Great architecture but needs better token validation', 12, 0, 'published', ?, ?)
            """,
            (now, now),
        )
        conn.execute(
            """
            INSERT OR REPLACE INTO comments (id, post_id, author_id, content, upvotes_count, is_anonymous, status, created_at, updated_at)
            VALUES ('cmt_lounge_2', 'proj_lounge_1', 'usr_test_lounge', 'Anonymous report: observed latency spikes during sync', 4, 1, 'published', ?, ?)
            """,
            (now, now),
        )

    # 1. Fetch all recent comments
    resp = client.get("/api/v1/comments/recent?limit=10")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 2

    # 2. Verify anonymous masking
    anon_item = next((c for c in data if c["id"] == "cmt_lounge_2"), None)
    assert anon_item is not None
    assert anon_item["isAnonymous"] is True
    assert anon_item["displayName"] == "Anonymous Reviewer"
    assert anon_item["avatarUrl"] is None

    # 3. Filter by project_id
    resp_filtered = client.get("/api/v1/comments/recent?project_id=proj_lounge_1")
    assert resp_filtered.status_code == 200
    filtered_data = resp_filtered.json()
    assert len(filtered_data) == 2
    assert all(c["projectId"] == "proj_lounge_1" for c in filtered_data)

    with db_manager.session() as conn:
        conn.execute("DELETE FROM comments WHERE id IN ('cmt_lounge_1', 'cmt_lounge_2')")
        conn.execute("DELETE FROM posts WHERE id = 'proj_lounge_1'")
        conn.execute("DELETE FROM projects WHERE id = 'proj_lounge_1'")
        conn.execute("DELETE FROM profiles WHERE id = 'usr_test_lounge'")
        conn.execute("DELETE FROM auth_users WHERE id = 'usr_test_lounge'")


def test_moderation_shield_and_spam_detection():
    """Verifies that the moderation shield audits content, filters spam/toxicity, and classifies sentiment."""
    # 1. Test clean constructive feedback
    allowed, reason, sentiment = audit_and_moderate_content("The responsive UI is sleek, but keyboard navigation could be improved.")
    assert allowed is True
    assert reason is None
    assert sentiment in ("constructive", "feature_request")

    # 2. Test bug report detection
    allowed, reason, sentiment = audit_and_moderate_content("The system crashes with infinite loop on invalid tokens.")
    assert allowed is True
    assert sentiment == "bug_report"

    # 3. Test praise detection
    allowed, reason, sentiment = audit_and_moderate_content("Great awesome tool! Superb design.")
    assert allowed is True
    assert sentiment == "praise"

    # 4. Test prohibited spam detection
    allowed, reason, sentiment = audit_and_moderate_content("Join our telegram t.me/free_crypto_airdrop for guaranteed 100x return")
    assert allowed is False
    assert "promotional spam" in reason
    assert sentiment == "spam"

    # 5. Test toxic phrase rejection
    allowed, reason, sentiment = audit_and_moderate_content("This is terrible, go kys right now")
    assert allowed is False
    assert "violates our community code of conduct" in reason
    assert sentiment == "toxic"

    # 6. Verify repository blocks spam with HTTP 422
    now = "2026-11-07T20:00:00Z"
    with db_manager.session() as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO auth_users (id, email, hashed_password, created_at)
            VALUES ('usr_mod_test', 'mod_test@example.com', 'hash', ?)
            """,
            (now,),
        )
        conn.execute(
            """
            INSERT OR REPLACE INTO profiles (id, username, display_name, created_at, updated_at)
            VALUES ('usr_mod_test', 'mod_tester', 'Mod Tester', ?, ?)
            """,
            (now, now),
        )
        conn.execute(
            """
            INSERT OR REPLACE INTO posts (id, author_id, title, description, post_type, category, status, created_at, updated_at)
            VALUES ('post_mod_target', 'usr_mod_test', 'Mod Target', 'Target description', 'product_review', 'general', 'published', ?, ?)
            """,
            (now, now),
        )

    with pytest.raises(HTTPException) as exc_info:
        community_repo.create_comment(
            post_id="post_mod_target",
            author_id="usr_mod_test",
            content="Check this casino online and guaranteed 100x profit!",
        )
    assert exc_info.value.status_code == 422
    assert "Community Moderation Shield" in exc_info.value.detail

    with db_manager.session() as conn:
        conn.execute("DELETE FROM posts WHERE id = 'post_mod_target'")
        conn.execute("DELETE FROM profiles WHERE id = 'usr_mod_test'")
        conn.execute("DELETE FROM auth_users WHERE id = 'usr_mod_test'")


def test_project_review_notifications():
    """Verifies that posting reviews on a project notifies the project creator."""
    now = "2026-11-07T20:00:00Z"
    with db_manager.session() as conn:
        # Creator user
        conn.execute("INSERT OR REPLACE INTO auth_users (id, email, hashed_password, created_at) VALUES ('usr_creator', 'creator@example.com', 'h', ?)", (now,))
        conn.execute("INSERT OR REPLACE INTO profiles (id, username, display_name, created_at, updated_at) VALUES ('usr_creator', 'creator_user', 'Creator User', ?, ?)", (now, now))
        # Reviewer user
        conn.execute("INSERT OR REPLACE INTO auth_users (id, email, hashed_password, created_at) VALUES ('usr_reviewer', 'reviewer@example.com', 'h', ?)", (now,))
        conn.execute("INSERT OR REPLACE INTO profiles (id, username, display_name, created_at, updated_at) VALUES ('usr_reviewer', 'reviewer_user', 'Reviewer User', ?, ?)", (now, now))
        # Creator's project
        conn.execute(
            """
            INSERT OR REPLACE INTO projects (id, user_id, name, tagline, description, category, status, is_public, created_at, updated_at)
            VALUES ('proj_notif_target', 'usr_creator', 'Notif Target Pro', 'Target Tagline', 'Desc', 'developer-tools', 'published', 1, ?, ?)
            """,
            (now, now),
        )
        # Companion post
        conn.execute(
            """
            INSERT OR REPLACE INTO posts (id, author_id, title, description, post_type, category, status, created_at, updated_at)
            VALUES ('proj_notif_target', 'usr_creator', 'Notif Target Pro', 'Desc', 'product_review', 'developer-tools', 'published', ?, ?)
            """,
            (now, now),
        )

    # Reviewer posts comment on creator's project
    comment = community_repo.create_comment(
        post_id="proj_notif_target",
        author_id="usr_reviewer",
        content="Great architecture! Consider adding rate limiting on auth endpoints.",
    )
    assert comment["id"] is not None

    # Verify notification created for creator
    notifs = community_repo.list_notifications(user_id="usr_creator")
    assert len(notifs) >= 1
    found = next((n for n in notifs if n["type"] == "project_review" and "Notif Target Pro" in n["title"]), None)
    assert found is not None
    assert found["linkUrl"] == "/project/proj_notif_target"
    assert "Reviewer User" in found["message"]

    # When creator comments on their own project, no duplicate self-notification is created
    initial_count = len(community_repo.list_notifications(user_id="usr_creator"))
    community_repo.create_comment(
        post_id="proj_notif_target",
        author_id="usr_creator",
        content="Thanks for the feedback! We are implementing rate limits now.",
    )
    new_count = len(community_repo.list_notifications(user_id="usr_creator"))
    assert new_count == initial_count

    # Cleanup
    with db_manager.session() as conn:
        conn.execute("DELETE FROM notifications WHERE user_id = 'usr_creator'")
        conn.execute("DELETE FROM comments WHERE post_id = 'proj_notif_target'")
        conn.execute("DELETE FROM posts WHERE id = 'proj_notif_target'")
        conn.execute("DELETE FROM projects WHERE id = 'proj_notif_target'")
        conn.execute("DELETE FROM profiles WHERE id IN ('usr_creator', 'usr_reviewer')")
        conn.execute("DELETE FROM auth_users WHERE id IN ('usr_creator', 'usr_reviewer')")


def test_project_changelog_lifecycle():
    """Verifies that project owners can publish changelogs and public viewers see released notes."""
    creator = _signup_user("creator_cl")
    other_user = _signup_user("guest_cl")

    # 1. Create a project
    create_proj_resp = client.post(
        "/api/v1/projects",
        headers=creator["headers"],
        json={
            "name": "Changelog Demo Pro",
            "tagline": "Realtime changelog tracking",
            "description": "Continuous feedback to release lifecycle",
            "category": "developer-tools",
            "isPublic": True,
        },
    )
    assert create_proj_resp.status_code == 201, create_proj_resp.text
    proj_id = create_proj_resp.json()["id"]

    # 2. Add public changelog entry
    entry_1_resp = client.post(
        f"/api/v1/projects/{proj_id}/changelog",
        headers=creator["headers"],
        json={
            "versionTag": "v1.1.0",
            "title": "Token Refresh & Session Fixes",
            "description": "Resolved session invalidation bugs flagged by community reviews.",
            "isPublic": True,
        },
    )
    assert entry_1_resp.status_code == 201, entry_1_resp.text
    entry_1 = entry_1_resp.json()
    assert entry_1["versionTag"] == "v1.1.0"
    assert entry_1["title"] == "Token Refresh & Session Fixes"
    entry_1_id = entry_1["id"]

    # 3. Add private draft changelog entry
    entry_2_resp = client.post(
        f"/api/v1/projects/{proj_id}/changelog",
        headers=creator["headers"],
        json={
            "versionTag": "v1.2.0-rc",
            "title": "Upcoming Engine v2 Preview",
            "description": "Internal test of next-gen caching engine.",
            "isPublic": False,
        },
    )
    assert entry_2_resp.status_code == 201
    entry_2_id = entry_2_resp.json()["id"]

    # 4. Guest / unauthenticated viewer sees only public entry
    guest_view = client.get(f"/api/v1/projects/{proj_id}/changelog")
    assert guest_view.status_code == 200
    guest_entries = guest_view.json()
    assert len(guest_entries) == 1
    assert guest_entries[0]["id"] == entry_1_id

    # 5. Creator sees both public and draft entries
    creator_view = client.get(f"/api/v1/projects/{proj_id}/changelog", headers=creator["headers"])
    assert creator_view.status_code == 200
    creator_entries = creator_view.json()
    assert len(creator_entries) == 2

    # 6. Other user cannot delete creator's changelog entry (isolated with 404)
    unauth_del = client.delete(f"/api/v1/projects/{proj_id}/changelog/{entry_1_id}", headers=other_user["headers"])
    assert unauth_del.status_code == 404

    # 7. Creator deletes changelog entry
    auth_del = client.delete(f"/api/v1/projects/{proj_id}/changelog/{entry_1_id}", headers=creator["headers"])
    assert auth_del.status_code == 200

    # 8. Verify entry_1 is removed
    after_del = client.get(f"/api/v1/projects/{proj_id}/changelog", headers=creator["headers"])
    assert len(after_del.json()) == 1
    assert after_del.json()[0]["id"] == entry_2_id

    # Cleanup
    with db_manager.session() as conn:
        conn.execute("DELETE FROM project_changelog_entries WHERE project_id = ?", (proj_id,))
        conn.execute("DELETE FROM projects WHERE id = ?", (proj_id,))
        conn.execute("DELETE FROM posts WHERE id = ?", (proj_id,))
        conn.execute("DELETE FROM profiles WHERE id IN (?, ?)", (creator["user_id"], other_user["user_id"]))
        conn.execute("DELETE FROM auth_users WHERE id IN (?, ?)", (creator["user_id"], other_user["user_id"]))


def test_similar_projects_ecosystem_cross_referencing():
    """Verifies that project chat cross-references peer projects in the same category on FeedbackAI."""
    now = "2026-11-07T20:00:00Z"
    with db_manager.session() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO auth_users (id, email, hashed_password, created_at) VALUES ('usr_peer_eval', 'peer@example.com', 'hash', ?)",
            (now,),
        )
        conn.execute(
            "INSERT OR REPLACE INTO profiles (id, username, display_name, created_at, updated_at) VALUES ('usr_peer_eval', 'peer_user', 'Peer User', ?, ?)",
            (now, now),
        )
        # Project A (Target)
        conn.execute(
            """
            INSERT OR REPLACE INTO projects (id, user_id, name, tagline, description, category, status, is_public, created_at, updated_at)
            VALUES ('proj_peer_a', 'usr_peer_eval', 'Cloud Vault', 'Enterprise key vault', 'Vault description', 'developer-tools', 'published', 1, ?, ?)
            """,
            (now, now),
        )
        # Project B (Peer in same category)
        conn.execute(
            """
            INSERT OR REPLACE INTO projects (id, user_id, name, tagline, description, category, status, is_public, created_at, updated_at)
            VALUES ('proj_peer_b', 'usr_peer_eval', 'Token Guardian', 'Distributed session shield', 'Shield description', 'developer-tools', 'published', 1, ?, ?)
            """,
            (now, now),
        )

    # Verify _fetch_similar_projects returns peer project B
    peers = project_chat_service._fetch_similar_projects(
        project_id="proj_peer_a",
        category="developer-tools",
        limit=3,
    )
    assert len(peers) >= 1
    found_peer = next((p for p in peers if p["id"] == "proj_peer_b"), None)
    assert found_peer is not None
    assert found_peer["name"] == "Token Guardian"
    assert found_peer["tagline"] == "Distributed session shield"

    # Verify chat session includes similar_project citation
    chat = project_chat_service.create_chat(
        project_id="proj_peer_a",
        user_id="usr_peer_eval",
        title="Peer Ecosystem Comparison",
    )
    result = project_chat_service.send_message(
        chat_id=chat["id"],
        user_id="usr_peer_eval",
        content="How does our key vault compare to other developer tools in the ecosystem?",
    )
    assert "assistantMessage" in result
    citations = result["assistantMessage"]["citations"]
    peer_cites = [c for c in citations if c.get("sourceType") == "similar_project"]
    assert len(peer_cites) >= 1
    assert any(c["projectName"] == "Token Guardian" for c in peer_cites)

    # Cleanup
    with db_manager.session() as conn:
        conn.execute("DELETE FROM project_chats WHERE id = ?", (chat["id"],))
        conn.execute("DELETE FROM projects WHERE id IN ('proj_peer_a', 'proj_peer_b')")
        conn.execute("DELETE FROM profiles WHERE id = 'usr_peer_eval'")
        conn.execute("DELETE FROM auth_users WHERE id = 'usr_peer_eval'")


def test_multi_grounded_project_chat_with_brain():
    """Verifies that project chat integrates specs, user reviews, and online brain citations."""
    now = "2026-11-07T20:00:00Z"
    with db_manager.session() as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO auth_users (id, email, hashed_password, created_at)
            VALUES ('usr_chat_researcher', 'researcher@example.com', 'hash', ?)
            """,
            (now,),
        )
        conn.execute(
            """
            INSERT OR REPLACE INTO profiles (id, username, display_name, created_at, updated_at)
            VALUES ('usr_chat_researcher', 'researcher_dan', 'Dan Researcher', ?, ?)
            """,
            (now, now),
        )
        conn.execute(
            """
            INSERT OR REPLACE INTO projects (id, user_id, name, tagline, description, category, status, is_public, created_at, updated_at)
            VALUES ('proj_chat_test', 'usr_chat_researcher', 'Security Vault Pro', 'Vault Tagline', 'End to end encryption with token storage', 'developer-tools', 'published', 1, ?, ?)
            """,
            (now, now),
        )

    # Create chat session
    chat = project_chat_service.create_chat(
        project_id="proj_chat_test",
        user_id="usr_chat_researcher",
        title="Security & Standards Deep Dive",
    )
    assert chat["id"] is not None

    # Send research question
    result = project_chat_service.send_message(
        chat_id=chat["id"],
        user_id="usr_chat_researcher",
        content="What are the security requirements and OWASP standards for token management?",
    )

    assert "assistantMessage" in result
    asst_msg = result["assistantMessage"]
    assert len(asst_msg["content"]) > 50
    assert "citations" in asst_msg
    # Verify citations contain multi-source grounding (e.g. online_source or project_spec)
    citations = asst_msg["citations"]
    assert len(citations) > 0
    assert any(c.get("sourceType") in ("online_source", "project_spec", "user_review", "similar_project") for c in citations)

    # Clean up test rows
    with db_manager.session() as conn:
        conn.execute("DELETE FROM project_chats WHERE id = ?", (chat["id"],))
        conn.execute("DELETE FROM projects WHERE id = 'proj_chat_test'")
        conn.execute("DELETE FROM profiles WHERE id = 'usr_chat_researcher'")
        conn.execute("DELETE FROM auth_users WHERE id = 'usr_chat_researcher'")
