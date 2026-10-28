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
        comment_id = f"cmt_{uuid.uuid4().hex[:12]}"
        now = utc_now_iso()
        is_anon = 1 if is_anonymous else 0

        with self.db.session() as conn:
            # Verify post exists
            post = conn.execute("SELECT id FROM posts WHERE id = ?", (post_id,)).fetchone()
            if not post:
                raise HTTPException(status_code=404, detail="Post not found.")

            # If parent comment is supplied, verify it belongs to the same post
            if parent_comment_id:
                parent = conn.execute(
                    "SELECT post_id FROM comments WHERE id = ?", (parent_comment_id,)
                ).fetchone()
                if not parent:
                    raise HTTPException(status_code=404, detail="Parent comment not found.")
                if parent["post_id"] != post_id:
                    raise HTTPException(
                        status_code=400, detail="Parent comment does not belong to this post."
                    )

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
            "hasAiAnalysis": False,  # Phase 3 will activate real analysis
            "status": row["status"],
            "createdAt": row["created_at"],
            "updatedAt": row["updated_at"],
            "userHasUpvoted": user_has_upvoted,
            "userHasBookmarked": user_has_bookmarked,
        }

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
    # Demo Seed Data
    # -------------------------------------------------------------------------
    def ensure_seed_data(self) -> None:
        """Seeds initial creator and demo review requests if the database is fresh."""
        with self.db.session() as conn:
            user_count = conn.execute("SELECT count(*) as cnt FROM auth_users").fetchone()["cnt"]
            if user_count > 0:
                return  # Database already populated

            # Seed demo user: Sarah Chen
            sarah_id = "usr_sarah_chen"
            now = utc_now_iso()
            hashed = hash_password("demo-password-123")

            conn.execute(
                "INSERT INTO auth_users (id, email, hashed_password, created_at) VALUES (?, ?, ?, ?)",
                (sarah_id, "sarah.chen@example.com", hashed, now),
            )
            conn.execute(
                """INSERT INTO profiles (id, username, display_name, avatar_url, bio, reputation_score, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    sarah_id,
                    "sarahc",
                    "Sarah Chen",
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
                    "Building developer tools & exploring customer research workflows.",
                    342,
                    now,
                    now,
                ),
            )

            # Seed user 2: Daniel Thorne
            dan_id = "usr_dev_dan"
            conn.execute(
                "INSERT INTO auth_users (id, email, hashed_password, created_at) VALUES (?, ?, ?, ?)",
                (dan_id, "dan@example.com", hashed, now),
            )
            conn.execute(
                """INSERT INTO profiles (id, username, display_name, avatar_url, bio, reputation_score, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    dan_id,
                    "devdan",
                    "Daniel Thorne",
                    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
                    "Senior backend engineer. Fan of local-first tools.",
                    88,
                    now,
                    now,
                ),
            )

            # Seed initial Post 1: ReflectTask
            post1_id = "post_reflect_01"
            conn.execute(
                """INSERT INTO posts (
                    id, author_id, title, description, post_type, product_url,
                    category, tags, is_anonymous, upvotes_count, comments_count,
                    status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    post1_id,
                    sarah_id,
                    "ReflectTask: Keyboard-first daily task planner. Looking for honest onboarding & sync feedback.",
                    "I built ReflectTask over the last four months. It is designed for engineers and designers who find Notion or Jira too bloated for daily personal task velocity.\n\nKey features:\n- Modal-less quick entry (Cmd+K everywhere)\n- Local-first IndexedDB persistence with cloud sync\n- Integrated time blocking and Markdown notes\n\nWhere I need community critique:\n1. Is the initial keyboard-shortcut onboarding intuitive, or does it feel overwhelming?\n2. Several beta testers requested two-way Google Calendar sync, while others insist it should stay 100% offline.\n3. How do you feel about the mobile layout when reviewing daily plans away from your desk?",
                    "product_review",
                    "https://reflecttask.dev",
                    "Productivity",
                    json.dumps(["Productivity", "Keyboard-First", "Local-First", "UX Review"]),
                    0,
                    47,
                    3,
                    "published",
                    now,
                    now,
                ),
            )

            # Seed Post 2: QueryLite (Anonymous Creator)
            post2_id = "post_querylite_02"
            conn.execute(
                """INSERT INTO posts (
                    id, author_id, title, description, post_type, product_url,
                    category, tags, is_anonymous, upvotes_count, comments_count,
                    status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    post2_id,
                    dan_id,
                    "QueryLite: Embedded SQLite visual inspector with zero setup. Is query latency visualizer useful?",
                    "Most SQLite GUI tools (DB Browser, DBeaver) are either 15 years old or heavy Java/Electron apps. I wrote QueryLite in Rust + Webview.\n\nFeatures:\n- Instant launch (< 50ms)\n- Execution plan tree visualizer\n- Schema migration diff viewer\n\nI am considering adding an automated index recommendation engine based on slow query history. Would you trust an embedded tool suggesting CREATE INDEX statements, or is that unnecessary scope creep?",
                    "idea_critique",
                    "https://github.com/querylite/app",
                    "Developer Tools",
                    json.dumps(["SQLite", "Rust", "Database", "Developer Tool"]),
                    1,  # ANONYMOUS POST
                    38,
                    0,
                    "published",
                    now,
                    now,
                ),
            )

            # Seed comments for ReflectTask
            c1_id = "cmt_001"
            conn.execute(
                """INSERT INTO comments (
                    id, post_id, parent_comment_id, author_id, content,
                    is_anonymous, upvotes_count, is_helpful_flag, status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    c1_id,
                    post1_id,
                    None,
                    dan_id,
                    "The onboarding process is confusing. When I first loaded the screen, I was confronted with a 12-item shortcut cheat sheet with no interactive walkthrough. I had to guess how to create my first backlog bucket.",
                    1,  # ANONYMOUS COMMENT
                    14,
                    1,
                    "published",
                    now,
                    now,
                ),
            )

            c2_id = "cmt_002"
            conn.execute(
                """INSERT INTO comments (
                    id, post_id, parent_comment_id, author_id, content,
                    is_anonymous, upvotes_count, is_helpful_flag, status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    c2_id,
                    post1_id,
                    c1_id,
                    sarah_id,
                    "This is super clear feedback. Would an interactive 3-step checklist (create task, add tag, set schedule) be better than the shortcut modal?",
                    0,
                    5,
                    0,
                    "published",
                    now,
                    now,
                ),
            )

            c3_id = "cmt_003"
            conn.execute(
                """INSERT INTO comments (
                    id, post_id, parent_comment_id, author_id, content,
                    is_anonymous, upvotes_count, is_helpful_flag, status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    c3_id,
                    post1_id,
                    None,
                    dan_id,
                    "I need Google Calendar integration before I could ever switch. If my tasks do not block out real calendar slots, teammates book over my focus hours.",
                    0,
                    11,
                    1,
                    "published",
                    now,
                    now,
                ),
            )


# Global community repository instance
community_repo = CommunityRepository()
