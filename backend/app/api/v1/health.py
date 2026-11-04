"""Health and readiness check endpoints."""

from __future__ import annotations

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from backend.app.config import settings
from backend.app.schemas.health import HealthResponse
from backend.app.db.connection import db_manager

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def get_health() -> HealthResponse:
    """Returns the operational status of the API and its underlying subsystems (Liveness Probe)."""
    return HealthResponse(
        status="healthy",
        version=settings.app_version,
        environment=settings.environment,
        services={
            "api": "operational",
            "cors": "configured",
            "version": settings.app_version,
        },
    )


@router.get("/health/ready", response_model=HealthResponse)
async def get_readiness():
    """Readiness probe verifying database connectivity and AI review queue responsiveness."""
    is_db_healthy = db_manager.ping()
    db_status = "operational" if is_db_healthy else "disconnected"

    worker_status = "operational"
    queued_jobs = 0
    try:
        from backend.app.db.project_repository import project_repo
        with project_repo.db.session() as conn:
            row = conn.execute("SELECT COUNT(*) as cnt FROM ai_reviews WHERE status = 'queued'").fetchone()
            if row:
                queued_jobs = row["cnt"] if isinstance(row, dict) else row[0]
        worker_status = f"ready (queued_jobs: {queued_jobs})"
    except Exception as exc:
        worker_status = f"degraded: {str(exc)}"

    overall_status = "healthy" if is_db_healthy else "degraded"
    payload = HealthResponse(
        status=overall_status,
        version=settings.app_version,
        environment=settings.environment,
        services={
            "api": "operational",
            "database": db_status,
            "worker_queue": worker_status,
            "version": settings.app_version,
        },
    )

    if not is_db_healthy:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=payload.model_dump(),
        )

    return payload
