"""AI Intelligence and Research endpoints (Phase 1 structure, Phase 3+ engine)."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from backend.app.schemas.ai import AIAnalysisResponse

router = APIRouter(prefix="/ai", tags=["AI Research Intelligence"])


@router.get("/{post_id}/insights", response_model=AIAnalysisResponse)
async def get_post_insights(post_id: str) -> AIAnalysisResponse:
    """Retrieves AI research insights for the given post."""
    raise HTTPException(
        status_code=404,
        detail="No AI analysis run found. Analysis engine activates in Phase 3.",
    )
