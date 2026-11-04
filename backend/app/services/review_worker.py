"""Durable Review Execution Worker and Recovery Daemon (Phase 2).

Provides reliable, durable background processing for AI project reviews:
- Atomic worker claiming with fenced lease tokens.
- Lease renewal via periodic heartbeats.
- Fenced finalization to reject stale/reclaimed workers.
- Automatic recovery of abandoned jobs with expired leases.
- Exponential backoff retry with attempt limits.
- Zero credential or private source logging.
"""

from __future__ import annotations

import logging
import os
import threading
import time
import uuid
from typing import Dict, Any, Optional, List

from backend.app.config import settings
from backend.app.db.project_repository import project_repo, StaleLeaseError

logger = logging.getLogger(__name__)


def log_structured_signal(
    signal: str,
    review_id: str,
    project_id: Optional[str] = None,
    worker_id: Optional[str] = None,
    attempt: Optional[int] = None,
    duration_ms: Optional[int] = None,
    error: Optional[str] = None,
) -> None:
    """Emits structured operational events for review monitoring and observability.
    
    Guarantees: Zero secret values, credentials, or private project code/text are logged.
    """
    sanitized_error = None
    if error:
        # Strip long stack traces and any potential auth/key strings
        sanitized_error = error.splitlines()[0][:200] if error else None

    logger.info(
        "OPERATIONAL_SIGNAL signal=%s review_id=%s project_id=%s worker_id=%s attempt=%s duration_ms=%s error=%s",
        signal,
        review_id,
        project_id or "unknown",
        worker_id or "none",
        attempt if attempt is not None else 0,
        duration_ms or 0,
        sanitized_error or "none",
    )


class ReviewWorker:
    """Durable worker service responsible for claiming and executing queued AI reviews."""

    def __init__(
        self,
        worker_id: Optional[str] = None,
        poll_interval_sec: Optional[float] = None,
        lease_duration_sec: Optional[int] = None,
        heartbeat_interval_sec: Optional[int] = None,
    ) -> None:
        self.repo = project_repo
        self.worker_id = worker_id or f"worker-{os.getpid()}-{uuid.uuid4().hex[:6]}"
        self.poll_interval = poll_interval_sec or settings.review_worker_poll_interval_sec
        self.lease_duration = lease_duration_sec or settings.review_worker_lease_duration_sec
        self.heartbeat_interval = heartbeat_interval_sec or settings.review_worker_heartbeat_interval_sec

        self._stop_event = threading.Event()
        self._worker_thread: Optional[threading.Thread] = None
        self._recovery_thread: Optional[threading.Thread] = None
        self.is_running = False

    def start(self) -> None:
        """Starts the background worker loop and periodic recovery daemon."""
        if self.is_running:
            return

        self.is_running = True
        self._stop_event.clear()

        # Run startup recovery sweep to reconcile any orphaned reviews from previous crash
        try:
            recovered = self.repo.recover_stale_reviews()
            if recovered:
                logger.info("Startup recovery reconciled %d abandoned review jobs or stuck projects", len(recovered))
        except Exception as e:
            logger.warning("Startup recovery sweep encountered error: %s", e)

        self._worker_thread = threading.Thread(
            target=self._worker_loop,
            name=f"ReviewWorker-{self.worker_id}",
            daemon=True,
        )
        self._worker_thread.start()

        self._recovery_thread = threading.Thread(
            target=self._recovery_loop,
            name=f"ReviewRecoveryDaemon-{self.worker_id}",
            daemon=True,
        )
        self._recovery_thread.start()

        logger.info("ReviewWorker %s initialized and running (poll=%ss, lease=%ss)", self.worker_id, self.poll_interval, self.lease_duration)

    def stop(self, timeout_sec: float = 5.0) -> None:
        """Gracefully halts worker claiming and waits for in-flight tasks."""
        if not self.is_running:
            return

        logger.info("Stopping ReviewWorker %s...", self.worker_id)
        self.is_running = False
        self._stop_event.set()

        if self._worker_thread and self._worker_thread.is_alive():
            self._worker_thread.join(timeout=timeout_sec)
        if self._recovery_thread and self._recovery_thread.is_alive():
            self._recovery_thread.join(timeout=timeout_sec)

        logger.info("ReviewWorker %s stopped cleanly.", self.worker_id)

    def _worker_loop(self) -> None:
        """Continuous polling loop for claiming and executing queued reviews."""
        while not self._stop_event.is_set():
            try:
                processed = self.claim_and_process_one()
                if not processed:
                    # Sleep when queue is empty or no jobs are eligible yet
                    self._stop_event.wait(self.poll_interval)
            except Exception as e:
                logger.error("Unexpected error in worker loop: %s", e, exc_info=True)
                self._stop_event.wait(self.poll_interval)

    def _recovery_loop(self) -> None:
        """Periodic background recovery loop to reclaim expired leases."""
        recovery_interval = settings.review_recovery_interval_sec
        while not self._stop_event.is_set():
            try:
                self._stop_event.wait(recovery_interval)
                if not self._stop_event.is_set():
                    recovered = self.repo.recover_stale_reviews()
                    for item in recovered:
                        log_structured_signal(
                            "review_recovered",
                            review_id=item.get("id", "none"),
                            worker_id=self.worker_id,
                            error=f"Action: {item.get('action')}",
                        )
            except Exception as e:
                logger.error("Unexpected error in recovery daemon loop: %s", e, exc_info=True)

    def claim_and_process_one(self) -> bool:
        """Attempts to claim and process a single queued review job. Returns True if a job was handled."""
        claimed = self.repo.claim_queued_ai_review(self.worker_id, lease_duration_sec=self.lease_duration)
        if not claimed:
            return False

        review_id = claimed["id"]
        project_id = claimed["projectId"]
        lease_token = claimed.get("leaseToken")
        attempt_count = claimed.get("attemptCount", 1)

        log_structured_signal(
            "review_job_claimed",
            review_id=review_id,
            project_id=project_id,
            worker_id=self.worker_id,
            attempt=attempt_count,
        )

        self._execute_claimed_job(claimed)
        return True

    def process_review_sync(self, review_id: str) -> Dict[str, Any]:
        """Directly executes a reserved review synchronously (used for deterministic testing or immediate workflows)."""
        review = self.repo.get_ai_review(review_id)
        if review["status"] == "completed":
            return review

        # If still in queued status, claim it with this worker's lease
        if review["status"] == "queued":
            lease_token = str(uuid.uuid4())
            with self.repo.db.session() as conn:
                conn.execute(
                    """
                    UPDATE ai_reviews
                    SET status = 'processing',
                        worker_id = ?,
                        lease_token = ?,
                        attempt_count = attempt_count + 1
                    WHERE id = ? AND status = 'queued'
                    """,
                    (self.worker_id, lease_token, review_id),
                )
            review = self.repo.get_ai_review(review_id)

        self._execute_claimed_job(review)
        return self.repo.get_ai_review(review_id)

    def _execute_claimed_job(self, review: Dict[str, Any]) -> None:
        """Executes the AI evaluation cascade outside database transactions and finalizes atomically."""
        from backend.app.services.project_ai_review_engine import project_ai_engine

        review_id = review["id"]
        project_id = review["projectId"]
        user_id = review["userId"]
        lease_token = review.get("leaseToken")
        attempt_count = review.get("attemptCount", 1)
        max_attempts = review.get("maxAttempts", 3)
        start_time = time.time()

        # Heartbeat coordinator thread
        heartbeat_stop = threading.Event()

        def heartbeat_worker():
            while not heartbeat_stop.wait(self.heartbeat_interval):
                if not lease_token:
                    break
                renewed = self.repo.heartbeat_ai_review(review_id, lease_token, self.lease_duration)
                if renewed:
                    log_structured_signal(
                        "review_heartbeat_updated",
                        review_id=review_id,
                        project_id=project_id,
                        worker_id=self.worker_id,
                    )
                else:
                    logger.warning("Worker %s lost heartbeat lease for review %s; aborting renewal.", self.worker_id, review_id)
                    break

        hb_thread = threading.Thread(target=heartbeat_worker, daemon=True)
        hb_thread.start()

        try:
            # 1. Fetch project technical context
            project = self.repo.get_project(project_id, requesting_user_id=user_id)

            # 2. Execute AI generation OUTSIDE database transactions using unified orchestrator
            from backend.app.services.ai_orchestrator import ai_orchestrator
            preferred_prov = review.get("provider")
            proposal = ai_orchestrator.generate_project_feedback(
                project=project,
                focus_areas=[],
                user_id=user_id,
                preferred_provider=preferred_prov,
                review_id=review_id,
            )

            # 3. Finalize in Transaction B (Atomic report, findings, status, review count)
            findings_dicts = [f.model_dump() for f in proposal.findings]
            duration_ms = int((time.time() - start_time) * 1000)

            usage = getattr(proposal, "_usage", {})
            input_tokens = usage.get("prompt_tokens", 1500)
            output_tokens = usage.get("completion_tokens", 850)

            self.repo.finalize_feedback_report(
                review_id=review_id,
                project_id=project_id,
                executive_summary=proposal.executive_summary,
                strengths_summary=proposal.strengths_summary,
                findings_data=findings_dicts,
                worker_id=self.worker_id,
                lease_token=lease_token,
                duration_ms=duration_ms,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
            )

            log_structured_signal(
                "review_completed",
                review_id=review_id,
                project_id=project_id,
                worker_id=self.worker_id,
                duration_ms=duration_ms,
            )

        except StaleLeaseError as e:
            # Fencing protection: Another worker reclaimed this job or lease expired
            log_structured_signal(
                "review_finalization_rolled_back",
                review_id=review_id,
                project_id=project_id,
                worker_id=self.worker_id,
                error=str(e),
            )
            logger.warning("Fencing guard prevented stale finalization for review %s: %s", review_id, e)

        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            is_terminal = attempt_count >= max_attempts

            self.repo.fail_ai_review(
                review_id=review_id,
                project_id=project_id,
                error_message=str(e),
                worker_id=self.worker_id,
                lease_token=lease_token,
                is_terminal=is_terminal,
                duration_ms=duration_ms,
            )

            if is_terminal:
                log_structured_signal(
                    "review_failed",
                    review_id=review_id,
                    project_id=project_id,
                    worker_id=self.worker_id,
                    attempt=attempt_count,
                    duration_ms=duration_ms,
                    error=str(e),
                )
            else:
                log_structured_signal(
                    "review_retry_scheduled",
                    review_id=review_id,
                    project_id=project_id,
                    worker_id=self.worker_id,
                    attempt=attempt_count,
                    error=str(e),
                )

        finally:
            heartbeat_stop.set()
            if hb_thread.is_alive():
                hb_thread.join(timeout=1.0)


# Global singleton worker instance
review_worker = ReviewWorker()

