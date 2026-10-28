"""Posts and feed endpoints with full persistence and authorization."""

from __future__ import annotations

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from backend.app.schemas.post import (
    PostResponse,
    PostCreate,
    PostUpdate,
    PostVoteResponse,
    PostBookmarkResponse,
)
from backend.app.services.auth_service import (
    get_current_user_required,
    get_current_user_optional,
)
from backend.app.db.repository import community_repo

router = APIRouter(prefix="/posts", tags=["Posts"])


@router.get("", response_model=List[PostResponse])
async def list_posts(
    category: Optional[str] = Query(None, description="Filter by category"),
    tag: Optional[str] = Query(None, description="Filter by topic tag"),
    sort: str = Query("trending", description="Sort by trending, recent, or comments"),
    search: Optional[str] = Query(None, description="Search keyword in title or description"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user: Optional[Dict[str, Any]] = Depends(get_current_user_optional),
) -> List[PostResponse]:
    """Retrieves published posts for community discovery with pagination and filters."""
    current_user_id = user["sub"] if user else None
    posts = community_repo.list_posts(
        category=category,
        tag=tag,
        sort=sort,
        search=search,
        limit=limit,
        offset=offset,
        current_user_id=current_user_id,
    )
    return [PostResponse(**p) for p in posts]


@router.get("/saved", response_model=List[PostResponse])
async def get_saved_posts(
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> List[PostResponse]:
    """Retrieves the authenticated user's bookmarked posts."""
    posts = community_repo.list_saved_posts(user_id=user["sub"])
    return [PostResponse(**p) for p in posts]


@router.get("/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: str,
    user: Optional[Dict[str, Any]] = Depends(get_current_user_optional),
) -> PostResponse:
    """Retrieves a single published post with serialized author and engagement status."""
    current_user_id = user["sub"] if user else None
    post = community_repo.get_post(post_id, current_user_id=current_user_id)
    return PostResponse(**post)


@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    payload: PostCreate,
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> PostResponse:
    """Publishes a new review request. Requires authenticated account."""
    data = payload.model_dump()
    post = community_repo.create_post(author_id=user["sub"], data=data)
    return PostResponse(**post)


@router.put("/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: str,
    payload: PostUpdate,
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> PostResponse:
    """Updates an owned post. Author identity is verified on the backend."""
    data = payload.model_dump(exclude_unset=True)
    post = community_repo.update_post(post_id=post_id, author_id=user["sub"], data=data)
    return PostResponse(**post)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: str,
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> None:
    """Deletes an owned post. Author identity is verified on the backend."""
    community_repo.delete_post(post_id=post_id, author_id=user["sub"])


@router.post("/{post_id}/vote", response_model=PostVoteResponse)
async def vote_post(
    post_id: str,
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> PostVoteResponse:
    """Toggles upvote on a post. Database uniqueness prevents duplicate votes."""
    result = community_repo.toggle_post_vote(post_id=post_id, user_id=user["sub"], vote_type=1)
    return PostVoteResponse(**result)


@router.post("/{post_id}/bookmark", response_model=PostBookmarkResponse)
async def bookmark_post(
    post_id: str,
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> PostBookmarkResponse:
    """Toggles bookmark on a post."""
    result = community_repo.toggle_bookmark(post_id=post_id, user_id=user["sub"])
    return PostBookmarkResponse(**result)
