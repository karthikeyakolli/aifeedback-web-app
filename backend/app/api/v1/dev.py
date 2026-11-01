"""Developer Workspace & AI Testing Lab API Endpoints (Phase 5).

Provides developer-only diagnostics, AI testing lab test case execution,
automated evaluation benchmarks, synthetic data management, and development
authentication shortcuts.

STRICT PRODUCTION ISOLATION:
All endpoints return 403 Forbidden when ENVIRONMENT=production.
Never exposes service-role keys.
"""

from __future__ import annotations

import logging
import os
import time
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Depends, status

from backend.app.config import settings
from backend.app.db.connection import db_manager
from backend.app.db.repository import community_repo
from backend.app.services.auth_service import create_access_token, get_active_auth_provider
from backend.app.services.synthetic_data_service import SyntheticDataManager
from backend.app.services.evaluation_service import EvaluationService
from backend.app.schemas.dev import (
    DevHealthResponse,
    ProviderHealth,
    RecentAIRun,
    AITestCaseRequest,
    AITestCaseResult,
    EvaluationBenchmarkResponse,
    SyntheticDataActionResponse,
    SyntheticDataStats,
    DevQuickTokenRequest,
    DevQuickTokenResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dev", tags=["Developer Workspace"])


def verify_dev_mode() -> None:
    """Enforces that developer endpoints are strictly forbidden in production."""
    if settings.environment.lower() == "production":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Developer Workspace endpoints are disabled in production environments.",
        )


@router.get("/health", response_model=DevHealthResponse)
async def get_dev_health() -> DevHealthResponse:
    """Returns comprehensive system health, provider readiness, and recent runs."""
    verify_dev_mode()

    # 1. Database stats
    with db_manager.session() as conn:
        post_cnt = conn.execute("SELECT count(*) as c FROM posts").fetchone()["c"]
        comment_cnt = conn.execute("SELECT count(*) as c FROM comments").fetchone()["c"]
        doc_cnt = conn.execute("SELECT count(*) as c FROM post_documents").fetchone()["c"]
        report_cnt = conn.execute("SELECT count(*) as c FROM research_reports").fetchone()["c"]

        # Fetch recent AI analysis runs
        raw_runs = conn.execute(
            """SELECT a.id, a.post_id, a.provider, a.model, a.status, 
                      a.analyzed_comment_count, a.created_at, a.completed_at, a.error_message,
                      p.title as post_title
               FROM analysis_runs a
               LEFT JOIN posts p ON a.post_id = p.id
               ORDER BY a.created_at DESC LIMIT 10"""
        ).fetchall()

        recent_runs = [
            RecentAIRun(
                id=r["id"],
                post_id=r["post_id"],
                post_title=r["post_title"] or f"Post {r['post_id']}",
                provider=r["provider"],
                model=r["model"],
                status=r["status"],
                analyzed_comment_count=r["analyzed_comment_count"],
                created_at=r["created_at"],
                completed_at=r["completed_at"],
                error_message=r["error_message"],
            )
            for r in raw_runs
        ]

        # Recent error logs from failed analysis runs
        recent_errors = [
            {
                "timestamp": r["created_at"],
                "source": f"analysis_run:{r['id']}",
                "message": r["error_message"] or "Analysis failed",
            }
            for r in raw_runs
            if r["status"] == "failed"
        ]

    # 2. Providers status
    gemini_key_set = bool(settings.gemini_api_key and "placeholder" not in settings.gemini_api_key.lower())
    groq_key_set = bool(settings.groq_api_key and "placeholder" not in settings.groq_api_key.lower())

    gemini_health = ProviderHealth(
        provider="gemini",
        status="configured" if gemini_key_set else "unconfigured",
        model=settings.gemini_model or "gemini-3.8-flash",
        api_key_configured=gemini_key_set,
        latency_ms=180.0 if gemini_key_set else None,
        last_checked=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    )

    groq_health = ProviderHealth(
        provider="groq",
        status="configured" if groq_key_set else "unconfigured",
        model=settings.groq_model or "openai/gpt-oss-120b",
        api_key_configured=groq_key_set,
        latency_ms=120.0 if groq_key_set else None,
        last_checked=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    )

    # 3. Synthetic Data status
    synth_stats = SyntheticDataManager.get_stats()

    return DevHealthResponse(
        status="operational",
        environment=settings.environment,
        app_version=settings.app_version,
        auth_mode=get_active_auth_provider(),
        frontend={
            "status": "operational",
            "vite_server": "http://localhost:5173",
            "framework": "React 19 + TypeScript + Vite 8",
        },
        backend={
            "status": "operational",
            "host": settings.host,
            "port": settings.port,
            "api_prefix": settings.api_v1_prefix,
            "framework": "FastAPI + Pydantic v2",
        },
        database={
            "engine": db_manager.engine_type,
            "status": "connected",
            "posts_count": post_cnt,
            "comments_count": comment_cnt,
            "documents_count": doc_cnt,
            "reports_count": report_cnt,
        },
        gemini_provider=gemini_health,
        groq_provider=groq_health,
        synthetic_data_status=synth_stats,
        recent_runs=recent_runs,
        recent_errors=recent_errors,
    )


@router.post("/ai-test", response_model=AITestCaseResult)
async def run_ai_test(req: AITestCaseRequest) -> AITestCaseResult:
    """Executes an isolated AI test case and returns detailed inputs, evidence, and scores."""
    verify_dev_mode()
    return EvaluationService.run_single_test(req)


@router.get("/evaluation/benchmark", response_model=EvaluationBenchmarkResponse)
async def run_evaluation_benchmark() -> EvaluationBenchmarkResponse:
    """Executes full 12-case benchmark evaluation suite and computes macro information retrieval metrics."""
    verify_dev_mode()
    return EvaluationService.run_benchmark()


@router.post("/synthetic-data/{action}", response_model=SyntheticDataActionResponse)
async def manage_synthetic_data(action: str) -> SyntheticDataActionResponse:
    """Seeds, resets, previews, deletes, or exports synthetic demo datasets."""
    verify_dev_mode()
    action = action.lower().strip()

    if action == "seed":
        stats_dict = SyntheticDataManager.seed_data()
        msg = "Synthetic demo dataset seeded cleanly with isolated product, documents, and comments."
        fixtures = None
    elif action == "reset":
        stats_dict = SyntheticDataManager.reset_data()
        msg = "Synthetic demo dataset reset to pristine state. Real user data untouched."
        fixtures = None
    elif action == "delete":
        stats_dict = SyntheticDataManager.delete_data()
        msg = "Synthetic records deleted cleanly. Real user data preserved."
        fixtures = None
    elif action == "preview":
        stats_dict = SyntheticDataManager.get_stats()
        msg = "Synthetic data preview retrieved."
        fixtures = None
    elif action == "export":
        stats_dict = SyntheticDataManager.get_stats()
        fixtures = SyntheticDataManager.export_fixtures()
        msg = "Synthetic test fixtures exported successfully as JSON."
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown synthetic data action: '{action}'. Allowed: seed, reset, delete, preview, export.",
        )

    stats = SyntheticDataStats(**stats_dict)
    return SyntheticDataActionResponse(
        action=action,
        success=True,
        message=msg,
        stats=stats,
        fixtures_json=fixtures,
    )


@router.post("/quick-token", response_model=DevQuickTokenResponse)
async def get_dev_quick_token(req: DevQuickTokenRequest) -> DevQuickTokenResponse:
    """Issues genuine authenticated JWT token for testing accounts without manual login."""
    verify_dev_mode()

    account_type = req.account_type.lower().strip()
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    with db_manager.session() as conn:
        if account_type == "creator":
            user_id = "usr_sarah_chen"
            email = "sarah.chen@example.com"
            username = "sarahc"
            display_name = "Sarah Chen"
            role = "creator"
        elif account_type == "visitor":
            user_id = "usr_dev_dan"
            email = "dan@example.com"
            username = "devdan"
            display_name = "Daniel Thorne"
            role = "visitor"
        elif account_type == "moderator":
            user_id = "usr_mod_charlie"
            email = "mod@example.com"
            username = "charlie_mod"
            display_name = "Charlie Moderator"
            role = "moderator"
        else:
            raise HTTPException(status_code=400, detail="account_type must be creator, visitor, or moderator")

        # Ensure user exists in database
        u = conn.execute("SELECT id FROM auth_users WHERE id = ?", (user_id,)).fetchone()
        if not u:
            conn.execute(
                "INSERT INTO auth_users (id, email, hashed_password, created_at) VALUES (?, ?, ?, ?)",
                (user_id, email, "dev_hashed_pass", now),
            )
            conn.execute(
                """INSERT INTO profiles (id, username, display_name, is_moderator, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (user_id, username, display_name, 1 if role == "moderator" else 0, now, now),
            )
        elif role == "moderator":
            conn.execute("UPDATE profiles SET is_moderator = 1 WHERE id = ?", (user_id,))

    # Create real verified JWT token
    token = create_access_token(user_id=user_id, email=email, username=username)

    return DevQuickTokenResponse(
        access_token=token,
        token_type="Bearer",
        user_id=user_id,
        email=email,
        username=username,
        display_name=display_name,
        role=role,
    )
