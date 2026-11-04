"""Phase 2 Automated Test Suite: Reliability, Concurrency, Transactions & Durable Execution.

Verifies:
1. Concurrency-Safe Review Reservation & Unique Constraints.
2. Race condition rejection: at most one active review per project under concurrent threads.
3. Transactional finalization: atomic report & findings persistence with rollback on failure.
4. Idempotent finalization: review counter increments exactly once.
5. Worker claiming with fenced lease tokens.
6. Worker heartbeat and lease renewal.
7. Stale worker fencing: old worker rejected with StaleLeaseError if lease lost.
8. Stale job recovery daemon: retries expired leases and recovers abandoned in-review projects.
"""

from __future__ import annotations

import concurrent.futures
import os
import time
import uuid
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.db.connection import db_manager
from backend.app.db.project_repository import project_repo, StaleLeaseError
from backend.app.services.review_worker import ReviewWorker, log_structured_signal
from backend.app.schemas.project import StructuredProjectFeedbackProposal, RawProjectFindingProposal

client = TestClient(app)


@pytest.fixture(autouse=True)
def ensure_offline_ai(monkeypatch):
    """Guarantees tests use deterministic grounded generator without external network calls."""
    monkeypatch.setenv("GEMINI_API_KEY", "")
    monkeypatch.setenv("OPENROUTER_API_KEY", "")
    monkeypatch.setenv("NVIDIA_API_KEY", "")
    monkeypatch.setenv("GROQ_API_KEY", "")
    from backend.app.config import settings
    settings.gemini_api_key = ""
    settings.openrouter_api_key = ""
    settings.nvidia_api_key = ""
    settings.groq_api_key = ""


@pytest.fixture
def owner_auth():
    uid = uuid.uuid4().hex[:8]
    email = f"p2_owner_{uid}@example.com"
    pwd = "SecurePassword123!"
    resp = client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": pwd, "username": f"p2_user_{uid}", "display_name": "P2 Owner"},
    )
    token = resp.json().get("accessToken") or resp.json().get("token")
    user_id = resp.json().get("user", {}).get("id")
    return {"Authorization": f"Bearer {token}", "userId": user_id}


@pytest.fixture
def other_user_auth():
    uid = uuid.uuid4().hex[:8]
    email = f"p2_other_{uid}@example.com"
    pwd = "SecurePassword123!"
    resp = client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": pwd, "username": f"p2_other_{uid}", "display_name": "P2 Other"},
    )
    token = resp.json().get("accessToken") or resp.json().get("token")
    user_id = resp.json().get("user", {}).get("id")
    return {"Authorization": f"Bearer {token}", "userId": user_id}


@pytest.fixture
def sample_project(owner_auth):
    resp = client.post(
        "/api/v1/projects",
        headers={"Authorization": owner_auth["Authorization"]},
        json={
            "name": "Reliable Core Engine",
            "tagline": "High-availability transactional distributed service",
            "category": "infrastructure",
            "description": (
                "Reliable Core Engine is a distributed event-driven engine providing guaranteed atomic transactions, "
                "concurrency-safe worker leases, and durable background job execution. Sub-millisecond persistence."
            ),
            "repository_url": "https://github.com/example/reliable-core",
        },
    )
    assert resp.status_code == 201
    return resp.json()


# =============================================================================
# A. REVIEW CONCURRENCY TESTS
# =============================================================================

def test_single_active_review_rule_and_database_constraint(owner_auth, sample_project):
    """Test 1: Only one active review can exist; second call returns the existing active review."""
    project_id = sample_project["id"]

    # 1. Start review
    r1 = client.post(
        f"/api/v1/projects/{project_id}/review/start",
        headers={"Authorization": owner_auth["Authorization"]},
        json={"sync": False},
    )
    assert r1.status_code == 200
    rev1 = r1.json()
    assert rev1["projectId"] == project_id
    assert rev1["status"] in ("queued", "processing", "completed")

    # 2. Second request for same project while first is active
    r2 = client.post(
        f"/api/v1/projects/{project_id}/review/start",
        headers={"Authorization": owner_auth["Authorization"]},
        json={"sync": False},
    )
    assert r2.status_code == 200
    rev2 = r2.json()

    # Must return the same review ID (idempotent reference to active session)
    assert rev2["id"] == rev1["id"]

    # 3. Direct DB level check: exactly 1 active review
    with db_manager.session() as conn:
        active_count = conn.execute(
            "SELECT count(*) as cnt FROM ai_reviews WHERE project_id = ? AND status IN ('queued', 'processing')",
            (project_id,),
        ).fetchone()["cnt"]
        assert active_count <= 1


def test_concurrent_simultaneous_review_requests(owner_auth, sample_project):
    """Test 2: 10 threads concurrently attempting to start a review for the same project."""
    project_id = sample_project["id"]
    results = []

    def make_start_request():
        # Create a fresh client/request in each thread
        c = TestClient(app)
        res = c.post(
            f"/api/v1/projects/{project_id}/review/start",
            headers={"Authorization": owner_auth["Authorization"]},
            json={"sync": False},
        )
        return res.status_code, res.json()

    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(make_start_request) for _ in range(10)]
        for f in concurrent.futures.as_completed(futures):
            results.append(f.result())

    # All requests should return 200 OK
    for status_code, data in results:
        assert status_code == 200
        assert data["projectId"] == project_id

    # Crucial assertion: All 10 requests received the EXACT SAME active review ID!
    returned_review_ids = {data["id"] for _, data in results}
    assert len(returned_review_ids) == 1, f"Expected 1 unique review ID, got: {returned_review_ids}"

    # Verify at most 1 active review in database
    with db_manager.session() as conn:
        active_reviews = conn.execute(
            "SELECT id FROM ai_reviews WHERE project_id = ? AND status IN ('queued', 'processing')",
            (project_id,),
        ).fetchall()
        assert len(active_reviews) <= 1


def test_independent_projects_can_run_reviews_concurrently(owner_auth):
    """Test 3: Different projects can start reviews in parallel without blocking each other."""
    # Create two projects
    p1 = client.post(
        "/api/v1/projects",
        headers={"Authorization": owner_auth["Authorization"]},
        json={"name": "Project Alpha", "tagline": "Distributed AI analysis engine", "category": "ai-ml", "description": "A valid context exceeding twenty characters for testing alpha."},
    ).json()

    p2 = client.post(
        "/api/v1/projects",
        headers={"Authorization": owner_auth["Authorization"]},
        json={"name": "Project Beta", "tagline": "Productivity and team workspace", "category": "productivity", "description": "A valid context exceeding twenty characters for testing beta."},
    ).json()

    r1 = client.post(f"/api/v1/projects/{p1['id']}/review/start", headers={"Authorization": owner_auth["Authorization"]}, json={"sync": False}).json()
    r2 = client.post(f"/api/v1/projects/{p2['id']}/review/start", headers={"Authorization": owner_auth["Authorization"]}, json={"sync": False}).json()

    assert r1["id"] != r2["id"]
    assert r1["projectId"] == p1["id"]
    assert r2["projectId"] == p2["id"]


def test_unauthorized_user_cannot_start_or_inspect_review(other_user_auth, sample_project):
    """Test 4: Non-owner cannot start review on private project."""
    res = client.post(
        f"/api/v1/projects/{sample_project['id']}/review/start",
        headers={"Authorization": other_user_auth["Authorization"]},
    )
    assert res.status_code == 403


# =============================================================================
# B. TRANSACTION & ATOMIC FINALIZATION TESTS
# =============================================================================

def test_atomic_review_finalization_success(owner_auth, sample_project):
    """Test 5: Successful finalization persists report, findings, updates status and increments counter."""
    project_id = sample_project["id"]
    user_id = owner_auth["userId"]

    # 1. Reserve review
    review = project_repo.reserve_ai_review(project_id, user_id)
    review_id = review["id"]

    # 2. Worker claims review
    worker = ReviewWorker(worker_id="test-worker-1")
    claimed = project_repo.claim_queued_ai_review(worker.worker_id, review_id=review_id)
    assert claimed["id"] == review_id
    lease_token = claimed["leaseToken"]

    # 3. Finalize
    findings = [
        {
            "title": "Finding 1",
            "severity": "high",
            "category": "architecture",
            "observation": "Observation details here",
            "evidence_quote": "Reliable Core Engine",
            "recommendation": "Recommendation here",
        }
    ]
    report = project_repo.finalize_feedback_report(
        review_id=review_id,
        project_id=project_id,
        executive_summary="Summary of findings",
        strengths_summary="Strengths summary",
        findings_data=findings,
        worker_id=worker.worker_id,
        lease_token=lease_token,
        duration_ms=150,
    )

    assert report["reviewId"] == review_id
    assert report["totalFindingsCount"] == 1

    # Verify review marked completed
    completed_review = project_repo.get_ai_review(review_id, user_id)
    assert completed_review["status"] == "completed"

    # Verify project reviews_count incremented
    proj = project_repo.get_project(project_id, user_id)
    assert proj["status"] == "reviewed"
    assert proj["reviewsCount"] >= 1


def test_idempotent_finalization_does_not_duplicate_counters_or_reports(owner_auth, sample_project):
    """Test 6: Multiple finalization calls for the same review do not duplicate reports or review counters."""
    project_id = sample_project["id"]
    user_id = owner_auth["userId"]

    review = project_repo.reserve_ai_review(project_id, user_id)
    review_id = review["id"]

    claimed = project_repo.claim_queued_ai_review("worker-idem", review_id=review_id)
    lease_token = claimed["leaseToken"]

    findings = [
        {"title": "F1", "severity": "medium", "category": "security", "observation": "O1", "evidence_quote": "Core", "recommendation": "R1"}
    ]

    # First finalization
    rep1 = project_repo.finalize_feedback_report(
        review_id=review_id,
        project_id=project_id,
        executive_summary="Summary 1",
        strengths_summary="Strengths 1",
        findings_data=findings,
        worker_id="worker-idem",
        lease_token=lease_token,
    )

    p_after_1 = project_repo.get_project(project_id, user_id)
    counter_1 = p_after_1["reviewsCount"]

    # Second finalization attempt with same review_id
    rep2 = project_repo.finalize_feedback_report(
        review_id=review_id,
        project_id=project_id,
        executive_summary="Summary 1",
        strengths_summary="Strengths 1",
        findings_data=findings,
        worker_id="worker-idem",
        lease_token=lease_token,
    )

    p_after_2 = project_repo.get_project(project_id, user_id)
    counter_2 = p_after_2["reviewsCount"]

    # Report ID must be identical and counter must NOT have incremented a second time
    assert rep1["id"] == rep2["id"]
    assert counter_1 == counter_2


def test_transaction_rollback_leaves_no_partial_findings(owner_auth, sample_project, monkeypatch):
    """Test 7: If finalization fails midway, transaction rollback leaves 0 orphaned findings."""
    project_id = sample_project["id"]
    user_id = owner_auth["userId"]

    review = project_repo.reserve_ai_review(project_id, user_id)
    review_id = review["id"]

    claimed = project_repo.claim_queued_ai_review("worker-rollback", review_id=review_id)
    lease_token = claimed["leaseToken"]

    # Intentionally pass invalid findings data that causes error during insertion
    bad_findings = [
        {"invalid_field_only": True}  # Missing required keys: title, severity, etc.
    ]

    with pytest.raises(KeyError):
        project_repo.finalize_feedback_report(
            review_id=review_id,
            project_id=project_id,
            executive_summary="Summary",
            strengths_summary="Strengths",
            findings_data=bad_findings,
            worker_id="worker-rollback",
            lease_token=lease_token,
        )

    # Verify zero reports or findings were persisted
    with db_manager.session() as conn:
        rep_count = conn.execute("SELECT count(*) as cnt FROM feedback_reports WHERE review_id = ?", (review_id,)).fetchone()["cnt"]
        assert rep_count == 0

        find_count = conn.execute("SELECT count(*) as cnt FROM feedback_findings WHERE project_id = ?", (project_id,)).fetchone()["cnt"]
        assert find_count == 0


# =============================================================================
# C. DURABLE EXECUTION, LEASES & HEARTBEAT TESTS
# =============================================================================

def test_worker_claiming_and_lease_renewal(owner_auth, sample_project):
    """Test 8: Worker claiming sets lease token and heartbeat renews lease expiration."""
    project_id = sample_project["id"]
    user_id = owner_auth["userId"]

    review = project_repo.reserve_ai_review(project_id, user_id)
    review_id = review["id"]

    worker = ReviewWorker(worker_id="worker-hb-test", lease_duration_sec=30)
    claimed = project_repo.claim_queued_ai_review(worker.worker_id, lease_duration_sec=30, review_id=review_id)
    assert claimed is not None
    assert claimed["status"] == "processing"
    assert claimed["workerId"] == "worker-hb-test"
    assert claimed["leaseToken"] is not None

    token = claimed["leaseToken"]

    # Sleep slightly and issue heartbeat
    time.sleep(0.05)
    renewed = project_repo.heartbeat_ai_review(review_id, token, lease_duration_sec=30)
    assert renewed is True

    updated_review = project_repo.get_ai_review(review_id, user_id)
    assert updated_review["lastHeartbeatAt"] is not None


def test_stale_worker_fencing_rejects_lost_lease(owner_auth, sample_project):
    """Test 9: A worker whose lease was superseded or expired is fenced and cannot finalize."""
    project_id = sample_project["id"]
    user_id = owner_auth["userId"]

    review = project_repo.reserve_ai_review(project_id, user_id)
    review_id = review["id"]

    # Worker A claims job
    claimed_a = project_repo.claim_queued_ai_review("worker-A", lease_duration_sec=1)
    token_a = claimed_a["leaseToken"]

    # Simulate Worker B taking over (e.g. lease expired and re-queued, then Worker B claimed)
    with db_manager.session() as conn:
        conn.execute(
            "UPDATE ai_reviews SET worker_id = 'worker-B', lease_token = 'token-B' WHERE id = ?",
            (review_id,),
        )

    # Worker A tries to finalize with old token -> MUST raise StaleLeaseError
    findings = [{"title": "F", "severity": "low", "category": "ux", "observation": "Obs", "evidence_quote": "Core", "recommendation": "Rec"}]
    with pytest.raises(StaleLeaseError) as exc_info:
        project_repo.finalize_feedback_report(
            review_id=review_id,
            project_id=project_id,
            executive_summary="Sum",
            strengths_summary="Str",
            findings_data=findings,
            worker_id="worker-A",
            lease_token=token_a,
        )
    assert "Worker lease token mismatch" in str(exc_info.value) or "cannot finalize" in str(exc_info.value)


# =============================================================================
# D. STALE JOB RECOVERY TESTS
# =============================================================================

def test_stale_job_recovery_and_backoff_retry(owner_auth, sample_project):
    """Test 10: Abandoned review with expired lease is re-queued with attempt increment."""
    project_id = sample_project["id"]
    user_id = owner_auth["userId"]

    review = project_repo.reserve_ai_review(project_id, user_id)
    review_id = review["id"]

    # Simulate review stuck in processing with an expired lease (1 hour ago)
    past_iso = "2025-01-01T00:00:00+00:00"
    with db_manager.session() as conn:
        conn.execute(
            """
            UPDATE ai_reviews
            SET status = 'processing', worker_id = 'crashed-worker',
                lease_token = 'tok', lease_expires_at = ?, attempt_count = 1, max_attempts = 3
            WHERE id = ?
            """,
            (past_iso, review_id),
        )

    # Run recovery daemon sweep
    recovered = project_repo.recover_stale_reviews()
    assert any(r["id"] == review_id and r["action"] == "requeued" for r in recovered)

    # Review should now be re-queued with worker/lease cleared and scheduled_at set
    updated = project_repo.get_ai_review(review_id, user_id)
    assert updated["status"] == "queued"
    assert updated["workerId"] is None


def test_stale_job_terminal_failure_exhausts_retries_and_resets_project(owner_auth, sample_project):
    """Test 11: When attempts reach max_attempts, recovery marks review failed and resets project to ready."""
    project_id = sample_project["id"]
    user_id = owner_auth["userId"]

    review = project_repo.reserve_ai_review(project_id, user_id)
    review_id = review["id"]

    # Set project status to in_review
    with db_manager.session() as conn:
        conn.execute("UPDATE projects SET status = 'in_review' WHERE id = ?", (project_id,))

    # Set review to max_attempts with expired lease
    past_iso = "2025-01-01T00:00:00+00:00"
    with db_manager.session() as conn:
        conn.execute(
            """
            UPDATE ai_reviews
            SET status = 'processing', worker_id = 'crashed-worker',
                lease_expires_at = ?, attempt_count = 3, max_attempts = 3
            WHERE id = ?
            """,
            (past_iso, review_id),
        )

    # Run recovery sweep
    recovered = project_repo.recover_stale_reviews()
    assert any(r["id"] == review_id and r["action"] == "terminal_fail" for r in recovered)

    # Review marked failed
    updated_rev = project_repo.get_ai_review(review_id, user_id)
    assert updated_rev["status"] == "failed"

    # Project returned to 'ready'
    proj = project_repo.get_project(project_id, user_id)
    assert proj["status"] == "ready"


def test_orphan_in_review_project_recovery(owner_auth, sample_project):
    """Test 12: Projects stuck in in_review without active review sessions are restored to ready."""
    project_id = sample_project["id"]
    user_id = owner_auth["userId"]

    with db_manager.session() as conn:
        # Set project to in_review and delete any active reviews
        conn.execute("UPDATE projects SET status = 'in_review' WHERE id = ?", (project_id,))
        conn.execute("DELETE FROM ai_reviews WHERE project_id = ?", (project_id,))

    # Recovery sweep
    recovered = project_repo.recover_stale_reviews()
    assert any(r.get("projectId") == project_id and r["action"] == "reset_project_status" for r in recovered)

    proj = project_repo.get_project(project_id, user_id)
    assert proj["status"] == "ready"
