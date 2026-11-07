"""Comments and discussion endpoints with real persistence and threaded replies."""

from __future__ import annotations

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from backend.app.schemas.comment import (
    CommentResponse,
    CommentCreate,
    CommentUpdate,
    CommentVoteResponse,
    PublicCommentRecent,
)
from backend.app.services.auth_service import (
    get_current_user_required,
    get_current_user_optional,
)
from backend.app.db.repository import community_repo

router = APIRouter(prefix="/comments", tags=["Comments"])


@router.get("/recent", response_model=List[PublicCommentRecent])
async def get_recent_public_comments(
    limit: int = 25,
    project_id: Optional[str] = None,
    sort: str = "popular",
    user: Optional[Dict[str, Any]] = Depends(get_current_user_optional),
) -> List[PublicCommentRecent]:
    """Retrieves recent genuine public comments across projects for Community Voices and Global Discussion Lounge."""
    current_user_id = user["sub"] if user else None
    comments = community_repo.list_recent_public_comments(
        limit=min(limit, 100),
        project_id=project_id,
        sort=sort,
        current_user_id=current_user_id,
        include_anonymous=True,
    )
    return [PublicCommentRecent(**c) for c in comments]


@router.get("/post/{post_id}", response_model=List[CommentResponse])
async def get_post_comments(
    post_id: str,
    user: Optional[Dict[str, Any]] = Depends(get_current_user_optional),
) -> List[CommentResponse]:
    """Retrieves threaded comments and nested replies for a post."""
    current_user_id = user["sub"] if user else None
    comments = community_repo.list_comments_for_post(post_id, current_user_id=current_user_id)
    return [CommentResponse(**c) for c in comments]


@router.post("", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    payload: CommentCreate,
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> CommentResponse:
    """Creates a top-level comment or threaded reply."""
    if not payload.postId:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="postId is required to post a comment.",
        )

    comment = community_repo.create_comment(
        post_id=payload.postId,
        author_id=user["sub"],
        content=payload.content,
        is_anonymous=payload.isAnonymous,
        parent_comment_id=payload.parentCommentId,
    )
    return CommentResponse(**comment)


@router.put("/{comment_id}", response_model=CommentResponse)
async def update_comment(
    comment_id: str,
    payload: CommentUpdate,
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> CommentResponse:
    """Updates an owned comment."""
    updated = community_repo.update_comment(
        comment_id=comment_id,
        author_id=user["sub"],
        content=payload.content,
    )
    return CommentResponse(**updated)


@router.delete("/{comment_id}")
async def delete_comment(
    comment_id: str,
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> Dict[str, str]:
    """Deletes an owned comment and updates parent post counter."""
    community_repo.delete_comment(comment_id=comment_id, author_id=user["sub"])
    return {"message": "Comment deleted successfully."}


@router.post("/{comment_id}/vote", response_model=CommentVoteResponse)
async def vote_comment(
    comment_id: str,
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> CommentVoteResponse:
    """Toggles upvote on a comment."""
    res = community_repo.toggle_comment_vote(
        comment_id=comment_id,
        user_id=user["sub"],
        vote_type=1,
    )
    return CommentVoteResponse(**res)
