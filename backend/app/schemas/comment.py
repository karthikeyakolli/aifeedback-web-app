"""Pydantic schemas for Comments and Replies."""

from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field


class CommentAuthor(BaseModel):
    """Public comment author representation."""

    id: Optional[str] = None
    username: str
    display_name: str
    avatar_url: Optional[str] = None
    is_anonymous: bool = False


class CommentBase(BaseModel):
    content: str = Field(..., min_length=2, max_length=5000, description="Comment text")
    is_anonymous: bool = Field(
        default=False, description="Public anonymous attribution flag"
    )
    parent_comment_id: Optional[str] = Field(
        None, description="Parent comment UUID for threaded replies"
    )


class CommentCreate(CommentBase):
    post_id: str = Field(..., description="Target post ID")


class CommentResponse(CommentBase):
    id: str
    post_id: str
    author: CommentAuthor
    upvotes_count: int = 0
    is_helpful_flag: bool = False
    created_at: str
    updated_at: str
    user_has_upvoted: bool = False
    replies: List["CommentResponse"] = Field(default_factory=list)


CommentResponse.model_rebuild()
