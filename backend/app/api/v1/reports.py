"""Content report and moderation endpoints."""

from __future__ import annotations

from typing import Dict, Any
from fastapi import APIRouter, Depends, status
from backend.app.schemas.report import ReportCreateRequest, ReportResponse
from backend.app.services.auth_service import get_current_user_required
from backend.app.db.repository import community_repo

router = APIRouter(prefix="/reports", tags=["Moderation & Reports"])


@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def submit_report(
    payload: ReportCreateRequest,
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> ReportResponse:
    """Submits a moderation report for a post or comment."""
    res = community_repo.create_report(
        reporter_id=user["sub"],
        target_type=payload.targetType,
        target_id=payload.targetId,
        reason=payload.reason,
        description=payload.description or "",
    )
    return ReportResponse(**res)
