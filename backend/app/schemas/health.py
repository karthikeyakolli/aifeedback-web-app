"""Health response schemas."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, Any
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """System health check payload."""

    status: str = Field(default="healthy", description="Service status (healthy/degraded)")
    version: str = Field(..., description="Application version")
    environment: str = Field(..., description="Running environment")
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO8601 UTC timestamp",
    )
    services: Dict[str, Any] = Field(
        default_factory=lambda: {
            "api": "operational",
            "database": "configured",
            "ai_engine": "ready",
        },
        description="Subsystem status map",
    )
