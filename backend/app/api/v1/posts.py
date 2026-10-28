"""Posts and feed endpoints (Phase 1 structure, Phase 2 persistence)."""

from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException
from backend.app.schemas.post import PostResponse, PostCreate

router = APIRouter(prefix="/posts", tags=["Posts"])


@router.get("", response_model=List[PostResponse])
async def list_posts(
    category: Optional[str] = Query(None, description="Filter by category"),
    sort: str = Query("trending", description="Sort by trending, recent, or top"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> List[PostResponse]:
    """Retrieves published posts for community discovery (Phase 1 fixture structure)."""
    # In Phase 1, endpoints return compliant structures; Phase 2 attaches database persistence
    return []


@router.get("/{post_id}", response_model=PostResponse)
async def get_post(post_id: str) -> PostResponse:
    """Retrieves full post details."""
    raise HTTPException(status_code=404, detail=f"Post '{post_id}' not found in Phase 1 shell")
