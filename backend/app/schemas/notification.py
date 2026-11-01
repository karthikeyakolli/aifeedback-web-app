"""Notification schema models for user social activity."""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


class NotificationResponse(BaseModel):
    """Actionable notification response model."""

    id: str
    userId: str
    actorId: Optional[str] = None
    actorUsername: Optional[str] = None
    actorDisplayName: Optional[str] = None
    actorAvatar: Optional[str] = None
    type: str = Field(..., description="Notification type: reply, comment, ai_ready, upvote, moderation, system")
    title: str
    message: str
    linkUrl: str
    isRead: bool
    createdAt: str


class UnreadCountResponse(BaseModel):
    """Badge response with total unread notifications count."""

    unreadCount: int

