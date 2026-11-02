"""Creator Space Database Repository."""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from backend.app.db.connection import DatabaseManager, db_manager


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class CreatorRepository:
    def __init__(self, db: Optional[DatabaseManager] = None) -> None:
        self.db = db or db_manager

    def _parse_skills(self, skills_raw: Any) -> List[str]:
        if not skills_raw:
            return []
        if isinstance(skills_raw, list):
            return skills_raw
        try:
            parsed = json.loads(skills_raw)
            return parsed if isinstance(parsed, list) else []
        except Exception:
            return []

    def get_creator_profile(self, user_id: str) -> Dict[str, Any]:
        with self.db.session() as conn:
            row = conn.execute(
                "SELECT * FROM profiles WHERE id = ?", (user_id,)
            ).fetchone()
            if not row:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

            row_keys = row.keys()
            return {
                "id": row["id"],
                "username": row["username"],
                "displayName": row["display_name"],
                "bio": row["bio"] or "",
                "avatarUrl": row["avatar_url"],
                "githubUrl": row["github_url"] if "github_url" in row_keys else None,
                "websiteUrl": row["website_url"] if "website_url" in row_keys else None,
                "skills": self._parse_skills(row["skills"]) if "skills" in row_keys else [],
                "reputationScore": row["reputation_score"],
                "joinedAt": row["created_at"],
            }

    def update_creator_profile(self, user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        with self.db.session() as conn:
            row = conn.execute("SELECT id FROM profiles WHERE id = ?", (user_id,)).fetchone()
            if not row:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

            clauses = []
            params = []
            now = utc_now_iso()

            if "displayName" in updates and updates["displayName"] is not None:
                clauses.append("display_name = ?")
                params.append(updates["displayName"].strip())
            if "bio" in updates and updates["bio"] is not None:
                clauses.append("bio = ?")
                params.append(updates["bio"].strip())
            if "avatarUrl" in updates and updates["avatarUrl"] is not None:
                clauses.append("avatar_url = ?")
                params.append(updates["avatarUrl"].strip() or None)
            if "githubUrl" in updates and updates["githubUrl"] is not None:
                clauses.append("github_url = ?")
                params.append(updates["githubUrl"].strip() or None)
            if "websiteUrl" in updates and updates["websiteUrl"] is not None:
                clauses.append("website_url = ?")
                params.append(updates["websiteUrl"].strip() or None)
            if "skills" in updates and updates["skills"] is not None:
                clauses.append("skills = ?")
                params.append(json.dumps(updates["skills"]))

            if clauses:
                clauses.append("updated_at = ?")
                params.append(now)
                params.append(user_id)
                conn.execute(
                    f"UPDATE profiles SET {', '.join(clauses)} WHERE id = ?",
                    params,
                )

        return self.get_creator_profile(user_id)

    def get_creator_studio_overview(self, user_id: str) -> Dict[str, Any]:
        profile = self.get_creator_profile(user_id)

        with self.db.session() as conn:
            project_rows = conn.execute(
                "SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC",
                (user_id,),
            ).fetchall()

            projects = []
            total_open_blockers = 0

            for r in project_rows:
                # Count open blockers
                blocker_row = conn.execute(
                    """
                    SELECT COUNT(*) as count FROM feedback_findings
                    WHERE project_id = ? AND severity = 'blocker' AND status = 'open'
                    """,
                    (r["id"],),
                ).fetchone()
                open_blockers = blocker_row["count"] if blocker_row else 0
                total_open_blockers += open_blockers

                has_ai_review = r["reviews_count"] > 0
                has_repo_url = bool(r["repository_url"] and r["repository_url"].strip())
                has_demo_url = bool(r["demo_url"] and r["demo_url"].strip())
                is_launch_ready = has_ai_review and (open_blockers == 0) and (has_repo_url or has_demo_url)

                projects.append({
                    "id": r["id"],
                    "name": r["name"],
                    "tagline": r["tagline"],
                    "description": r["description"],
                    "category": r["category"],
                    "status": r["status"],
                    "isPublic": bool(r["is_public"]),
                    "repositoryUrl": r["repository_url"],
                    "demoUrl": r["demo_url"],
                    "upvotesCount": r["upvotes_count"],
                    "reviewsCount": r["reviews_count"],
                    "readiness": {
                        "hasAiReview": has_ai_review,
                        "hasRepoUrl": has_repo_url,
                        "hasDemoUrl": has_demo_url,
                        "openBlockersCount": open_blockers,
                        "isLaunchReady": is_launch_ready,
                    },
                    "createdAt": r["created_at"],
                    "updatedAt": r["updated_at"],
                })

            total_projects = len(projects)
            published_projects = sum(1 for p in projects if p["isPublic"])
            private_projects = total_projects - published_projects
            total_upvotes = sum(p["upvotesCount"] for p in projects)
            total_reviews = sum(p["reviewsCount"] for p in projects)

            return {
                "profile": profile,
                "metrics": {
                    "totalProjectsCount": total_projects,
                    "publishedProjectsCount": published_projects,
                    "privateProjectsCount": private_projects,
                    "totalUpvotesReceived": total_upvotes,
                    "totalReviewsCompleted": total_reviews,
                    "totalOpenBlockers": total_open_blockers,
                },
                "projects": projects,
            }

    def get_public_creator_profile(self, username_or_id: str) -> Dict[str, Any]:
        with self.db.session() as conn:
            row = conn.execute(
                "SELECT * FROM profiles WHERE username = ? OR id = ?",
                (username_or_id, username_or_id),
            ).fetchone()

            if not row:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Creator profile not found",
                )

            creator_id = row["id"]
            row_keys = row.keys()

            # Strictly fetch ONLY public projects
            pub_project_rows = conn.execute(
                "SELECT * FROM projects WHERE user_id = ? AND is_public = 1 ORDER BY upvotes_count DESC, created_at DESC",
                (creator_id,),
            ).fetchall()

            published_projects = []
            for pr in pub_project_rows:
                # Use public projection: strictly omits userId, notes, prompt logs
                published_projects.append({
                    "id": pr["id"],
                    "name": pr["name"],
                    "tagline": pr["tagline"],
                    "description": pr["description"],
                    "category": pr["category"],
                    "repositoryUrl": pr["repository_url"],
                    "demoUrl": pr["demo_url"],
                    "status": pr["status"],
                    "isPublic": True,
                    "upvotesCount": pr["upvotes_count"],
                    "reviewsCount": pr["reviews_count"],
                    "creatorUsername": row["username"],
                    "creatorDisplayName": row["display_name"],
                    "createdAt": pr["created_at"],
                    "updatedAt": pr["updated_at"],
                })

            total_upvotes = sum(p["upvotesCount"] for p in published_projects)

            return {
                "username": row["username"],
                "displayName": row["display_name"],
                "bio": row["bio"] or "",
                "avatarUrl": row["avatar_url"],
                "githubUrl": row["github_url"] if "github_url" in row_keys else None,
                "websiteUrl": row["website_url"] if "website_url" in row_keys else None,
                "skills": self._parse_skills(row["skills"]) if "skills" in row_keys else [],
                "reputationScore": row["reputation_score"],
                "joinedAt": row["created_at"],
                "totalPublishedProjects": len(published_projects),
                "totalUpvotesReceived": total_upvotes,
                "publishedProjects": published_projects,
            }

    def set_project_visibility(self, project_id: str, user_id: str, is_public: bool) -> Dict[str, Any]:
        now = utc_now_iso()
        with self.db.session() as conn:
            row = conn.execute("SELECT user_id FROM projects WHERE id = ?", (project_id,)).fetchone()
            if not row:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
            if row["user_id"] != user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Permission denied: You do not own this project",
                )

            conn.execute(
                "UPDATE projects SET is_public = ?, updated_at = ? WHERE id = ?",
                (1 if is_public else 0, now, project_id),
            )

            updated = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
            return {
                "id": updated["id"],
                "name": updated["name"],
                "isPublic": bool(updated["is_public"]),
                "updatedAt": updated["updated_at"],
            }


creator_repo = CreatorRepository()
