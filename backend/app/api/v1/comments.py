"""Comments and discussion endpoints (Phase 1 structure, Phase 2 persistence)."""

from __future__ import annotations

from typing import List
from fastapi import APIRouter
from backend.app.schemas.comment import CommentResponse

router = APIRouter(prefix="/comments", tags=["Comments"])


@router.get("/post/{post_id}", response_model=List[CommentResponse])
async def get_post_comments(post_id: str) -> List[CommentResponse]:
    """Retrieves threaded comments for a post."""
    return []
