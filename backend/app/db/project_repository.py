"""Relational Repository for Projects, Attachments, and AI Feedback Reports."""

from __future__ import annotations
import uuid
import sqlite3
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status
from backend.app.db.connection import db_manager


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class ProjectRepository:
    def __init__(self) -> None:
        self.db = db_manager

    # -------------------------------------------------------------------------
    # Projects CRUD
    # -------------------------------------------------------------------------
    def create_project(
        self,
        user_id: str,
        name: str,
        tagline: str,
        category: str,
        description: str = "",
        repository_url: Optional[str] = None,
        demo_url: Optional[str] = None,
        is_public: bool = False,
    ) -> Dict[str, Any]:
        project_id = str(uuid.uuid4())
        now = utc_now_iso()
        with self.db.session() as conn:
            conn.execute(
                """
                INSERT INTO projects (
                    id, user_id, name, tagline, description, category,
                    repository_url, demo_url, status, is_public,
                    upvotes_count, reviews_count, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, 0, 0, ?, ?)
                """,
                (
                    project_id, user_id, name, tagline, description, category,
                    repository_url, demo_url, 1 if is_public else 0, now, now
                ),
            )
        return self.get_project(project_id, user_id)

    def get_project(self, project_id: str, requesting_user_id: Optional[str] = None) -> Dict[str, Any]:
        with self.db.session() as conn:
            row = conn.execute(
                "SELECT * FROM projects WHERE id = ?", (project_id,)
            ).fetchone()
            if not row:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Project not found",
                )
            # RLS: Visible if public or if requesting user is the owner
            if not row["is_public"] and row["user_id"] != requesting_user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: This project is private",
                )
            return self._serialize_project(row)

    def list_personal_projects(
        self,
        user_id: str,
        status_filter: Optional[str] = None,
        category_filter: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        with self.db.session() as conn:
            query = "SELECT * FROM projects WHERE user_id = ?"
            params: List[Any] = [user_id]
            if status_filter and status_filter != "all":
                query += " AND status = ?"
                params.append(status_filter)
            if category_filter and category_filter.lower() != "all":
                query += " AND (LOWER(category) = LOWER(?) OR LOWER(category) = LOWER(REPLACE(?, ' ', '-')))"
                params.extend([category_filter, category_filter])
            query += " ORDER BY updated_at DESC LIMIT ? OFFSET ?"
            params.extend([limit, offset])

            rows = conn.execute(query, params).fetchall()
            return [self._serialize_project(r) for r in rows]

    def list_public_projects(
        self,
        category_filter: Optional[str] = None,
        search_query: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        with self.db.session() as conn:
            query = "SELECT * FROM projects WHERE is_public = 1"
            params: List[Any] = []
            if category_filter and category_filter.lower() != "all":
                query += " AND (LOWER(category) = LOWER(?) OR LOWER(category) = LOWER(REPLACE(?, ' ', '-')))"
                params.extend([category_filter, category_filter])
            if search_query:
                query += " AND (name LIKE ? OR tagline LIKE ? OR description LIKE ?)"
                wildcard = f"%{search_query.strip()}%"
                params.extend([wildcard, wildcard, wildcard])
            query += " ORDER BY upvotes_count DESC, created_at DESC LIMIT ? OFFSET ?"
            params.extend([limit, offset])

            rows = conn.execute(query, params).fetchall()
            return [self._serialize_public_project(r) for r in rows]

    def get_public_project(self, project_id: str) -> Dict[str, Any]:
        """Fetches a project only if is_public = 1. Returns 404 if private or nonexistent."""
        with self.db.session() as conn:
            row = conn.execute(
                "SELECT * FROM projects WHERE id = ? AND is_public = 1", (project_id,)
            ).fetchone()
            if not row:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Public project not found",
                )
            return self._serialize_public_project(row)

    def get_public_feedback_report(self, project_id: str) -> Optional[Dict[str, Any]]:
        """Returns the public feedback report for a published project; 404 if private."""
        self.get_public_project(project_id)
        with self.db.session() as conn:
            row = conn.execute(
                "SELECT * FROM feedback_reports WHERE project_id = ? ORDER BY created_at DESC LIMIT 1",
                (project_id,),
            ).fetchone()
            if not row:
                return None
            return self.get_feedback_report(row["id"])

    def upvote_public_project(self, project_id: str, user_id: str) -> Dict[str, Any]:
        """Allows authenticated users to upvote/un-upvote a public project."""
        self.get_public_project(project_id)
        now = utc_now_iso()
        with self.db.session() as conn:
            existing = conn.execute(
                "SELECT 1 FROM project_upvotes WHERE project_id = ? AND user_id = ?",
                (project_id, user_id),
            ).fetchone()

            if existing:
                conn.execute(
                    "DELETE FROM project_upvotes WHERE project_id = ? AND user_id = ?",
                    (project_id, user_id),
                )
                conn.execute(
                    "UPDATE projects SET upvotes_count = MAX(0, upvotes_count - 1), updated_at = ? WHERE id = ?",
                    (now, project_id),
                )
                has_upvoted = False
            else:
                conn.execute(
                    "INSERT INTO project_upvotes (project_id, user_id, created_at) VALUES (?, ?, ?)",
                    (project_id, user_id, now),
                )
                conn.execute(
                    "UPDATE projects SET upvotes_count = upvotes_count + 1, updated_at = ? WHERE id = ?",
                    (now, project_id),
                )
                has_upvoted = True

            updated_row = conn.execute(
                "SELECT upvotes_count FROM projects WHERE id = ?", (project_id,)
            ).fetchone()
            new_count = updated_row["upvotes_count"] if updated_row else 0
            return {
                "projectId": project_id,
                "upvotesCount": new_count,
                "hasUpvoted": has_upvoted,
            }

    def update_project(
        self,
        project_id: str,
        user_id: str,
        updates: Dict[str, Any],
    ) -> Dict[str, Any]:
        with self.db.session() as conn:
            row = conn.execute(
                "SELECT user_id FROM projects WHERE id = ?", (project_id,)
            ).fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Project not found")
            if row["user_id"] != user_id:
                raise HTTPException(status_code=403, detail="Permission denied")

            key_map = {
                "name": "name",
                "tagline": "tagline",
                "description": "description",
                "category": "category",
                "repository_url": "repository_url",
                "repositoryUrl": "repository_url",
                "demo_url": "demo_url",
                "demoUrl": "demo_url",
                "status": "status",
                "is_public": "is_public",
                "isPublic": "is_public",
            }
            fields = []
            params = []
            for k, v in updates.items():
                col = key_map.get(k)
                if col and v is not None:
                    fields.append(f"{col} = ?")
                    params.append(1 if (col == "is_public" and v is True) else (0 if col == "is_public" else v))

            if not fields:
                return self.get_project(project_id, user_id)

            fields.append("updated_at = ?")
            params.append(utc_now_iso())
            params.append(project_id)

            conn.execute(
                f"UPDATE projects SET {', '.join(fields)} WHERE id = ?",
                params,
            )
        return self.get_project(project_id, user_id)

    def delete_project(self, project_id: str, user_id: str) -> bool:
        with self.db.session() as conn:
            row = conn.execute(
                "SELECT user_id FROM projects WHERE id = ?", (project_id,)
            ).fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Project not found")
            if row["user_id"] != user_id:
                raise HTTPException(status_code=403, detail="Permission denied")
            conn.execute("DELETE FROM projects WHERE id = ?", (project_id,))
        return True

    # -------------------------------------------------------------------------
    # Findings Status
    # -------------------------------------------------------------------------
    def update_finding_status(
        self,
        finding_id: str,
        user_id: str,
        new_status: str,
    ) -> Dict[str, Any]:
        now = utc_now_iso()
        with self.db.session() as conn:
            row = conn.execute(
                """
                SELECT f.*, p.user_id as project_owner_id
                FROM feedback_findings f
                JOIN projects p ON f.project_id = p.id
                WHERE f.id = ?
                """,
                (finding_id,),
            ).fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Finding not found")
            if row["project_owner_id"] != user_id:
                raise HTTPException(status_code=403, detail="Permission denied")

            resolved_at = now if new_status == "addressed" else None
            conn.execute(
                """
                UPDATE feedback_findings
                SET status = ?, resolved_at = ?, updated_at = ?
                WHERE id = ?
                """,
                (new_status, resolved_at, now, finding_id),
            )
            updated_row = conn.execute(
                "SELECT * FROM feedback_findings WHERE id = ?", (finding_id,)
            ).fetchone()
            return self._serialize_finding(updated_row)

    # -------------------------------------------------------------------------
    # AI Reviews & Feedback Reports
    # -------------------------------------------------------------------------
    def create_ai_review(
        self,
        project_id: str,
        user_id: str,
        provider: str = "gemini",
        model_id: str = "gemini-2.5-flash",
    ) -> Dict[str, Any]:
        review_id = str(uuid.uuid4())
        now = utc_now_iso()
        with self.db.session() as conn:
            conn.execute(
                """
                INSERT INTO ai_reviews (
                    id, project_id, user_id, model_id, provider,
                    status, created_at
                ) VALUES (?, ?, ?, ?, ?, 'queued', ?)
                """,
                (review_id, project_id, user_id, model_id, provider, now),
            )
        return self.get_ai_review(review_id, user_id)

    def get_active_ai_review(self, project_id: str) -> Optional[Dict[str, Any]]:
        with self.db.session() as conn:
            row = conn.execute(
                """
                SELECT * FROM ai_reviews
                WHERE project_id = ? AND status IN ('queued', 'processing')
                ORDER BY created_at DESC LIMIT 1
                """,
                (project_id,),
            ).fetchone()
            if row:
                return self._serialize_review(row)
            return None

    def update_ai_review_status(
        self,
        review_id: str,
        status: str,
        error_message: Optional[str] = None,
        duration_ms: Optional[int] = None,
        input_tokens: Optional[int] = None,
        output_tokens: Optional[int] = None,
    ) -> Dict[str, Any]:
        now = utc_now_iso()
        completed_at = now if status in ("completed", "failed") else None
        with self.db.session() as conn:
            conn.execute(
                """
                UPDATE ai_reviews
                SET status = ?, error_message = ?, execution_duration_ms = ?,
                    input_token_count = ?, output_token_count = ?, completed_at = ?
                WHERE id = ?
                """,
                (status, error_message, duration_ms, input_tokens, output_tokens, completed_at, review_id),
            )
            row = conn.execute("SELECT * FROM ai_reviews WHERE id = ?", (review_id,)).fetchone()
            return self._serialize_review(row)

    def get_ai_review(self, review_id: str, requesting_user_id: Optional[str] = None) -> Dict[str, Any]:
        with self.db.session() as conn:
            row = conn.execute(
                """
                SELECT r.*, p.is_public as project_is_public, p.user_id as project_owner_id
                FROM ai_reviews r
                JOIN projects p ON r.project_id = p.id
                WHERE r.id = ?
                """,
                (review_id,),
            ).fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Review session not found")
            if not row["project_is_public"] and row["project_owner_id"] != requesting_user_id:
                raise HTTPException(status_code=403, detail="Access denied: Review belongs to a private project")
            return self._serialize_review(row)

    def list_project_reviews(self, project_id: str, requesting_user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        # Verify project access
        self.get_project(project_id, requesting_user_id)
        with self.db.session() as conn:
            rows = conn.execute(
                "SELECT * FROM ai_reviews WHERE project_id = ? ORDER BY created_at DESC",
                (project_id,),
            ).fetchall()
            return [self._serialize_review(r) for r in rows]

    def save_feedback_report(
        self,
        review_id: str,
        project_id: str,
        executive_summary: str,
        strengths_summary: str,
        findings_data: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        report_id = str(uuid.uuid4())
        now = utc_now_iso()

        blockers = sum(1 for f in findings_data if f.get("severity") == "blocker")
        highs = sum(1 for f in findings_data if f.get("severity") == "high")
        mediums = sum(1 for f in findings_data if f.get("severity") == "medium")
        lows = sum(1 for f in findings_data if f.get("severity") == "low")
        total_findings = len(findings_data)

        with self.db.session() as conn:
            # 1. Insert report
            conn.execute(
                """
                INSERT INTO feedback_reports (
                    id, review_id, project_id, executive_summary, strengths_summary,
                    total_findings_count, blockers_count, high_count, medium_count, low_count,
                    created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    report_id, review_id, project_id, executive_summary, strengths_summary,
                    total_findings, blockers, highs, mediums, lows, now
                ),
            )

            # 2. Insert findings
            for f in findings_data:
                finding_id = str(uuid.uuid4())
                conn.execute(
                    """
                    INSERT INTO feedback_findings (
                        id, report_id, project_id, title, severity, category,
                        observation, evidence_quote, recommendation, status,
                        created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)
                    """,
                    (
                        finding_id, report_id, project_id, f["title"], f["severity"],
                        f["category"], f["observation"], f.get("evidence_quote") or f.get("evidenceQuote", ""),
                        f["recommendation"], now, now
                    ),
                )

            # 3. Update project status and increment reviews_count
            conn.execute(
                """
                UPDATE projects
                SET status = 'reviewed', reviews_count = reviews_count + 1, updated_at = ?
                WHERE id = ?
                """,
                (now, project_id),
            )

        return self.get_feedback_report(report_id)

    def get_feedback_report(self, report_id: str) -> Dict[str, Any]:
        with self.db.session() as conn:
            row = conn.execute(
                "SELECT * FROM feedback_reports WHERE id = ?", (report_id,)
            ).fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Feedback report not found")

            findings_rows = conn.execute(
                "SELECT * FROM feedback_findings WHERE report_id = ? ORDER BY CASE severity WHEN 'blocker' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END",
                (report_id,),
            ).fetchall()

            return self._serialize_report(row, [self._serialize_finding(f) for f in findings_rows])

    def get_latest_feedback_report_for_project(
        self,
        project_id: str,
        requesting_user_id: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        # Verify access
        self.get_project(project_id, requesting_user_id)
        with self.db.session() as conn:
            row = conn.execute(
                "SELECT * FROM feedback_reports WHERE project_id = ? ORDER BY created_at DESC LIMIT 1",
                (project_id,),
            ).fetchone()
            if not row:
                return None
            return self.get_feedback_report(row["id"])

    def get_feedback_report_for_project(
        self,
        project_id: str,
        report_id: str,
        requesting_user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        self.get_project(project_id, requesting_user_id)
        with self.db.session() as conn:
            row = conn.execute(
                "SELECT * FROM feedback_reports WHERE id = ? AND project_id = ?",
                (report_id, project_id),
            ).fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Feedback report not found for this project")
            findings_rows = conn.execute(
                "SELECT * FROM feedback_findings WHERE report_id = ? ORDER BY CASE severity WHEN 'blocker' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END",
                (report_id,),
            ).fetchall()
            return self._serialize_report(row, [self._serialize_finding(f) for f in findings_rows])

    def get_feedback_report_by_review_id(
        self,
        project_id: str,
        review_id: str,
        requesting_user_id: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        self.get_project(project_id, requesting_user_id)
        with self.db.session() as conn:
            row = conn.execute(
                "SELECT * FROM feedback_reports WHERE project_id = ? AND review_id = ?",
                (project_id, review_id),
            ).fetchone()
            if not row:
                return None
            return self.get_feedback_report_for_project(project_id, row["id"], requesting_user_id)

    def list_feedback_reports_for_project(
        self,
        project_id: str,
        requesting_user_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        self.get_project(project_id, requesting_user_id)
        with self.db.session() as conn:
            rows = conn.execute(
                "SELECT * FROM feedback_reports WHERE project_id = ? ORDER BY created_at DESC",
                (project_id,),
            ).fetchall()
            results = []
            for r in rows:
                findings_rows = conn.execute(
                    "SELECT * FROM feedback_findings WHERE report_id = ? ORDER BY CASE severity WHEN 'blocker' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END",
                    (r["id"],),
                ).fetchall()
                results.append(self._serialize_report(r, [self._serialize_finding(f) for f in findings_rows]))
            return results

    def generate_report_markdown_export(
        self,
        project_id: str,
        report_id: Optional[str] = None,
        requesting_user_id: Optional[str] = None,
    ) -> str:
        project = self.get_project(project_id, requesting_user_id)
        report = (
            self.get_feedback_report_for_project(project_id, report_id, requesting_user_id)
            if report_id
            else self.get_latest_feedback_report_for_project(project_id, requesting_user_id)
        )
        if not report:
            raise HTTPException(status_code=404, detail="No feedback report available for export.")

        lines = [
            f"# AI Technical Feedback Report: {project['name']}",
            f"**Category:** {project['category']}  ",
            f"**Report Generated:** {report['createdAt']}  ",
            f"**Review Session:** {report['reviewId']}  ",
            "",
            "## Executive Summary",
            report["executiveSummary"],
            "",
            "## Strengths Identified",
            report["strengthsSummary"],
            "",
            "## Finding Metrics",
            f"- Total Findings: {report['totalFindingsCount']}",
            f"- Blockers: {report['blockersCount']}",
            f"- High Severity: {report['highCount']}",
            f"- Medium Severity: {report['mediumCount']}",
            f"- Low Severity: {report['lowCount']}",
            "",
            "## Actionable Findings Checklist",
            "",
        ]

        for i, f in enumerate(report["findings"], 1):
            lines.extend([
                f"### {i}. [{f['severity'].upper()}] {f['title']}",
                f"- **Category:** {f['category']}",
                f"- **Status:** {f['status'].upper()}" + (f" (Resolved at: {f['resolvedAt']})" if f.get("resolvedAt") else ""),
                f"- **Observation:** {f['observation']}",
                f"- **Grounded Evidence:** > \"{f['evidenceQuote']}\"",
                f"- **Recommendation:** {f['recommendation']}",
                "",
            ])

        return "\n".join(lines)

    def _serialize_project(self, row: sqlite3.Row) -> Dict[str, Any]:
        return {
            "id": row["id"],
            "userId": row["user_id"],
            "name": row["name"],
            "tagline": row["tagline"],
            "description": row["description"],
            "category": row["category"],
            "repositoryUrl": row["repository_url"],
            "demoUrl": row["demo_url"],
            "status": row["status"],
            "isPublic": bool(row["is_public"]),
            "upvotesCount": row["upvotes_count"],
            "reviewsCount": row["reviews_count"],
            "createdAt": row["created_at"],
            "updatedAt": row["updated_at"],
        }

    def _serialize_public_project(self, row: sqlite3.Row) -> Dict[str, Any]:
        """Server-side public data projection: strictly excludes internal user_id."""
        return {
            "id": row["id"],
            "name": row["name"],
            "tagline": row["tagline"],
            "description": row["description"],
            "category": row["category"],
            "repositoryUrl": row["repository_url"],
            "demoUrl": row["demo_url"],
            "status": row["status"],
            "isPublic": True,
            "upvotesCount": row["upvotes_count"],
            "reviewsCount": row["reviews_count"],
            "creatorUsername": None,
            "creatorDisplayName": None,
            "createdAt": row["created_at"],
            "updatedAt": row["updated_at"],
        }

    def _serialize_finding(self, row: sqlite3.Row) -> Dict[str, Any]:
        return {
            "id": row["id"],
            "reportId": row["report_id"],
            "projectId": row["project_id"],
            "title": row["title"],
            "severity": row["severity"],
            "category": row["category"],
            "observation": row["observation"],
            "evidenceQuote": row["evidence_quote"],
            "recommendation": row["recommendation"],
            "status": row["status"],
            "resolvedAt": row["resolved_at"],
            "createdAt": row["created_at"],
            "updatedAt": row["updated_at"],
        }


    def _serialize_review(self, row: sqlite3.Row) -> Dict[str, Any]:
        return {
            "id": row["id"],
            "projectId": row["project_id"],
            "userId": row["user_id"],
            "modelId": row["model_id"],
            "provider": row["provider"],
            "status": row["status"],
            "errorMessage": row["error_message"],
            "executionDurationMs": row["execution_duration_ms"],
            "inputTokenCount": row["input_token_count"] if "input_token_count" in row.keys() else None,
            "outputTokenCount": row["output_token_count"] if "output_token_count" in row.keys() else None,
            "createdAt": row["created_at"],
            "completedAt": row["completed_at"],
        }

    def _serialize_report(self, row: sqlite3.Row, findings: List[Dict[str, Any]]) -> Dict[str, Any]:
        return {
            "id": row["id"],
            "reviewId": row["review_id"],
            "projectId": row["project_id"],
            "executiveSummary": row["executive_summary"],
            "strengthsSummary": row["strengths_summary"],
            "totalFindingsCount": row["total_findings_count"],
            "blockersCount": row["blockers_count"],
            "highCount": row["high_count"],
            "mediumCount": row["medium_count"],
            "lowCount": row["low_count"],
            "findings": findings,
            "createdAt": row["created_at"],
        }


project_repo = ProjectRepository()
