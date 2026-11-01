"""Content report and moderation endpoints."""

from __future__ import annotations

from typing import Dict, Any, List
from fastapi import APIRouter, Depends, status, HTTPException
from backend.app.schemas.report import (
    ReportCreateRequest,
    ReportResponse,
    ReportResolveRequest,
    PostLockRequest,
)
from backend.app.services.auth_service import get_current_user_required
from backend.app.db.repository import community_repo

router = APIRouter(prefix="/reports", tags=["Moderation & Reports"])


@router.get("", response_model=List[Dict[str, Any]])
async def list_reports(
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> List[Dict[str, Any]]:
    """Retrieves all submitted moderation reports. Restricted strictly to moderators."""
    profile = community_repo.get_profile(user["sub"])
    if not profile.get("isModerator"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden. Access to moderation reports is restricted to moderators.",
        )
    return community_repo.list_reports()


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


@router.patch("/{report_id}/resolve", response_model=Dict[str, Any])
async def resolve_report(
    report_id: str,
    payload: ReportResolveRequest,
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> Dict[str, Any]:
    """Resolves a moderation report (hide, dismiss, warn, restore). Restricted to moderators."""
    profile = community_repo.get_profile(user["sub"])
    if not profile.get("isModerator"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden. Only moderators can resolve reports.",
        )
    return community_repo.resolve_report(
        report_id=report_id,
        action=payload.action,
        notes=payload.notes or "",
        moderator_id=user["sub"],
    )


@router.patch("/posts/{post_id}/lock", response_model=Dict[str, Any])
async def toggle_post_lock(
    post_id: str,
    payload: PostLockRequest,
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> Dict[str, Any]:
    """Locks or unlocks a discussion post to prevent comment spam or flame wars. Restricted to moderators."""
    profile = community_repo.get_profile(user["sub"])
    if not profile.get("isModerator"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden. Only moderators can toggle discussion lock status.",
        )
    return community_repo.toggle_post_lock(
        post_id=post_id,
        locked=payload.locked,
        moderator_id=user["sub"],
    )

