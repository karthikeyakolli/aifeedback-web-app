"""User notification endpoints for real-time community social translucence."""

from __future__ import annotations

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from backend.app.schemas.notification import NotificationResponse, UnreadCountResponse
from backend.app.services.auth_service import get_current_user_required
from backend.app.db.repository import community_repo

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=List[NotificationResponse])
async def get_notifications(
    unread_only: bool = Query(False, description="Filter for unread notifications only"),
    limit: int = Query(50, ge=1, le=100, description="Max notifications to retrieve"),
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> List[NotificationResponse]:
    """Retrieves chronological notification items for the authenticated user."""
    items = community_repo.list_notifications(
        user_id=user["sub"],
        unread_only=unread_only,
        limit=limit,
    )
    return [NotificationResponse(**item) for item in items]


@router.get("/unread-count", response_model=UnreadCountResponse)
async def get_unread_count(
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> UnreadCountResponse:
    """Retrieves count of unread notifications for badge presentation."""
    count = community_repo.get_unread_notifications_count(user_id=user["sub"])
    return UnreadCountResponse(unreadCount=count)


@router.patch("/{notification_id}/read", response_model=Dict[str, Any])
async def mark_read(
    notification_id: str,
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> Dict[str, Any]:
    """Marks a single notification item as read."""
    success = community_repo.mark_notification_read(
        notification_id=notification_id,
        user_id=user["sub"],
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found or access denied.",
        )
    return {"id": notification_id, "isRead": True}


@router.post("/read-all", response_model=Dict[str, Any])
async def mark_all_read(
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> Dict[str, Any]:
    """Marks all pending notifications as read."""
    count = community_repo.mark_all_notifications_read(user_id=user["sub"])
    return {"markedCount": count, "isRead": True}

