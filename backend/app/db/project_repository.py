"""Relational Repository for Projects, Attachments, and AI Feedback Reports."""

from __future__ import annotations
import hashlib
import logging
import uuid
import sqlite3
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status
from backend.app.db.connection import db_manager

logger = logging.getLogger(__name__)


class StaleLeaseError(RuntimeError):
    """Raised when a worker attempts to finalize or heartbeat a review whose lease was revoked, expired, or claimed by another worker."""
    pass


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
    # AI Reviews & Feedback Reports (Phase 2 Concurrency & Durable Execution)
    # -------------------------------------------------------------------------
    def reserve_ai_review(
        self,
        project_id: str,
        user_id: str,
        provider: str = "gemini",
        model_id: str = "gemini-2.5-flash",
        max_attempts: int = 3,
    ) -> Dict[str, Any]:
        """Atomically reserves a new AI review session or returns an existing active review.

        Concurrency Guarantee:
        Protected by immediate transaction serialization and database-enforced partial unique index.
        At most one active review (queued or processing) can exist per project.
        """
        review_id = str(uuid.uuid4())
        now = utc_now_iso()

        with self.db.session() as conn:
            try:
                conn.execute("BEGIN IMMEDIATE")
            except sqlite3.OperationalError:
                pass

            # 1. Check for existing active review
            existing = conn.execute(
                """
                SELECT * FROM ai_reviews
                WHERE project_id = ? AND status IN ('queued', 'processing')
                ORDER BY created_at DESC LIMIT 1
                """,
                (project_id,),
            ).fetchone()
            if existing:
                return self._serialize_review(existing)

            # 2. Insert new queued review
            try:
                conn.execute(
                    """
                    INSERT INTO ai_reviews (
                        id, project_id, user_id, model_id, provider,
                        status, attempt_count, max_attempts, created_at
                    ) VALUES (?, ?, ?, ?, ?, 'queued', 0, ?, ?)
                    """,
                    (review_id, project_id, user_id, model_id, provider, max_attempts, now),
                )
                # Set project to in_review
                conn.execute(
                    "UPDATE projects SET status = 'in_review', updated_at = ? WHERE id = ?",
                    (now, project_id),
                )
            except sqlite3.IntegrityError:
                # Database partial unique index prevented duplicate insertion under race condition
                active = conn.execute(
                    """
                    SELECT * FROM ai_reviews
                    WHERE project_id = ? AND status IN ('queued', 'processing')
                    ORDER BY created_at DESC LIMIT 1
                    """,
                    (project_id,),
                ).fetchone()
                if active:
                    return self._serialize_review(active)
                raise

        return self.get_ai_review(review_id, user_id)

    def create_ai_review(
        self,
        project_id: str,
        user_id: str,
        provider: str = "gemini",
        model_id: str = "gemini-2.5-flash",
    ) -> Dict[str, Any]:
        """Backwards-compatible alias for reserve_ai_review."""
        return self.reserve_ai_review(project_id, user_id, provider, model_id)

    def claim_queued_ai_review(
        self,
        worker_id: str,
        lease_duration_sec: int = 60,
        review_id: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Atomically claims the next eligible queued review (or targeted review_id) using a fenced lease token."""
        now = utc_now_iso()
        lease_token = str(uuid.uuid4())
        lease_expires = (datetime.now(timezone.utc) + timedelta(seconds=lease_duration_sec)).isoformat()

        with self.db.session() as conn:
            try:
                conn.execute("BEGIN IMMEDIATE")
            except sqlite3.OperationalError:
                pass

            if review_id:
                row = conn.execute(
                    """
                    SELECT id, project_id, user_id, provider, model_id, attempt_count, max_attempts
                    FROM ai_reviews
                    WHERE id = ? AND status = 'queued'
                    """,
                    (review_id,),
                ).fetchone()
            else:
                row = conn.execute(
                    """
                    SELECT id, project_id, user_id, provider, model_id, attempt_count, max_attempts
                    FROM ai_reviews
                    WHERE status = 'queued' AND (scheduled_at IS NULL OR scheduled_at <= ?)
                    ORDER BY created_at ASC LIMIT 1
                    """,
                    (now,),
                ).fetchone()

            if not row:
                return None

            target_id = row["id"]
            updated = conn.execute(
                """
                UPDATE ai_reviews
                SET status = 'processing',
                    worker_id = ?,
                    lease_token = ?,
                    lease_expires_at = ?,
                    last_heartbeat_at = ?,
                    attempt_count = attempt_count + 1
                WHERE id = ? AND status = 'queued'
                """,
                (worker_id, lease_token, lease_expires, now, target_id),
            )
            if updated.rowcount == 0:
                return None  # Claimed concurrently by another worker

            claimed = conn.execute("SELECT * FROM ai_reviews WHERE id = ?", (target_id,)).fetchone()
            return self._serialize_review(claimed)

    def heartbeat_ai_review(
        self,
        review_id: str,
        lease_token: str,
        lease_duration_sec: int = 60,
    ) -> bool:
        """Renews the lease for an active review worker."""
        now = utc_now_iso()
        new_expires = (datetime.now(timezone.utc) + timedelta(seconds=lease_duration_sec)).isoformat()
        with self.db.session() as conn:
            cur = conn.execute(
                """
                UPDATE ai_reviews
                SET last_heartbeat_at = ?, lease_expires_at = ?
                WHERE id = ? AND lease_token = ? AND status = 'processing'
                """,
                (now, new_expires, review_id, lease_token),
            )
            return cur.rowcount > 0

    def finalize_feedback_report(
        self,
        review_id: str,
        project_id: str,
        executive_summary: str,
        strengths_summary: str,
        findings_data: List[Dict[str, Any]],
        worker_id: Optional[str] = None,
        lease_token: Optional[str] = None,
        duration_ms: Optional[int] = None,
        input_tokens: Optional[int] = None,
        output_tokens: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Atomically persists feedback report, findings, updates review to completed, and increments project counters.

        Fencing Guarantee:
        If lease_token is provided, verifies executing worker still holds active lease.
        Idempotency Guarantee:
        If report already exists for this review, returns existing report without double-incrementing counters.
        """
        report_id = str(uuid.uuid4())
        now = utc_now_iso()

        blockers = sum(1 for f in findings_data if f.get("severity") == "blocker")
        highs = sum(1 for f in findings_data if f.get("severity") == "high")
        mediums = sum(1 for f in findings_data if f.get("severity") == "medium")
        lows = sum(1 for f in findings_data if f.get("severity") == "low")
        total_findings = len(findings_data)

        with self.db.session() as conn:
            try:
                conn.execute("BEGIN IMMEDIATE")
            except sqlite3.OperationalError:
                pass

            # 1. Fencing & Status Check
            review_row = conn.execute(
                "SELECT status, worker_id, lease_token FROM ai_reviews WHERE id = ?",
                (review_id,),
            ).fetchone()
            if not review_row:
                raise HTTPException(status_code=404, detail="Review session not found")

            if review_row["status"] == "completed":
                # Idempotent response if already finalized
                existing_report = conn.execute(
                    "SELECT id FROM feedback_reports WHERE review_id = ?",
                    (review_id,),
                ).fetchone()
                if existing_report:
                    return self.get_feedback_report(existing_report["id"])

            if review_row["status"] != "processing":
                raise StaleLeaseError(f"Review {review_id} is in status '{review_row['status']}', cannot finalize.")

            if lease_token and review_row["lease_token"] and review_row["lease_token"] != lease_token:
                raise StaleLeaseError(f"Worker lease token mismatch for review {review_id}; lease was claimed by another worker.")

            # 2. Idempotency Check for Report
            existing_rep = conn.execute("SELECT id FROM feedback_reports WHERE review_id = ?", (review_id,)).fetchone()
            if existing_rep:
                return self.get_feedback_report(existing_rep["id"])

            # 3. Insert feedback report
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
                    total_findings, blockers, highs, mediums, lows, now,
                ),
            )

            # 4. Bulk insert findings with default 'open' status and record evidence citations
            snap_row = conn.execute("SELECT id FROM project_source_snapshots WHERE review_id = ? LIMIT 1", (review_id,)).fetchone()
            snapshot_id = snap_row["id"] if snap_row else None
            src_row = conn.execute("SELECT id FROM project_sources WHERE project_id = ? AND is_active = 1 LIMIT 1", (project_id,)).fetchone()
            active_src_id = src_row["id"] if src_row else None

            for f in findings_data:
                finding_id = str(uuid.uuid4())
                evidence_q = f.get("evidence_quote") or f.get("evidenceQuote", "")
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
                        f["category"], f["observation"], evidence_q,
                        f["recommendation"], now, now,
                    ),
                )

                if evidence_q:
                    cit_id = f"cit_{uuid.uuid4().hex[:12]}"
                    c_hash = hashlib.sha256(evidence_q.encode("utf-8")).hexdigest()
                    try:
                        conn.execute(
                            """
                            INSERT INTO finding_evidence_citations (
                                id, finding_id, source_id, snapshot_id, canonical_quote, content_hash, validation_result, created_at
                            ) VALUES (?, ?, ?, ?, ?, ?, 'valid', ?)
                            """,
                            (cit_id, finding_id, active_src_id, snapshot_id, evidence_q, c_hash, now),
                        )
                    except Exception as cit_err:
                        logger.warning("Failed to record finding_evidence_citations: %s", cit_err)

            # 5. Mark review completed atomically with fencing
            review_update = conn.execute(
                """
                UPDATE ai_reviews
                SET status = 'completed',
                    execution_duration_ms = ?,
                    input_token_count = ?,
                    output_token_count = ?,
                    completed_at = ?
                WHERE id = ? AND status = 'processing'
                """,
                (duration_ms, input_tokens, output_tokens, now, review_id),
            )
            if review_update.rowcount == 0:
                raise StaleLeaseError(f"Failed to transition review {review_id} to completed; state changed concurrently.")

            # 6. Update project status and increment review counter exactly once
            conn.execute(
                """
                UPDATE projects
                SET status = 'reviewed', reviews_count = reviews_count + 1, updated_at = ?
                WHERE id = ?
                """,
                (now, project_id),
            )

        return self.get_feedback_report(report_id)

    def fail_ai_review(
        self,
        review_id: str,
        project_id: str,
        error_message: str,
        worker_id: Optional[str] = None,
        lease_token: Optional[str] = None,
        is_terminal: bool = True,
        duration_ms: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Atomically records a review failure and coordinates retry or project state recovery."""
        now = utc_now_iso()
        with self.db.session() as conn:
            try:
                conn.execute("BEGIN IMMEDIATE")
            except sqlite3.OperationalError:
                pass

            if is_terminal:
                conn.execute(
                    """
                    UPDATE ai_reviews
                    SET status = 'failed',
                        error_message = ?,
                        execution_duration_ms = ?,
                        completed_at = ?
                    WHERE id = ?
                    """,
                    (error_message, duration_ms, now, review_id),
                )
                # Check if any other active review exists for project
                other_active = conn.execute(
                    """
                    SELECT count(*) as cnt FROM ai_reviews
                    WHERE project_id = ? AND status IN ('queued', 'processing') AND id != ?
                    """,
                    (project_id, review_id),
                ).fetchone()["cnt"]
                if other_active == 0:
                    conn.execute(
                        "UPDATE projects SET status = 'ready', updated_at = ? WHERE id = ?",
                        (now, project_id),
                    )
            else:
                # Calculate exponential backoff
                row = conn.execute("SELECT attempt_count FROM ai_reviews WHERE id = ?", (review_id,)).fetchone()
                attempts = (row["attempt_count"] if row else 1)
                backoff_sec = min(300, (2 ** attempts) * 5)
                scheduled_at = (datetime.now(timezone.utc) + timedelta(seconds=backoff_sec)).isoformat()
                conn.execute(
                    """
                    UPDATE ai_reviews
                    SET status = 'queued',
                        worker_id = NULL,
                        lease_token = NULL,
                        scheduled_at = ?,
                        error_message = ?
                    WHERE id = ?
                    """,
                    (scheduled_at, error_message, review_id),
                )

        return self.get_ai_review(review_id)

    def recover_stale_reviews(self) -> List[Dict[str, Any]]:
        """Scans for abandoned reviews with expired leases and either schedules retry or terminally fails them."""
        now = utc_now_iso()
        recovered = []
        with self.db.session() as conn:
            try:
                conn.execute("BEGIN IMMEDIATE")
            except sqlite3.OperationalError:
                pass

            # 1. Processing reviews whose lease expired
            stale_rows = conn.execute(
                """
                SELECT id, project_id, attempt_count, max_attempts
                FROM ai_reviews
                WHERE status = 'processing' AND lease_expires_at IS NOT NULL AND lease_expires_at < ?
                """,
                (now,),
            ).fetchall()

            for row in stale_rows:
                review_id = row["id"]
                project_id = row["project_id"]
                attempts = row["attempt_count"] or 0
                max_attempts = row["max_attempts"] or 3

                if attempts < max_attempts:
                    # Exponential backoff retry
                    backoff_sec = min(300, (2 ** attempts) * 5)
                    scheduled_at = (datetime.now(timezone.utc) + timedelta(seconds=backoff_sec)).isoformat()
                    conn.execute(
                        """
                        UPDATE ai_reviews
                        SET status = 'queued',
                            worker_id = NULL,
                            lease_token = NULL,
                            scheduled_at = ?,
                            error_message = 'Worker lease expired; re-queued for recovery'
                        WHERE id = ? AND status = 'processing'
                        """,
                        (scheduled_at, review_id),
                    )
                    recovered.append({"id": review_id, "action": "requeued", "attempt": attempts})
                else:
                    # Terminal failure
                    conn.execute(
                        """
                        UPDATE ai_reviews
                        SET status = 'failed',
                            error_message = 'Execution lease expired and maximum retry attempts exhausted',
                            completed_at = ?
                        WHERE id = ? AND status = 'processing'
                        """,
                        (now, review_id),
                    )
                    # Reset project if no other active review
                    other_active = conn.execute(
                        "SELECT count(*) as cnt FROM ai_reviews WHERE project_id = ? AND status IN ('queued', 'processing') AND id != ?",
                        (project_id, review_id),
                    ).fetchone()["cnt"]
                    if other_active == 0:
                        conn.execute(
                            "UPDATE projects SET status = 'ready', updated_at = ? WHERE id = ?",
                            (now, project_id),
                        )
                    recovered.append({"id": review_id, "action": "terminal_fail", "attempt": attempts})

            # 2. Orphaned projects stuck in in_review with no active review session
            stuck_projects = conn.execute(
                """
                SELECT p.id FROM projects p
                WHERE p.status = 'in_review'
                AND NOT EXISTS (
                    SELECT 1 FROM ai_reviews r
                    WHERE r.project_id = p.id AND r.status IN ('queued', 'processing')
                )
                """
            ).fetchall()
            for p in stuck_projects:
                conn.execute("UPDATE projects SET status = 'ready', updated_at = ? WHERE id = ?", (now, p["id"]))
                recovered.append({"projectId": p["id"], "action": "reset_project_status"})

        return recovered

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
            if requesting_user_id is not None and not row["project_is_public"] and row["project_owner_id"] != requesting_user_id:
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
        """Backwards-compatible wrapper delegating to finalize_feedback_report."""
        return self.finalize_feedback_report(
            review_id=review_id,
            project_id=project_id,
            executive_summary=executive_summary,
            strengths_summary=strengths_summary,
            findings_data=findings_data,
        )

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
        keys = row.keys()
        return {
            "id": row["id"],
            "projectId": row["project_id"],
            "userId": row["user_id"],
            "modelId": row["model_id"],
            "provider": row["provider"],
            "status": row["status"],
            "errorMessage": row["error_message"],
            "executionDurationMs": row["execution_duration_ms"],
            "inputTokenCount": row["input_token_count"] if "input_token_count" in keys else None,
            "outputTokenCount": row["output_token_count"] if "output_token_count" in keys else None,
            "workerId": row["worker_id"] if "worker_id" in keys else None,
            "leaseToken": row["lease_token"] if "lease_token" in keys else None,
            "leaseExpiresAt": row["lease_expires_at"] if "lease_expires_at" in keys else None,
            "lastHeartbeatAt": row["last_heartbeat_at"] if "last_heartbeat_at" in keys else None,
            "attemptCount": row["attempt_count"] if "attempt_count" in keys else 0,
            "maxAttempts": row["max_attempts"] if "max_attempts" in keys else 3,
            "scheduledAt": row["scheduled_at"] if "scheduled_at" in keys else None,
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
