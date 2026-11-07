"""Relational Repository Service for Product Research Intelligence.

Provides data access for Profiles, Posts, Comments, Votes, Bookmarks, and Reports,
enforcing database uniqueness constraints, transactional consistency, and strict
anonymous identity masking.
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any, Tuple
from fastapi import HTTPException, status

from backend.app.db.connection import db_manager
from backend.app.services.auth_service import hash_password, verify_password


def utc_now_iso() -> str:
    """Returns current UTC timestamp in ISO 8601 format."""
    return datetime.now(timezone.utc).isoformat()


class CommunityRepository:
    """Encapsulates all database operations for the community platform."""

    def __init__(self) -> None:
        self.db = db_manager
        self.ensure_seed_data()

    # -------------------------------------------------------------------------
    # Authentication & Profiles
    # -------------------------------------------------------------------------
    def create_user(
        self,
        email: str,
        password: str,
        username: str,
        display_name: str,
        bio: str = "",
        avatar_url: Optional[str] = None,
    ) -> Tuple[str, Dict[str, Any]]:
        """Registers a new user and profile."""
        with self.db.session() as conn:
            # Check unique email
            existing_email = conn.execute(
                "SELECT id FROM auth_users WHERE lower(email) = lower(?)", (email.strip(),)
            ).fetchone()
            if existing_email:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="An account with this email address already exists.",
                )

            # Check unique username
            existing_user = conn.execute(
                "SELECT id FROM profiles WHERE lower(username) = lower(?)", (username.strip(),)
            ).fetchone()
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="This username is already taken. Please choose another.",
                )

            user_id = f"usr_{uuid.uuid4().hex[:12]}"
            now = utc_now_iso()
            hashed = hash_password(password)

            conn.execute(
                "INSERT INTO auth_users (id, email, hashed_password, created_at) VALUES (?, ?, ?, ?)",
                (user_id, email.strip().lower(), hashed, now),
            )

            conn.execute(
                """INSERT INTO profiles (
                    id, username, display_name, avatar_url, bio, reputation_score, is_moderator, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    user_id,
                    username.strip(),
                    display_name.strip(),
                    avatar_url,
                    bio.strip(),
                    10,
                    0,
                    now,
                    now,
                ),
            )

        profile = self.get_profile(user_id)
        return user_id, profile


    def authenticate_user(self, email: str, password: str) -> Dict[str, Any]:
        """Authenticates user credentials and returns the profile."""
        with self.db.session() as conn:
            user = conn.execute(
                "SELECT id, email, hashed_password FROM auth_users WHERE lower(email) = lower(?)",
                (email.strip(),),
            ).fetchone()
            if not user or not verify_password(password, user["hashed_password"]):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password.",
                )
            return self.get_profile(user["id"])

    def get_profile(self, user_id: str) -> Dict[str, Any]:
        """Retrieves profile by user ID."""
        with self.db.session() as conn:
            row = conn.execute(
                """SELECT p.*, u.email FROM profiles p
                LEFT JOIN auth_users u ON p.id = u.id
                WHERE p.id = ?""",
                (user_id,),
            ).fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="User profile not found.")
            return {
                "id": row["id"],
                "username": row["username"],
                "displayName": row["display_name"],
                "email": row["email"],
                "avatarUrl": row["avatar_url"],
                "bio": row["bio"],
                "reputationScore": row["reputation_score"],
                "isModerator": bool(row["is_moderator"]),
                "joinedAt": row["created_at"],
            }

    def ensure_profile_exists(
        self,
        user_id: str,
        email: str = "",
        username: Optional[str] = None,
        display_name: Optional[str] = None,
        avatar_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Ensures an authenticated Supabase user has a local profile record in the repository."""
        with self.db.session() as conn:
            existing = conn.execute("SELECT id FROM profiles WHERE id = ?", (user_id,)).fetchone()
            if existing:
                return self.get_profile(user_id)

            now = utc_now_iso()
            # Generate safe fallback username if not provided or collision exists
            base_username = (username or (email.split("@")[0] if email else f"user_{user_id[:8]}")).strip()
            resolved_username = base_username
            collision = conn.execute(
                "SELECT id FROM profiles WHERE lower(username) = lower(?)", (resolved_username,)
            ).fetchone()
            if collision:
                resolved_username = f"{base_username}_{uuid.uuid4().hex[:4]}"

            resolved_display_name = (display_name or resolved_username).strip()

            if email:
                conn.execute(
                    """INSERT OR IGNORE INTO auth_users (id, email, hashed_password, created_at)
                    VALUES (?, ?, ?, ?)""",
                    (user_id, email.lower().strip(), "SUPABASE_MANAGED_AUTH", now),
                )

            conn.execute(
                """INSERT INTO profiles (
                    id, username, display_name, avatar_url, bio, reputation_score, is_moderator, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    user_id,
                    resolved_username,
                    resolved_display_name,
                    avatar_url,
                    "",
                    10,
                    0,
                    now,
                    now,
                ),
            )

        return self.get_profile(user_id)


    def get_public_profile(self, user_id: str) -> Dict[str, Any]:
        """Retrieves public profile for any user, omitting private info (email) and all anonymous posts."""
        with self.db.session() as conn:
            row = conn.execute(
                """SELECT id, username, display_name, avatar_url, bio, reputation_score, is_moderator, created_at
                FROM profiles
                WHERE id = ?""",
                (user_id,),
            ).fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="User profile not found.")

            # Get public (non-anonymous) posts by this user
            post_rows = conn.execute(
                """SELECT p.*, pr.username, pr.display_name, pr.avatar_url, pr.reputation_score
                FROM posts p
                JOIN profiles pr ON p.author_id = pr.id
                WHERE p.author_id = ? AND p.is_anonymous = 0 AND p.status = 'published'
                ORDER BY p.created_at DESC""",
                (user_id,),
            ).fetchall()

            return {
                "id": row["id"],
                "username": row["username"],
                "displayName": row["display_name"],
                "avatarUrl": row["avatar_url"],
                "bio": row["bio"],
                "reputationScore": row["reputation_score"],
                "joinedAt": row["created_at"],
                "posts": [self._serialize_post(pr) for pr in post_rows],
            }


    # -------------------------------------------------------------------------
    # Phase 3: Identity Linking, MFA, and Password Reset
    # -------------------------------------------------------------------------
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Finds user by email in auth_users."""
        with self.db.session() as conn:
            row = conn.execute(
                "SELECT id, email FROM auth_users WHERE lower(email) = lower(?)",
                (email.strip(),),
            ).fetchone()
            if not row:
                return None
            return {"id": row["id"], "email": row["email"]}

    def create_password_reset_token(self, user_id: str, token: str, expires_at: str) -> None:
        """Stores a cryptographically secure one-time password reset token."""
        now = utc_now_iso()
        with self.db.session() as conn:
            conn.execute(
                """
                INSERT INTO password_reset_tokens (token, user_id, expires_at, used, created_at)
                VALUES (?, ?, ?, 0, ?)
                """,
                (token, user_id, expires_at, now),
            )

    def consume_password_reset_token(self, token: str, new_hashed_password: str) -> bool:
        """Atomically validates, consumes token, and updates password."""
        now = utc_now_iso()
        with self.db.session() as conn:
            row = conn.execute(
                """
                SELECT token, user_id, expires_at, used
                FROM password_reset_tokens
                WHERE token = ?
                """,
                (token,),
            ).fetchone()
            if not row or row["used"] == 1:
                return False
            if row["expires_at"] < now:
                return False

            user_id = row["user_id"]
            conn.execute(
                "UPDATE auth_users SET hashed_password = ? WHERE id = ?",
                (new_hashed_password, user_id),
            )
            conn.execute(
                "UPDATE password_reset_tokens SET used = 1 WHERE token = ?",
                (token,),
            )
            return True

    def get_user_identity(self, provider: str, provider_subject: str) -> Optional[Dict[str, Any]]:
        """Looks up linked OAuth identity."""
        with self.db.session() as conn:
            row = conn.execute(
                """
                SELECT id, user_id, provider, provider_subject, email, created_at
                FROM user_identities
                WHERE provider = ? AND provider_subject = ?
                """,
                (provider.lower(), provider_subject),
            ).fetchone()
            if not row:
                return None
            return dict(row)

    def link_user_identity(self, user_id: str, provider: str, provider_subject: str, email: str) -> Dict[str, Any]:
        """Links an OAuth identity to a user account."""
        now = utc_now_iso()
        ident_id = str(uuid.uuid4())
        with self.db.session() as conn:
            existing = conn.execute(
                "SELECT user_id FROM user_identities WHERE provider = ? AND provider_subject = ?",
                (provider.lower(), provider_subject),
            ).fetchone()
            if existing and existing["user_id"] != user_id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"This {provider.title()} account is already linked to a different profile.",
                )
            if not existing:
                conn.execute(
                    """
                    INSERT INTO user_identities (id, user_id, provider, provider_subject, email, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (ident_id, user_id, provider.lower(), provider_subject, email, now),
                )
            return {
                "id": ident_id if not existing else existing.get("id", ident_id),
                "userId": user_id,
                "provider": provider.lower(),
                "providerSubject": provider_subject,
                "email": email,
                "createdAt": now,
            }

    def list_user_identities(self, user_id: str) -> List[Dict[str, Any]]:
        """Returns all linked OAuth identities for a user."""
        with self.db.session() as conn:
            rows = conn.execute(
                """
                SELECT id, user_id, provider, provider_subject, email, created_at
                FROM user_identities
                WHERE user_id = ?
                ORDER BY created_at ASC
                """,
                (user_id,),
            ).fetchall()
            return [
                {
                    "id": r["id"],
                    "userId": r["user_id"],
                    "provider": r["provider"],
                    "providerSubject": r["provider_subject"],
                    "email": r["email"],
                    "createdAt": r["created_at"],
                }
                for r in rows
            ]

    def unlink_user_identity(self, user_id: str, provider: str) -> bool:
        """Removes a linked OAuth identity."""
        with self.db.session() as conn:
            res = conn.execute(
                "DELETE FROM user_identities WHERE user_id = ? AND provider = ?",
                (user_id, provider.lower()),
            )
            return res.rowcount > 0

    def get_user_mfa(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves user's MFA record."""
        with self.db.session() as conn:
            row = conn.execute(
                "SELECT id, user_id, factor_type, secret_encrypted, is_enabled, created_at, updated_at FROM user_mfa WHERE user_id = ?",
                (user_id,),
            ).fetchone()
            if not row:
                return None
            return dict(row)

    def set_user_mfa_secret(self, user_id: str, factor_type: str, secret_encrypted: str) -> Dict[str, Any]:
        """Creates or replaces an unverified MFA secret."""
        now = utc_now_iso()
        mfa_id = str(uuid.uuid4())
        with self.db.session() as conn:
            existing = conn.execute("SELECT id FROM user_mfa WHERE user_id = ?", (user_id,)).fetchone()
            if existing:
                conn.execute(
                    """
                    UPDATE user_mfa
                    SET factor_type = ?, secret_encrypted = ?, is_enabled = 0, updated_at = ?
                    WHERE user_id = ?
                    """,
                    (factor_type, secret_encrypted, now, user_id),
                )
                mfa_id = existing["id"]
            else:
                conn.execute(
                    """
                    INSERT INTO user_mfa (id, user_id, factor_type, secret_encrypted, is_enabled, created_at, updated_at)
                    VALUES (?, ?, ?, ?, 0, ?, ?)
                    """,
                    (mfa_id, user_id, factor_type, secret_encrypted, now, now),
                )
            return {"id": mfa_id, "userId": user_id, "factorType": factor_type, "isEnabled": False}

    def enable_user_mfa(self, user_id: str) -> bool:
        """Enables MFA after successful TOTP challenge."""
        now = utc_now_iso()
        with self.db.session() as conn:
            res = conn.execute(
                "UPDATE user_mfa SET is_enabled = 1, updated_at = ? WHERE user_id = ?",
                (now, user_id),
            )
            return res.rowcount > 0

    def disable_user_mfa(self, user_id: str) -> bool:
        """Disables/unenrolls user's MFA factor."""
        with self.db.session() as conn:
            res = conn.execute("DELETE FROM user_mfa WHERE user_id = ?", (user_id,))
            return res.rowcount > 0


    # -------------------------------------------------------------------------
    # Posts CRUD
    # -------------------------------------------------------------------------
    def create_post(self, author_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        post_id = f"post_{uuid.uuid4().hex[:12]}"
        now = utc_now_iso()
        tags_json = json.dumps(data.get("tags", []))
        is_anon = 1 if (data.get("is_anonymous") or data.get("isAnonymous")) else 0

        with self.db.session() as conn:
            conn.execute(
                """INSERT INTO posts (
                    id, author_id, title, description, post_type, product_url,
                    category, tags, is_anonymous, upvotes_count, comments_count,
                    status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    post_id,
                    author_id,
                    data["title"].strip(),
                    data["description"].strip(),
                    data.get("postType") or data.get("post_type", "product_review"),
                    data.get("productUrl") or data.get("product_url"),
                    data["category"],
                    tags_json,
                    is_anon,
                    1,  # Author starts with 1 upvote
                    0,
                    "published",
                    now,
                    now,
                ),
            )
            # Record author's upvote in post_votes table
            conn.execute(
                "INSERT INTO post_votes (id, post_id, user_id, vote_type, created_at) VALUES (?, ?, ?, ?, ?)",
                (f"pv_{uuid.uuid4().hex[:12]}", post_id, author_id, 1, now),
            )

        return self.get_post(post_id, current_user_id=author_id)

    def get_post(self, post_id: str, current_user_id: Optional[str] = None) -> Dict[str, Any]:
        """Retrieves full post with serialized author and user engagement status."""
        with self.db.session() as conn:
            post = conn.execute(
                """SELECT p.*, pr.username, pr.display_name, pr.avatar_url, pr.reputation_score
                FROM posts p
                JOIN profiles pr ON p.author_id = pr.id
                WHERE p.id = ? AND p.status != 'moderated'""",
                (post_id,),
            ).fetchone()

            if not post:
                raise HTTPException(status_code=404, detail=f"Post '{post_id}' not found.")

            user_upvoted = False
            user_bookmarked = False
            if current_user_id:
                uv = conn.execute(
                    "SELECT 1 FROM post_votes WHERE post_id = ? AND user_id = ? AND vote_type = 1",
                    (post_id, current_user_id),
                ).fetchone()
                user_upvoted = bool(uv)

                bm = conn.execute(
                    "SELECT 1 FROM bookmarks WHERE post_id = ? AND user_id = ?",
                    (post_id, current_user_id),
                ).fetchone()
                user_bookmarked = bool(bm)

            return self._serialize_post(post, user_upvoted, user_bookmarked)

    def list_posts(
        self,
        category: Optional[str] = None,
        tag: Optional[str] = None,
        sort: str = "trending",
        search: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
        current_user_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Lists published posts with filtering, search, sorting, and pagination."""
        with self.db.session() as conn:
            query = """SELECT p.*, pr.username, pr.display_name, pr.avatar_url, pr.reputation_score
            FROM posts p
            JOIN profiles pr ON p.author_id = pr.id
            WHERE p.status = 'published'"""
            params: List[Any] = []

            if category and category.lower() != "all":
                query += " AND p.category = ?"
                params.append(category)

            if search and search.strip():
                pattern = f"%{search.strip().lower()}%"
                query += " AND (lower(p.title) LIKE ? OR lower(p.description) LIKE ?)"
                params.extend([pattern, pattern])

            if tag and tag.strip():
                tag_pattern = f"%\"{tag.strip()}\"%"
                query += " AND p.tags LIKE ?"
                params.append(tag_pattern)

            if sort == "trending":
                query += " ORDER BY p.upvotes_count DESC, p.created_at DESC"
            elif sort == "recent":
                query += " ORDER BY p.created_at DESC"
            elif sort == "comments":
                query += " ORDER BY p.comments_count DESC, p.created_at DESC"
            else:
                query += " ORDER BY p.created_at DESC"

            query += " LIMIT ? OFFSET ?"
            params.extend([limit, offset])

            rows = conn.execute(query, params).fetchall()

            # Retrieve user engagement states
            user_upvotes = set()
            user_bookmarks = set()
            if current_user_id and rows:
                p_ids = [r["id"] for r in rows]
                placeholders = ",".join("?" for _ in p_ids)
                upvote_rows = conn.execute(
                    f"SELECT post_id FROM post_votes WHERE user_id = ? AND vote_type = 1 AND post_id IN ({placeholders})",
                    [current_user_id, *p_ids],
                ).fetchall()
                user_upvotes = {r["post_id"] for r in upvote_rows}

                bm_rows = conn.execute(
                    f"SELECT post_id FROM bookmarks WHERE user_id = ? AND post_id IN ({placeholders})",
                    [current_user_id, *p_ids],
                ).fetchall()
                user_bookmarks = {r["post_id"] for r in bm_rows}

            return [
                self._serialize_post(r, r["id"] in user_upvotes, r["id"] in user_bookmarks)
                for r in rows
            ]

    def update_post(self, post_id: str, author_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Updates an owned post. Enforces strict server-side author ownership."""
        with self.db.session() as conn:
            post = conn.execute("SELECT author_id FROM posts WHERE id = ?", (post_id,)).fetchone()
            if not post:
                raise HTTPException(status_code=404, detail="Post not found.")
            if post["author_id"] != author_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You are not authorized to edit this post. Only the author can modify it.",
                )

            fields = []
            values = []
            if "title" in data and data["title"]:
                fields.append("title = ?")
                values.append(data["title"].strip())
            if "description" in data and data["description"]:
                fields.append("description = ?")
                values.append(data["description"].strip())
            if "category" in data and data["category"]:
                fields.append("category = ?")
                values.append(data["category"])
            if "tags" in data and isinstance(data["tags"], list):
                fields.append("tags = ?")
                values.append(json.dumps(data["tags"]))
            if "product_url" in data:
                fields.append("product_url = ?")
                values.append(data["product_url"])

            if fields:
                fields.append("updated_at = ?")
                values.append(utc_now_iso())
                values.append(post_id)
                conn.execute(f"UPDATE posts SET {', '.join(fields)} WHERE id = ?", values)

        return self.get_post(post_id, current_user_id=author_id)

    def delete_post(self, post_id: str, author_id: str) -> None:
        """Deletes an owned post."""
        with self.db.session() as conn:
            post = conn.execute("SELECT author_id FROM posts WHERE id = ?", (post_id,)).fetchone()
            if not post:
                raise HTTPException(status_code=404, detail="Post not found.")
            if post["author_id"] != author_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You are not authorized to delete this post.",
                )
            conn.execute("DELETE FROM posts WHERE id = ?", (post_id,))

    # -------------------------------------------------------------------------
    # Comments CRUD & Recursive Hierarchy
    # -------------------------------------------------------------------------
    def create_comment(
        self,
        post_id: str,
        author_id: str,
        content: str,
        is_anonymous: bool = False,
        parent_comment_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Creates and persists a comment or reply."""
        # Automated Moderation & Spam Shield
        from backend.app.services.text_cleaner import audit_and_moderate_content
        is_ok, reason, _ = audit_and_moderate_content(content)
        if not is_ok:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Community Moderation Shield: {reason}",
            )

        comment_id = f"cmt_{uuid.uuid4().hex[:12]}"
        now = utc_now_iso()
        is_anon = 1 if is_anonymous else 0

        with self.db.session() as conn:
            # Verify post exists & check lock status (auto-syncing project companion post if needed)
            post = conn.execute("SELECT id, title, author_id, status FROM posts WHERE id = ?", (post_id,)).fetchone()
            if not post:
                proj = conn.execute("SELECT id, user_id, name, description, category, demo_url, repository_url FROM projects WHERE id = ?", (post_id,)).fetchone()
                if proj:
                    conn.execute(
                        """
                        INSERT OR IGNORE INTO posts (
                            id, author_id, title, description, post_type, category,
                            product_url, status, created_at, updated_at
                        ) VALUES (?, ?, ?, ?, 'product_review', ?, ?, 'published', ?, ?)
                        """,
                        (
                            proj["id"], proj["user_id"], proj["name"], proj["description"],
                            proj["category"], proj["demo_url"] or proj["repository_url"] or "",
                            now, now,
                        ),
                    )
                    post = conn.execute("SELECT id, title, author_id, status FROM posts WHERE id = ?", (post_id,)).fetchone()

            if not post:
                raise HTTPException(status_code=404, detail="Post not found.")
            if post["status"] == "locked":
                prof = conn.execute("SELECT is_moderator FROM profiles WHERE id = ?", (author_id,)).fetchone()
                if not (prof and prof["is_moderator"]):
                    raise HTTPException(status_code=403, detail="This discussion has been locked by a moderator.")

            # If parent comment is supplied, verify it belongs to the same post
            parent_author_id = None
            if parent_comment_id:
                parent = conn.execute(
                    "SELECT post_id, author_id FROM comments WHERE id = ?", (parent_comment_id,)
                ).fetchone()
                if not parent:
                    raise HTTPException(status_code=404, detail="Parent comment not found.")
                if parent["post_id"] != post_id:
                    raise HTTPException(
                        status_code=400, detail="Parent comment does not belong to this post."
                    )
                parent_author_id = parent["author_id"]

            conn.execute(
                """INSERT INTO comments (
                    id, post_id, parent_comment_id, author_id, content,
                    is_anonymous, upvotes_count, is_helpful_flag, status,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    comment_id,
                    post_id,
                    parent_comment_id,
                    author_id,
                    content.strip(),
                    is_anon,
                    0,
                    0,
                    "published",
                    now,
                    now,
                ),
            )

            # Increment comment count
            conn.execute(
                "UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?",
                (post_id,),
            )

            # Social Translucence & Awareness: Trigger notification for parent author or post author
            commenter_name = "Someone" if is_anonymous else "A member"
            if not is_anonymous:
                c_prof = conn.execute("SELECT display_name, username FROM profiles WHERE id = ?", (author_id,)).fetchone()
                if c_prof:
                    commenter_name = c_prof["display_name"] or c_prof["username"]

            if parent_author_id and parent_author_id != author_id:
                notif_id = f"notif_{uuid.uuid4().hex[:12]}"
                conn.execute(
                    """INSERT INTO notifications (id, user_id, actor_id, type, title, message, link_url, is_read, created_at)
                    VALUES (?, ?, ?, 'reply', 'New reply to your comment', ?, ?, 0, ?)""",
                    (
                        notif_id,
                        parent_author_id,
                        None if is_anonymous else author_id,
                        f'{commenter_name} replied: "{content.strip()[:60]}..."',
                        f"/posts/{post_id}",
                        now,
                    ),
                )
            elif not parent_author_id and post["author_id"] != author_id:
                notif_id = f"notif_{uuid.uuid4().hex[:12]}"
                proj_row = conn.execute("SELECT id, name FROM projects WHERE id = ?", (post_id,)).fetchone()
                if proj_row:
                    notif_type = "project_review"
                    notif_title = f"New review on #{proj_row['name']}"
                    notif_url = f"/project/{proj_row['id']}"
                    notif_msg = f'{commenter_name} posted a community review on #{proj_row["name"]}: "{content.strip()[:60]}..."'
                else:
                    notif_type = "comment"
                    notif_title = "New comment on your discussion"
                    notif_url = f"/posts/{post_id}"
                    notif_msg = f'{commenter_name} commented on "{post["title"][:40]}": "{content.strip()[:60]}..."'

                conn.execute(
                    """INSERT INTO notifications (id, user_id, actor_id, type, title, message, link_url, is_read, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)""",
                    (
                        notif_id,
                        post["author_id"],
                        None if is_anonymous else author_id,
                        notif_type,
                        notif_title,
                        notif_msg,
                        notif_url,
                        now,
                    ),
                )

        return self.get_comment(comment_id, current_user_id=author_id)

    def get_comment(self, comment_id: str, current_user_id: Optional[str] = None) -> Dict[str, Any]:
        """Retrieves a single comment with author masking."""
        with self.db.session() as conn:
            row = conn.execute(
                """SELECT c.*, pr.username, pr.display_name, pr.avatar_url, pr.reputation_score
                FROM comments c
                JOIN profiles pr ON c.author_id = pr.id
                WHERE c.id = ?""",
                (comment_id,),
            ).fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Comment not found.")

            user_upvoted = False
            if current_user_id:
                uv = conn.execute(
                    "SELECT 1 FROM comment_votes WHERE comment_id = ? AND user_id = ? AND vote_type = 1",
                    (comment_id, current_user_id),
                ).fetchone()
                user_upvoted = bool(uv)

            return self._serialize_comment(row, user_upvoted)

    
    def list_recent_public_comments(
        self,
        limit: int = 15,
        project_id: Optional[str] = None,
        sort: str = "popular",
        current_user_id: Optional[str] = None,
        include_anonymous: bool = True,
    ) -> List[Dict[str, Any]]:
        """Retrieves recent genuine public comments across projects for Community Voices and Global Discussions Lounge."""
        with self.db.session() as conn:
            where_clauses = ["c.status = 'published'"]
            params: List[Any] = []

            if not include_anonymous:
                where_clauses.append("c.is_anonymous = 0")

            if project_id:
                where_clauses.append("(c.post_id = ? OR p.id = ? OR post.id = ?)")
                params.extend([project_id, project_id, project_id])

            where_sql = " AND ".join(where_clauses)

            order_sql = "c.upvotes_count DESC, c.created_at DESC" if sort == "popular" else "c.created_at DESC"

            sql = f"""
                SELECT c.id, c.post_id, c.content, c.upvotes_count, c.created_at, c.is_anonymous,
                       COALESCE(p.name, post.title, 'Project Community') as project_title,
                       COALESCE(p.id, post.id) as project_id,
                       COALESCE(p.category, post.category, 'General') as category,
                       pr.username, pr.display_name, pr.avatar_url
                FROM comments c
                LEFT JOIN projects p ON c.post_id = p.id
                LEFT JOIN posts post ON c.post_id = post.id
                JOIN profiles pr ON c.author_id = pr.id
                WHERE {where_sql}
                ORDER BY {order_sql} LIMIT ?
            """
            params.append(limit)
            rows = conn.execute(sql, params).fetchall()

            user_upvotes = set()
            if current_user_id and rows:
                c_ids = [r["id"] for r in rows]
                placeholders = ",".join("?" for _ in c_ids)
                upvote_rows = conn.execute(
                    f"SELECT comment_id FROM comment_votes WHERE user_id = ? AND vote_type = 1 AND comment_id IN ({placeholders})",
                    [current_user_id, *c_ids],
                ).fetchall()
                user_upvotes = {r["comment_id"] for r in upvote_rows}

            results = []
            for r in rows:
                is_anon = bool(r["is_anonymous"])
                results.append({
                    "id": r["id"],
                    "postId": r["post_id"],
                    "content": r["content"],
                    "upvotesCount": max(0, r["upvotes_count"]),
                    "createdAt": r["created_at"],
                    "projectTitle": r["project_title"],
                    "projectId": r["project_id"],
                    "category": r["category"],
                    "username": "anonymous" if is_anon else r["username"],
                    "displayName": "Anonymous Reviewer" if is_anon else (r["display_name"] or r["username"]),
                    "avatarUrl": None if is_anon else r["avatar_url"],
                    "isAnonymous": is_anon,
                    "userHasUpvoted": r["id"] in user_upvotes,
                })
            return results

    def list_comments_for_post(
        self, post_id: str, current_user_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Retrieves threaded comments hierarchy for a post."""
        with self.db.session() as conn:
            rows = conn.execute(
                """SELECT c.*, pr.username, pr.display_name, pr.avatar_url, pr.reputation_score
                FROM comments c
                JOIN profiles pr ON c.author_id = pr.id
                WHERE c.post_id = ? AND c.status = 'published'
                ORDER BY c.created_at ASC""",
                (post_id,),
            ).fetchall()

            user_upvotes = set()
            if current_user_id and rows:
                c_ids = [r["id"] for r in rows]
                placeholders = ",".join("?" for _ in c_ids)
                upvote_rows = conn.execute(
                    f"SELECT comment_id FROM comment_votes WHERE user_id = ? AND vote_type = 1 AND comment_id IN ({placeholders})",
                    [current_user_id, *c_ids],
                ).fetchall()
                user_upvotes = {r["comment_id"] for r in upvote_rows}

            # Map into list of serialized comments
            comment_map: Dict[str, Dict[str, Any]] = {}
            root_comments: List[Dict[str, Any]] = []

            for r in rows:
                ser = self._serialize_comment(r, r["id"] in user_upvotes)
                ser["replies"] = []
                comment_map[ser["id"]] = ser

            # Build reply tree
            for r in rows:
                cid = r["id"]
                pid = r["parent_comment_id"]
                comment_obj = comment_map[cid]
                if pid and pid in comment_map:
                    comment_map[pid]["replies"].append(comment_obj)
                else:
                    root_comments.append(comment_obj)

            return root_comments

    def update_comment(self, comment_id: str, author_id: str, content: str) -> Dict[str, Any]:
        """Edits an owned comment."""
        with self.db.session() as conn:
            comment = conn.execute(
                "SELECT author_id FROM comments WHERE id = ?", (comment_id,)
            ).fetchone()
            if not comment:
                raise HTTPException(status_code=404, detail="Comment not found.")
            if comment["author_id"] != author_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You are not authorized to edit this comment.",
                )

            conn.execute(
                "UPDATE comments SET content = ?, updated_at = ? WHERE id = ?",
                (content.strip(), utc_now_iso(), comment_id),
            )

        return self.get_comment(comment_id, current_user_id=author_id)

    def delete_comment(self, comment_id: str, author_id: str) -> None:
        """Deletes an owned comment."""
        with self.db.session() as conn:
            comment = conn.execute(
                "SELECT author_id, post_id FROM comments WHERE id = ?", (comment_id,)
            ).fetchone()
            if not comment:
                raise HTTPException(status_code=404, detail="Comment not found.")
            if comment["author_id"] != author_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You are not authorized to delete this comment.",
                )

            conn.execute("DELETE FROM comments WHERE id = ?", (comment_id,))
            conn.execute(
                "UPDATE posts SET comments_count = MAX(0, comments_count - 1) WHERE id = ?",
                (comment["post_id"],),
            )

    # -------------------------------------------------------------------------
    # Voting & Uniqueness Enforcement
    # -------------------------------------------------------------------------
    def toggle_post_vote(
        self, post_id: str, user_id: str, vote_type: int = 1
    ) -> Dict[str, Any]:
        """Toggles post upvote atomically. Database uniqueness prevents duplicates."""
        now = utc_now_iso()
        with self.db.session() as conn:
            post = conn.execute("SELECT id FROM posts WHERE id = ?", (post_id,)).fetchone()
            if not post:
                raise HTTPException(status_code=404, detail="Post not found.")

            existing = conn.execute(
                "SELECT id, vote_type FROM post_votes WHERE post_id = ? AND user_id = ?",
                (post_id, user_id),
            ).fetchone()

            if existing:
                if existing["vote_type"] == vote_type:
                    # Unvote
                    conn.execute(
                        "DELETE FROM post_votes WHERE post_id = ? AND user_id = ?",
                        (post_id, user_id),
                    )
                    user_has_upvoted = False
                else:
                    # Switch vote
                    conn.execute(
                        "UPDATE post_votes SET vote_type = ?, created_at = ? WHERE post_id = ? AND user_id = ?",
                        (vote_type, now, post_id, user_id),
                    )
                    user_has_upvoted = vote_type == 1
            else:
                # New vote
                vote_id = f"pv_{uuid.uuid4().hex[:12]}"
                conn.execute(
                    "INSERT INTO post_votes (id, post_id, user_id, vote_type, created_at) VALUES (?, ?, ?, ?, ?)",
                    (vote_id, post_id, user_id, vote_type, now),
                )
                user_has_upvoted = vote_type == 1

            # Recalculate upvotes deterministically from database
            count_row = conn.execute(
                "SELECT COALESCE(SUM(vote_type), 0) as total FROM post_votes WHERE post_id = ?",
                (post_id,),
            ).fetchone()
            total_upvotes = max(0, count_row["total"])
            conn.execute(
                "UPDATE posts SET upvotes_count = ? WHERE id = ?",
                (total_upvotes, post_id),
            )

            return {
                "upvotesCount": total_upvotes,
                "userHasUpvoted": user_has_upvoted,
            }

    def toggle_comment_vote(
        self, comment_id: str, user_id: str, vote_type: int = 1
    ) -> Dict[str, Any]:
        """Toggles comment upvote atomically."""
        now = utc_now_iso()
        with self.db.session() as conn:
            comment = conn.execute("SELECT id FROM comments WHERE id = ?", (comment_id,)).fetchone()
            if not comment:
                raise HTTPException(status_code=404, detail="Comment not found.")

            existing = conn.execute(
                "SELECT id, vote_type FROM comment_votes WHERE comment_id = ? AND user_id = ?",
                (comment_id, user_id),
            ).fetchone()

            if existing:
                if existing["vote_type"] == vote_type:
                    conn.execute(
                        "DELETE FROM comment_votes WHERE comment_id = ? AND user_id = ?",
                        (comment_id, user_id),
                    )
                    user_has_upvoted = False
                else:
                    conn.execute(
                        "UPDATE comment_votes SET vote_type = ?, created_at = ? WHERE comment_id = ? AND user_id = ?",
                        (vote_type, now, comment_id, user_id),
                    )
                    user_has_upvoted = vote_type == 1
            else:
                vote_id = f"cv_{uuid.uuid4().hex[:12]}"
                conn.execute(
                    "INSERT INTO comment_votes (id, comment_id, user_id, vote_type, created_at) VALUES (?, ?, ?, ?, ?)",
                    (vote_id, comment_id, user_id, vote_type, now),
                )
                user_has_upvoted = vote_type == 1

            count_row = conn.execute(
                "SELECT COALESCE(SUM(vote_type), 0) as total FROM comment_votes WHERE comment_id = ?",
                (comment_id,),
            ).fetchone()
            total_upvotes = max(0, count_row["total"])
            conn.execute(
                "UPDATE comments SET upvotes_count = ? WHERE id = ?",
                (total_upvotes, comment_id),
            )

            return {
                "upvotesCount": total_upvotes,
                "userHasUpvoted": user_has_upvoted,
            }

    # -------------------------------------------------------------------------
    # Bookmarks
    # -------------------------------------------------------------------------
    def toggle_bookmark(self, post_id: str, user_id: str) -> Dict[str, Any]:
        """Toggles bookmark on a post."""
        with self.db.session() as conn:
            post = conn.execute("SELECT id FROM posts WHERE id = ?", (post_id,)).fetchone()
            if not post:
                raise HTTPException(status_code=404, detail="Post not found.")

            existing = conn.execute(
                "SELECT id FROM bookmarks WHERE post_id = ? AND user_id = ?",
                (post_id, user_id),
            ).fetchone()

            if existing:
                conn.execute(
                    "DELETE FROM bookmarks WHERE post_id = ? AND user_id = ?",
                    (post_id, user_id),
                )
                return {"userHasBookmarked": False}
            else:
                bm_id = f"bm_{uuid.uuid4().hex[:12]}"
                conn.execute(
                    "INSERT INTO bookmarks (id, user_id, post_id, created_at) VALUES (?, ?, ?, ?)",
                    (bm_id, user_id, post_id, utc_now_iso()),
                )
                return {"userHasBookmarked": True}

    def list_saved_posts(self, user_id: str) -> List[Dict[str, Any]]:
        """Lists posts bookmarked by the user."""
        with self.db.session() as conn:
            rows = conn.execute(
                """SELECT p.*, pr.username, pr.display_name, pr.avatar_url, pr.reputation_score
                FROM bookmarks b
                JOIN posts p ON b.post_id = p.id
                JOIN profiles pr ON p.author_id = pr.id
                WHERE b.user_id = ? AND p.status = 'published'
                ORDER BY b.created_at DESC""",
                (user_id,),
            ).fetchall()

            # For each saved post, verify upvote status
            p_ids = [r["id"] for r in rows]
            user_upvotes = set()
            if p_ids:
                placeholders = ",".join("?" for _ in p_ids)
                upvote_rows = conn.execute(
                    f"SELECT post_id FROM post_votes WHERE user_id = ? AND vote_type = 1 AND post_id IN ({placeholders})",
                    [user_id, *p_ids],
                ).fetchall()
                user_upvotes = {r["post_id"] for r in upvote_rows}

            return [self._serialize_post(r, r["id"] in user_upvotes, True) for r in rows]

    # -------------------------------------------------------------------------
    # Reports (Moderation)
    # -------------------------------------------------------------------------
    def create_report(
        self,
        reporter_id: str,
        target_type: str,
        target_id: str,
        reason: str,
        description: str = "",
    ) -> Dict[str, Any]:
        """Files a moderation report."""
        report_id = f"rep_{uuid.uuid4().hex[:12]}"
        now = utc_now_iso()
        with self.db.session() as conn:
            conn.execute(
                """INSERT INTO reports (id, reporter_id, target_type, target_id, reason, description, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (report_id, reporter_id, target_type, target_id, reason.strip(), description.strip(), "pending", now),
            )
            return {
                "id": report_id,
                "targetType": target_type,
                "targetId": target_id,
                "status": "pending",
                "message": "Report submitted successfully for moderation review.",
            }

    def list_reports(self) -> List[Dict[str, Any]]:
        """Lists submitted moderation reports for authorized moderators with target previews."""
        with self.db.session() as conn:
            rows = conn.execute(
                """SELECT r.*, pr.username as reporter_username, pr.display_name as reporter_display_name
                FROM reports r
                JOIN profiles pr ON r.reporter_id = pr.id
                ORDER BY r.created_at DESC"""
            ).fetchall()
            results = []
            for r in rows:
                target_preview = ""
                target_author = ""
                target_status = "published"
                if r["target_type"] == "post":
                    p = conn.execute("SELECT title, description, status, author_id FROM posts WHERE id = ?", (r["target_id"],)).fetchone()
                    if p:
                        target_preview = f"{p['title']}: {p['description'][:100]}"
                        target_status = p["status"] or "published"
                elif r["target_type"] == "comment":
                    c = conn.execute("SELECT content, status, author_id FROM comments WHERE id = ?", (r["target_id"],)).fetchone()
                    if c:
                        target_preview = c["content"][:120]
                        target_status = c["status"] or "published"

                results.append({
                    "id": r["id"],
                    "reporterId": r["reporter_id"],
                    "reporterUsername": r["reporter_username"],
                    "reporterDisplayName": r["reporter_display_name"],
                    "targetType": r["target_type"],
                    "targetId": r["target_id"],
                    "targetPreview": target_preview,
                    "targetStatus": target_status,
                    "reason": r["reason"],
                    "description": r["description"],
                    "status": r["status"],
                    "createdAt": r["created_at"],
                })
            return results

    def resolve_report(
        self,
        report_id: str,
        action: str,
        notes: str = "",
        moderator_id: str = "",
    ) -> Dict[str, Any]:
        """Resolves a moderation report and takes action (hide, dismiss, warn)."""
        valid_actions = ("hide", "dismiss", "warn")
        if action not in valid_actions:
            raise HTTPException(status_code=400, detail=f"Invalid action. Must be one of {valid_actions}")

        now = utc_now_iso()
        with self.db.session() as conn:
            rep = conn.execute("SELECT * FROM reports WHERE id = ?", (report_id,)).fetchone()
            if not rep:
                raise HTTPException(status_code=404, detail="Report not found.")

            target_type = rep["target_type"]
            target_id = rep["target_id"]

            if action == "hide":
                if target_type == "post":
                    conn.execute("UPDATE posts SET status = 'hidden', updated_at = ? WHERE id = ?", (now, target_id))
                elif target_type == "comment":
                    conn.execute("UPDATE comments SET status = 'hidden', updated_at = ? WHERE id = ?", (now, target_id))
            elif action == "restore":
                if target_type == "post":
                    conn.execute("UPDATE posts SET status = 'published', updated_at = ? WHERE id = ?", (now, target_id))
                elif target_type == "comment":
                    conn.execute("UPDATE comments SET status = 'published', updated_at = ? WHERE id = ?", (now, target_id))

            conn.execute(
                "UPDATE reports SET status = ? WHERE id = ?",
                ("resolved" if action != "dismiss" else "dismissed", report_id),
            )
            return {
                "id": report_id,
                "status": "resolved" if action != "dismiss" else "dismissed",
                "action": action,
                "notes": notes,
                "resolvedAt": now,
            }

    def toggle_post_lock(self, post_id: str, locked: bool, moderator_id: str = "") -> Dict[str, Any]:
        """Locks or unlocks a discussion post to prevent or allow further comments."""
        now = utc_now_iso()
        with self.db.session() as conn:
            post = conn.execute("SELECT id, status FROM posts WHERE id = ?", (post_id,)).fetchone()
            if not post:
                raise HTTPException(status_code=404, detail="Post not found.")
            new_status = "locked" if locked else "published"
            conn.execute("UPDATE posts SET status = ?, updated_at = ? WHERE id = ?", (new_status, now, post_id))
            return {"postId": post_id, "status": new_status, "isLocked": locked}


    # -------------------------------------------------------------------------
    # Anonymity Protection & Serialization Helpers
    # -------------------------------------------------------------------------
    def _serialize_post(
        self, row: sqlite3.Row, user_has_upvoted: bool = False, user_has_bookmarked: bool = False
    ) -> Dict[str, Any]:
        """Serializes post row, masking private author ID when is_anonymous is True."""
        is_anon = bool(row["is_anonymous"])
        tags = []
        if row["tags"]:
            try:
                tags = json.loads(row["tags"])
            except Exception:
                tags = []

        if is_anon:
            author_obj = {
                "id": None,
                "username": "anonymous",
                "displayName": "Anonymous Contributor",
                "avatarUrl": None,
                "isAnonymous": True,
            }
        else:
            author_obj = {
                "id": row["author_id"],
                "username": row["username"],
                "displayName": row["display_name"],
                "avatarUrl": row["avatar_url"],
                "reputationScore": row["reputation_score"],
                "isAnonymous": False,
            }

        return {
            "id": row["id"],
            "title": row["title"],
            "description": row["description"],
            "postType": row["post_type"],
            "productUrl": row["product_url"],
            "category": row["category"],
            "tags": tags,
            "author": author_obj,
            "isAnonymous": is_anon,
            "upvotesCount": row["upvotes_count"],
            "commentsCount": row["comments_count"],
            "hasAiAnalysis": self.has_ai_analysis(row["id"]),
            "status": row["status"],
            "createdAt": row["created_at"],
            "updatedAt": row["updated_at"],
            "userHasUpvoted": user_has_upvoted,
            "userHasBookmarked": user_has_bookmarked,
        }

    def has_ai_analysis(self, post_id: str) -> bool:
        """Checks if a post has at least one completed AI analysis run."""
        try:
            with self.db.session() as conn:
                ar = conn.execute(
                    "SELECT 1 FROM analysis_runs WHERE post_id = ? AND status = 'completed' LIMIT 1",
                    (post_id,),
                ).fetchone()
                return bool(ar)
        except Exception:
            return False

    def save_analysis_run(
        self,
        post_id: str,
        requested_by: Optional[str],
        status: str,
        provider: str,
        model: str,
        prompt_version: str,
        input_hash: str,
        total_comment_count: int,
        analyzed_comment_count: int,
        result_data: Dict[str, Any],
        error_message: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Persists a versioned AI research analysis run."""
        run_id = f"ar_{uuid.uuid4().hex[:12]}"
        now = utc_now_iso()
        result_json = json.dumps(result_data)

        with self.db.session() as conn:
            conn.execute(
                """INSERT INTO analysis_runs (
                    id, post_id, requested_by, status, provider, model, prompt_version,
                    input_hash, total_comment_count, analyzed_comment_count, result_json,
                    error_message, created_at, completed_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    run_id,
                    post_id,
                    requested_by,
                    status,
                    provider,
                    model,
                    prompt_version,
                    input_hash,
                    total_comment_count,
                    analyzed_comment_count,
                    result_json,
                    error_message,
                    now,
                    now if status == "completed" else None,
                ),
            )

        return self.get_analysis_run(run_id)

    def get_analysis_run(self, run_id: str) -> Dict[str, Any]:
        """Retrieves an analysis run by ID."""
        with self.db.session() as conn:
            row = conn.execute("SELECT * FROM analysis_runs WHERE id = ?", (run_id,)).fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Analysis run not found.")
            result_data = json.loads(row["result_json"])
            result_data["id"] = row["id"]
            result_data["postId"] = row["post_id"]
            result_data["modelVersion"] = row["model"]
            result_data["createdAt"] = row["created_at"]
            result_data["inputHash"] = row["input_hash"]
            return result_data

    def get_latest_analysis_run(self, post_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves the latest completed AI analysis run for a post."""
        with self.db.session() as conn:
            row = conn.execute(
                """SELECT * FROM analysis_runs
                WHERE post_id = ? AND status = 'completed'
                ORDER BY created_at DESC LIMIT 1""",
                (post_id,),
            ).fetchone()
            if not row:
                return None

            result_data = json.loads(row["result_json"])
            result_data["id"] = row["id"]
            result_data["postId"] = row["post_id"]
            result_data["modelVersion"] = row["model"]
            result_data["createdAt"] = row["created_at"]
            result_data["inputHash"] = row["input_hash"]
            result_data["isCached"] = True
            return result_data

    def get_analysis_cooldown_remaining(self, post_id: str, cooldown_seconds: int = 30) -> int:
        """Returns remaining cooldown seconds if post was recently analyzed, else 0."""
        with self.db.session() as conn:
            row = conn.execute(
                """SELECT created_at FROM analysis_runs
                WHERE post_id = ? AND status = 'completed'
                ORDER BY created_at DESC LIMIT 1""",
                (post_id,),
            ).fetchone()
            if not row:
                return 0

            try:
                # Replace Z with +00:00 if needed for fromisoformat in Python 3.10
                ts_str = row["created_at"].replace("Z", "+00:00")
                created_dt = datetime.fromisoformat(ts_str)
                elapsed = (datetime.now(timezone.utc) - created_dt).total_seconds()
                remaining = int(cooldown_seconds - elapsed)
                return max(0, remaining)
            except Exception:
                return 0

    # -------------------------------------------------------------------------
    # Phase 4: Interactive Research Assistant Conversations
    # -------------------------------------------------------------------------
    def create_chat_session(
        self, post_id: str, user_id: str, title: str = "Research Discussion", review_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Creates a new user-isolated research chat session for a published post, optionally linked to a review."""
        session_id = f"cs_{uuid.uuid4().hex[:12]}"
        now = utc_now_iso()
        with self.db.session() as conn:
            # Verify post exists
            post = conn.execute("SELECT id FROM posts WHERE id = ?", (post_id,)).fetchone()
            if not post:
                raise HTTPException(status_code=404, detail="Post not found.")

            conn.execute(
                """INSERT INTO conversation_sessions (
                    id, post_id, user_id, title, review_id, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (session_id, post_id, user_id, title.strip()[:120], review_id, now, now),
            )

        return {
            "id": session_id,
            "postId": post_id,
            "userId": user_id,
            "title": title.strip()[:120],
            "reviewId": review_id,
            "createdAt": now,
            "updatedAt": now,
            "messageCount": 0,
        }

    def list_chat_sessions(self, post_id: str, user_id: str) -> List[Dict[str, Any]]:
        """Returns research chat sessions belonging strictly to the requesting user for a post."""
        with self.db.session() as conn:
            rows = conn.execute(
                """SELECT s.*, 
                   (SELECT COUNT(*) FROM conversation_messages m WHERE m.session_id = s.id) as msg_count
                   FROM conversation_sessions s
                   WHERE s.post_id = ? AND s.user_id = ?
                   ORDER BY s.updated_at DESC""",
                (post_id, user_id),
            ).fetchall()

            sessions = []
            for r in rows:
                sessions.append({
                    "id": r["id"],
                    "postId": r["post_id"],
                    "userId": r["user_id"],
                    "title": r["title"],
                    "reviewId": r["review_id"] if "review_id" in r.keys() else None,
                    "createdAt": r["created_at"],
                    "updatedAt": r["updated_at"],
                    "messageCount": r["msg_count"],
                })
            return sessions

    def get_chat_session(self, session_id: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Retrieves a conversation session, strictly verifying ownership if user_id is provided."""
        with self.db.session() as conn:
            if user_id:
                row = conn.execute(
                    "SELECT * FROM conversation_sessions WHERE id = ? AND user_id = ?",
                    (session_id, user_id),
                ).fetchone()
            else:
                row = conn.execute(
                    "SELECT * FROM conversation_sessions WHERE id = ?",
                    (session_id,),
                ).fetchone()

            if not row:
                return None

            return {
                "id": row["id"],
                "postId": row["post_id"],
                "userId": row["user_id"],
                "title": row["title"],
                "reviewId": row["review_id"] if "review_id" in row.keys() else None,
                "createdAt": row["created_at"],
                "updatedAt": row["updated_at"],
            }

    def get_or_create_conversation_session_for_review(
        self, review_id: str, post_id: str, user_id: str, review_version: int = 1
    ) -> Dict[str, Any]:
        """Finds or initializes the dedicated conversation session linked to an immutable review version."""
        with self.db.session() as conn:
            row = conn.execute(
                """SELECT s.*, 
                   (SELECT COUNT(*) FROM conversation_messages m WHERE m.session_id = s.id) as msg_count
                   FROM conversation_sessions s
                   WHERE s.review_id = ? AND s.user_id = ?""",
                (review_id, user_id),
            ).fetchone()
            if row:
                return {
                    "id": row["id"],
                    "postId": row["post_id"],
                    "userId": row["user_id"],
                    "title": row["title"],
                    "reviewId": row["review_id"],
                    "createdAt": row["created_at"],
                    "updatedAt": row["updated_at"],
                    "messageCount": row["msg_count"],
                }

        # If not found, create one linked to this review version
        title = f"Review V{review_version} Linked Conversation"
        return self.create_chat_session(post_id=post_id, user_id=user_id, title=title, review_id=review_id)

    def update_chat_session(self, session_id: str, title: Optional[str] = None) -> None:
        """Updates updated_at and optionally title for an active session."""
        now = utc_now_iso()
        with self.db.session() as conn:
            if title:
                conn.execute(
                    "UPDATE conversation_sessions SET title = ?, updated_at = ? WHERE id = ?",
                    (title.strip()[:120], now, session_id),
                )
            else:
                conn.execute(
                    "UPDATE conversation_sessions SET updated_at = ? WHERE id = ?",
                    (now, session_id),
                )

    def delete_chat_session(self, session_id: str, user_id: str) -> bool:
        """Deletes a conversation session, strictly verifying owner authorization."""
        with self.db.session() as conn:
            row = conn.execute(
                "SELECT id FROM conversation_sessions WHERE id = ? AND user_id = ?",
                (session_id, user_id),
            ).fetchone()
            if not row:
                return False

            conn.execute("DELETE FROM conversation_messages WHERE session_id = ?", (session_id,))
            conn.execute("DELETE FROM conversation_sessions WHERE id = ?", (session_id,))
            return True

    def save_chat_message(
        self,
        session_id: str,
        role: str,
        content: str,
        citations: Optional[List[Dict[str, Any]]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Persists a verified conversation message turn with grounded citations."""
        msg_id = f"cmsg_{uuid.uuid4().hex[:12]}"
        now = utc_now_iso()
        citations_json = json.dumps(citations or [])
        metadata_json = json.dumps(metadata or {})

        with self.db.session() as conn:
            conn.execute(
                """INSERT INTO conversation_messages (
                    id, session_id, role, content, citations, metadata, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (msg_id, session_id, role, content.strip(), citations_json, metadata_json, now),
            )
            # Update session's updated_at
            conn.execute(
                "UPDATE conversation_sessions SET updated_at = ? WHERE id = ?",
                (now, session_id),
            )

        return {
            "id": msg_id,
            "sessionId": session_id,
            "role": role,
            "content": content.strip(),
            "citations": citations or [],
            "metadata": metadata or {},
            "createdAt": now,
        }

    def list_chat_messages(self, session_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Returns ordered messages belonging to a conversation session."""
        with self.db.session() as conn:
            rows = conn.execute(
                """SELECT * FROM conversation_messages
                WHERE session_id = ?
                ORDER BY created_at ASC LIMIT ?""",
                (session_id, limit),
            ).fetchall()

            messages = []
            for r in rows:
                citations = []
                try:
                    citations = json.loads(r["citations"]) if r["citations"] else []
                except Exception:
                    pass

                metadata = {}
                try:
                    metadata = json.loads(r["metadata"]) if r["metadata"] else {}
                except Exception:
                    pass

                messages.append({
                    "id": r["id"],
                    "sessionId": r["session_id"],
                    "role": r["role"],
                    "content": r["content"],
                    "citations": citations,
                    "metadata": metadata,
                    "createdAt": r["created_at"],
                })
            return messages

    # -------------------------------------------------------------------------
    # Phase 5: Research Reports & PRD Documents Persistence
    # -------------------------------------------------------------------------
    def save_research_report(
        self,
        post_id: str,
        owner_id: str,
        report_type: str,
        title: str,
        content_markdown: str,
        status: str = "completed",
        source_analysis_id: Optional[str] = None,
        version: int = 1,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Persists a generated research report or PRD draft."""
        report_id = f"rep_{uuid.uuid4().hex[:12]}"
        now = utc_now_iso()
        metadata_json = json.dumps(metadata or {})

        with self.db.session() as conn:
            post = conn.execute("SELECT id FROM posts WHERE id = ?", (post_id,)).fetchone()
            if not post:
                raise HTTPException(status_code=404, detail="Post not found.")

            conn.execute(
                """INSERT INTO research_reports (
                    id, post_id, owner_id, report_type, title, content_markdown,
                    status, source_analysis_id, version, metadata, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    report_id,
                    post_id,
                    owner_id,
                    report_type,
                    title.strip()[:200],
                    content_markdown.strip(),
                    status,
                    source_analysis_id,
                    version,
                    metadata_json,
                    now,
                    now,
                ),
            )

        return {
            "id": report_id,
            "postId": post_id,
            "ownerId": owner_id,
            "reportType": report_type,
            "title": title.strip()[:200],
            "contentMarkdown": content_markdown.strip(),
            "status": status,
            "sourceAnalysisId": source_analysis_id,
            "version": version,
            "metadata": metadata or {},
            "createdAt": now,
            "updatedAt": now,
        }

    def get_research_report(
        self, report_id: str, owner_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Retrieves a research report, enforcing owner isolation if owner_id is provided."""
        with self.db.session() as conn:
            if owner_id:
                row = conn.execute(
                    "SELECT * FROM research_reports WHERE id = ? AND owner_id = ?",
                    (report_id, owner_id),
                ).fetchone()
            else:
                row = conn.execute(
                    "SELECT * FROM research_reports WHERE id = ?",
                    (report_id,),
                ).fetchone()

            if not row:
                return None

            meta = {}
            try:
                meta = json.loads(row["metadata"]) if row["metadata"] else {}
            except Exception:
                pass

            return {
                "id": row["id"],
                "postId": row["post_id"],
                "ownerId": row["owner_id"],
                "reportType": row["report_type"],
                "title": row["title"],
                "contentMarkdown": row["content_markdown"],
                "status": row["status"],
                "sourceAnalysisId": row["source_analysis_id"],
                "version": row["version"],
                "metadata": meta,
                "createdAt": row["created_at"],
                "updatedAt": row["updated_at"],
            }

    def list_research_reports(
        self, post_id: str, owner_id: str
    ) -> List[Dict[str, Any]]:
        """Lists reports owned by the requesting user for a post."""
        with self.db.session() as conn:
            rows = conn.execute(
                """SELECT * FROM research_reports
                WHERE post_id = ? AND owner_id = ?
                ORDER BY created_at DESC""",
                (post_id, owner_id),
            ).fetchall()

            reports = []
            for r in rows:
                meta = {}
                try:
                    meta = json.loads(r["metadata"]) if r["metadata"] else {}
                except Exception:
                    pass
                reports.append({
                    "id": r["id"],
                    "postId": r["post_id"],
                    "ownerId": r["owner_id"],
                    "reportType": r["report_type"],
                    "title": r["title"],
                    "contentMarkdown": r["content_markdown"],
                    "status": r["status"],
                    "sourceAnalysisId": r["source_analysis_id"],
                    "version": r["version"],
                    "metadata": meta,
                    "createdAt": r["created_at"],
                    "updatedAt": r["updated_at"],
                })
            return reports

    def update_research_report(
        self,
        report_id: str,
        owner_id: str,
        title: Optional[str] = None,
        content_markdown: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Updates report title or content, incrementing version and verifying owner."""
        now = utc_now_iso()
        with self.db.session() as conn:
            existing = conn.execute(
                "SELECT * FROM research_reports WHERE id = ? AND owner_id = ?",
                (report_id, owner_id),
            ).fetchone()
            if not existing:
                return None

            new_title = title.strip()[:200] if title else existing["title"]
            new_content = content_markdown.strip() if content_markdown else existing["content_markdown"]
            new_version = existing["version"] + 1

            conn.execute(
                """UPDATE research_reports
                SET title = ?, content_markdown = ?, version = ?, updated_at = ?
                WHERE id = ? AND owner_id = ?""",
                (new_title, new_content, new_version, now, report_id, owner_id),
            )

        return self.get_research_report(report_id, owner_id)

    def delete_research_report(self, report_id: str, owner_id: str) -> bool:
        """Deletes a research report, strictly verifying ownership."""
        with self.db.session() as conn:
            row = conn.execute(
                "SELECT id FROM research_reports WHERE id = ? AND owner_id = ?",
                (report_id, owner_id),
            ).fetchone()
            if not row:
                return False

            conn.execute("DELETE FROM research_reports WHERE id = ?", (report_id,))
            return True




    def _serialize_comment(
        self, row: sqlite3.Row, user_has_upvoted: bool = False
    ) -> Dict[str, Any]:
        """Serializes comment row, masking private author ID when is_anonymous is True."""
        is_anon = bool(row["is_anonymous"])
        if is_anon:
            author_obj = {
                "id": None,
                "username": "anonymous",
                "displayName": "Anonymous Reviewer",
                "avatarUrl": None,
                "isAnonymous": True,
            }
        else:
            author_obj = {
                "id": row["author_id"],
                "username": row["username"],
                "displayName": row["display_name"],
                "avatarUrl": row["avatar_url"],
                "reputationScore": row["reputation_score"],
                "isAnonymous": False,
            }

        return {
            "id": row["id"],
            "postId": row["post_id"],
            "parentCommentId": row["parent_comment_id"],
            "author": author_obj,
            "content": row["content"],
            "isAnonymous": is_anon,
            "upvotesCount": row["upvotes_count"],
            "isHelpfulFlag": bool(row["is_helpful_flag"]),
            "status": row["status"],
            "createdAt": row["created_at"],
            "updatedAt": row["updated_at"],
            "userHasUpvoted": user_has_upvoted,
            "replies": [],
        }

    # -------------------------------------------------------------------------
    # Seed Data (Clean Multi-User SaaS)
    # -------------------------------------------------------------------------
    def ensure_seed_data(self) -> None:
        """No-op: All application accounts and projects are created by real users."""
        pass

    # -------------------------------------------------------------------------
    # Phase 6: Notifications & Social Activity
    # -------------------------------------------------------------------------
    def create_notification(
        self,
        user_id: str,
        type: str,
        title: str,
        message: str,
        link_url: str,
        actor_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Creates and stores an actionable user notification."""
        notif_id = f"notif_{uuid.uuid4().hex[:12]}"
        now = utc_now_iso()
        with self.db.session() as conn:
            conn.execute(
                """INSERT INTO notifications (
                    id, user_id, actor_id, type, title, message, link_url, is_read, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)""",
                (notif_id, user_id, actor_id, type, title, message, link_url, now),
            )
            return {
                "id": notif_id,
                "userId": user_id,
                "actorId": actor_id,
                "type": type,
                "title": title,
                "message": message,
                "linkUrl": link_url,
                "isRead": False,
                "createdAt": now,
            }

    def list_notifications(
        self,
        user_id: str,
        unread_only: bool = False,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """Retrieves notifications for the user with actor profile metadata."""
        with self.db.session() as conn:
            query = """
                SELECT n.*, p.username as actor_username, p.display_name as actor_display_name, p.avatar_url as actor_avatar
                FROM notifications n
                LEFT JOIN profiles p ON n.actor_id = p.id
                WHERE n.user_id = ?
            """
            params: List[Any] = [user_id]
            if unread_only:
                query += " AND n.is_read = 0"
            query += " ORDER BY n.created_at DESC LIMIT ?"
            params.append(limit)

            rows = conn.execute(query, tuple(params)).fetchall()
            return [
                {
                    "id": r["id"],
                    "userId": r["user_id"],
                    "actorId": r["actor_id"],
                    "actorUsername": r["actor_username"],
                    "actorDisplayName": r["actor_display_name"],
                    "actorAvatar": r["actor_avatar"],
                    "type": r["type"],
                    "title": r["title"],
                    "message": r["message"],
                    "linkUrl": r["link_url"],
                    "isRead": bool(r["is_read"]),
                    "createdAt": r["created_at"],
                }
                for r in rows
            ]

    def mark_notification_read(self, notification_id: str, user_id: str) -> bool:
        """Marks a single notification as read by the owner."""
        with self.db.session() as conn:
            res = conn.execute(
                "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
                (notification_id, user_id),
            )
            return res.rowcount > 0

    def mark_all_notifications_read(self, user_id: str) -> int:
        """Marks all pending notifications as read for the user."""
        with self.db.session() as conn:
            res = conn.execute(
                "UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0",
                (user_id,),
            )
            return res.rowcount

    def get_unread_notifications_count(self, user_id: str) -> int:
        """Fast count of unread notifications for badge rendering."""
        with self.db.session() as conn:
            row = conn.execute(
                "SELECT COUNT(*) as cnt FROM notifications WHERE user_id = ? AND is_read = 0",
                (user_id,),
            ).fetchone()
            return row["cnt"] if row else 0

    # -------------------------------------------------------------------------
    # Phase 7: Project Creator Attached Documents (PDFs, Markdown Specs)
    # -------------------------------------------------------------------------
    def add_post_document(
        self,
        post_id: str,
        owner_id: str,
        filename: str,
        file_type: str,
        file_size: int,
        content_text: str,
    ) -> Dict[str, Any]:
        """Stores creator-attached project documentation (e.g. PDF spec, PRD)."""
        doc_id = f"doc_{uuid.uuid4().hex[:12]}"
        now = utc_now_iso()
        with self.db.session() as conn:
            conn.execute(
                """INSERT INTO post_documents (
                    id, post_id, owner_id, filename, file_type, file_size, content_text, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (doc_id, post_id, owner_id, filename, file_type, file_size, content_text, now),
            )
            return {
                "id": doc_id,
                "postId": post_id,
                "ownerId": owner_id,
                "filename": filename,
                "fileType": file_type,
                "fileSize": file_size,
                "characterCount": len(content_text),
                "createdAt": now,
            }

    def list_post_documents(self, post_id: str) -> List[Dict[str, Any]]:
        """Lists attached project documentation for the post."""
        with self.db.session() as conn:
            rows = conn.execute(
                """SELECT id, post_id, owner_id, filename, file_type, file_size, length(content_text) as char_count, created_at
                FROM post_documents
                WHERE post_id = ?
                ORDER BY created_at DESC""",
                (post_id,),
            ).fetchall()
            return [
                {
                    "id": r["id"],
                    "postId": r["post_id"],
                    "ownerId": r["owner_id"],
                    "filename": r["filename"],
                    "fileType": r["file_type"],
                    "fileSize": r["file_size"],
                    "characterCount": r["char_count"],
                    "createdAt": r["created_at"],
                }
                for r in rows
            ]

    def get_post_document(self, doc_id: str, user_id: str) -> Dict[str, Any]:
        """Fetches a single post document with full content text, validating owner."""
        with self.db.session() as conn:
            r = conn.execute(
                """SELECT id, post_id, owner_id, filename, file_type, file_size, content_text, length(content_text) as char_count, created_at
                FROM post_documents
                WHERE id = ?""",
                (doc_id,),
            ).fetchone()
            if not r:
                raise HTTPException(status_code=404, detail="Document not found.")
            if r["owner_id"] != user_id:
                raise HTTPException(status_code=403, detail="Forbidden. Only the document owner can inspect this document.")
            return {
                "id": r["id"],
                "postId": r["post_id"],
                "ownerId": r["owner_id"],
                "filename": r["filename"],
                "fileType": r["file_type"],
                "fileSize": r["file_size"],
                "characterCount": r["char_count"],
                "contentText": r["content_text"],
                "createdAt": r["created_at"],
            }

    def delete_post_document(self, doc_id: str, user_id: str) -> bool:
        """Deletes an attached document with strict ownership validation."""
        with self.db.session() as conn:
            doc = conn.execute("SELECT owner_id FROM post_documents WHERE id = ?", (doc_id,)).fetchone()
            if not doc:
                raise HTTPException(status_code=404, detail="Document not found.")
            if doc["owner_id"] != user_id:
                raise HTTPException(status_code=403, detail="Forbidden. Only the document owner can delete this file.")

            res = conn.execute("DELETE FROM post_documents WHERE id = ?", (doc_id,))
            return res.rowcount > 0

    def get_post_documents_text(self, post_id: str) -> List[Dict[str, Any]]:
        """Fetches full content of all documents attached to a post for RAG retrieval."""
        with self.db.session() as conn:
            rows = conn.execute(
                "SELECT id, filename, file_type, content_text FROM post_documents WHERE post_id = ?",
                (post_id,),
            ).fetchall()
            return [
                {
                    "id": r["id"],
                    "filename": r["filename"],
                    "fileType": r["file_type"],
                    "contentText": r["content_text"],
                }
                for r in rows
            ]

    # =========================================================================
    # Final AI Lab: Full Product Reviews & Review Versioning
    # =========================================================================

    def create_product_review(
        self,
        post_id: str,
        owner_id: str,
        version: int,
        provider: str,
        model: str,
        source_snapshot: Dict[str, Any],
        content_markdown: str,
        structured_output: Dict[str, Any],
        citations: List[Dict[str, Any]],
        deterministic_stats: Dict[str, Any],
        stages_completed: List[str],
        status: str = "completed",
        error_message: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Creates an immutable product review version snapshot."""
        review_id = f"prv_{uuid.uuid4().hex[:12]}"
        now = utc_now_iso()
        with self.db.session() as conn:
            conn.execute(
                """INSERT INTO product_reviews (
                    id, post_id, owner_id, version, status, provider, model,
                    source_snapshot, content_markdown, structured_output,
                    citations, deterministic_stats, stages_completed,
                    error_message, created_at, completed_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    review_id,
                    post_id,
                    owner_id,
                    version,
                    status,
                    provider,
                    model,
                    json.dumps(source_snapshot),
                    content_markdown,
                    json.dumps(structured_output),
                    json.dumps(citations),
                    json.dumps(deterministic_stats),
                    json.dumps(stages_completed),
                    error_message,
                    now,
                    now if status == "completed" else None,
                ),
            )
        return self.get_product_review(review_id, owner_id)

    def get_product_review(self, review_id: str, owner_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Retrieves a specific review version, optionally enforcing owner authorization."""
        with self.db.session() as conn:
            if owner_id:
                row = conn.execute(
                    "SELECT * FROM product_reviews WHERE id = ? AND owner_id = ?",
                    (review_id, owner_id),
                ).fetchone()
            else:
                row = conn.execute(
                    "SELECT * FROM product_reviews WHERE id = ?",
                    (review_id,),
                ).fetchone()

            if not row:
                return None
            return self._serialize_product_review(row)

    def list_product_reviews(self, post_id: str, owner_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Lists all review versions for a post in descending version order."""
        with self.db.session() as conn:
            if owner_id:
                rows = conn.execute(
                    "SELECT * FROM product_reviews WHERE post_id = ? AND owner_id = ? ORDER BY version DESC",
                    (post_id, owner_id),
                ).fetchall()
            else:
                rows = conn.execute(
                    "SELECT * FROM product_reviews WHERE post_id = ? ORDER BY version DESC",
                    (post_id,),
                ).fetchall()
            return [self._serialize_product_review(r) for r in rows]

    def get_latest_product_review(self, post_id: str, owner_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Retrieves the highest-version completed review for a post."""
        with self.db.session() as conn:
            if owner_id:
                row = conn.execute(
                    "SELECT * FROM product_reviews WHERE post_id = ? AND owner_id = ? AND status = 'completed' ORDER BY version DESC LIMIT 1",
                    (post_id, owner_id),
                ).fetchone()
            else:
                row = conn.execute(
                    "SELECT * FROM product_reviews WHERE post_id = ? AND status = 'completed' ORDER BY version DESC LIMIT 1",
                    (post_id,),
                ).fetchone()
            if not row:
                return None
            return self._serialize_product_review(row)

    def get_next_product_review_version(self, post_id: str) -> int:
        """Calculates next incremental version number for a post review."""
        with self.db.session() as conn:
            row = conn.execute(
                "SELECT MAX(version) as max_ver FROM product_reviews WHERE post_id = ?",
                (post_id,),
            ).fetchone()
            if row and row["max_ver"] is not None:
                return int(row["max_ver"]) + 1
            return 1

    def get_product_source_availability(self, post_id: str, owner_id: str) -> Dict[str, Any]:
        """Calculates available sources, eligible document list, and detects if new activity arrived since last review."""
        with self.db.session() as conn:
            # Current comments
            comment_rows = conn.execute("SELECT id FROM comments WHERE post_id = ?", (post_id,)).fetchall()
            current_comment_ids = {r["id"] for r in comment_rows}

            # Current documents
            doc_rows = conn.execute(
                "SELECT id, filename, file_type, file_size, length(content_text) as char_count, created_at "
                "FROM post_documents WHERE post_id = ? AND owner_id = ? ORDER BY created_at DESC",
                (post_id, owner_id),
            ).fetchall()
            current_doc_ids = {r["id"] for r in doc_rows}

            docs_list = [
                {
                    "id": r["id"],
                    "filename": r["filename"],
                    "fileType": r["file_type"],
                    "fileSize": r["file_size"],
                    "characterCount": r["char_count"],
                    "createdAt": r["created_at"],
                }
                for r in doc_rows
            ]

            # Latest review
            latest_row = conn.execute(
                "SELECT id, version, source_snapshot, created_at FROM product_reviews "
                "WHERE post_id = ? AND owner_id = ? ORDER BY version DESC LIMIT 1",
                (post_id, owner_id),
            ).fetchone()

            if not latest_row:
                return {
                    "totalComments": len(current_comment_ids),
                    "totalDocuments": len(current_doc_ids),
                    "documents": docs_list,
                    "latestReviewId": None,
                    "latestReviewVersion": None,
                    "latestReviewCreatedAt": None,
                    "hasNewActivitySinceLastReview": False,
                    "newCommentsCountSinceLastReview": 0,
                    "newDocumentsCountSinceLastReview": 0,
                }

            snapshot = {}
            if latest_row["source_snapshot"]:
                try:
                    snapshot = json.loads(latest_row["source_snapshot"])
                except Exception:
                    snapshot = {}

            snapshot_comment_ids = set(snapshot.get("comment_ids", []))
            snapshot_doc_ids = set(snapshot.get("doc_ids", []))

            new_comments = current_comment_ids - snapshot_comment_ids
            new_docs = current_doc_ids - snapshot_doc_ids
            has_new = len(new_comments) > 0 or len(new_docs) > 0

            return {
                "totalComments": len(current_comment_ids),
                "totalDocuments": len(current_doc_ids),
                "documents": docs_list,
                "latestReviewId": latest_row["id"],
                "latestReviewVersion": latest_row["version"],
                "latestReviewCreatedAt": latest_row["created_at"],
                "hasNewActivitySinceLastReview": has_new,
                "newCommentsCountSinceLastReview": len(new_comments),
                "newDocumentsCountSinceLastReview": len(new_docs),
            }

    def _serialize_product_review(self, row: sqlite3.Row) -> Dict[str, Any]:
        """Serializes SQLite product_reviews row to dictionary with parsed JSON fields."""
        return {
            "id": row["id"],
            "postId": row["post_id"],
            "ownerId": row["owner_id"],
            "version": row["version"],
            "status": row["status"],
            "provider": row["provider"],
            "model": row["model"],
            "sourceSnapshot": json.loads(row["source_snapshot"]) if row["source_snapshot"] else {},
            "contentMarkdown": row["content_markdown"],
            "structuredOutput": json.loads(row["structured_output"]) if row["structured_output"] else {},
            "citations": json.loads(row["citations"]) if row["citations"] else [],
            "deterministicStats": json.loads(row["deterministic_stats"]) if row["deterministic_stats"] else {},
            "stagesCompleted": json.loads(row["stages_completed"]) if row["stages_completed"] else [],
            "errorMessage": row["error_message"],
            "createdAt": row["created_at"],
            "completedAt": row["completed_at"],
        }


# Global community repository instance
community_repo = CommunityRepository()
