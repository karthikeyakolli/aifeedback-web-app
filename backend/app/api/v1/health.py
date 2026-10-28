"""Health and readiness check endpoints."""

from __future__ import annotations

from fastapi import APIRouter
from backend.app.config import settings
from backend.app.schemas.health import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def get_health() -> HealthResponse:
    """Returns the operational status of the API and its underlying subsystems."""
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
