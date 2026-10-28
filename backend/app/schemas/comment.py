"""Pydantic schemas for Comments and Replies with dual camelCase/snake_case support."""

from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict, AliasChoices


class CommentAuthor(BaseModel):
    """Public comment author representation."""
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = None
    username: str
    displayName: str = Field(..., validation_alias=AliasChoices("displayName", "display_name"))
    avatarUrl: Optional[str] = Field(None, validation_alias=AliasChoices("avatarUrl", "avatar_url"))
    reputationScore: Optional[int] = Field(0, validation_alias=AliasChoices("reputationScore", "reputation_score"))
    isAnonymous: bool = Field(False, validation_alias=AliasChoices("isAnonymous", "is_anonymous"))


class CommentBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    content: str = Field(..., min_length=2, max_length=10000, description="Comment text")
    isAnonymous: bool = Field(
        default=False,
        validation_alias=AliasChoices("isAnonymous", "is_anonymous"),
        description="Public anonymous attribution flag",
    )
    parentCommentId: Optional[str] = Field(
        None,
        validation_alias=AliasChoices("parentCommentId", "parent_comment_id"),
        description="Parent comment UUID for threaded replies",
    )


class CommentCreate(CommentBase):
    postId: Optional[str] = Field(
        None,
        validation_alias=AliasChoices("postId", "post_id"),
        description="Target post ID",
    )


class CommentUpdate(BaseModel):
    content: str = Field(..., min_length=2, max_length=10000)


class CommentResponse(CommentBase):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    postId: str = Field(..., validation_alias=AliasChoices("postId", "post_id"))
    author: CommentAuthor
    upvotesCount: int = Field(0, validation_alias=AliasChoices("upvotesCount", "upvotes_count"))
    isHelpfulFlag: bool = Field(False, validation_alias=AliasChoices("isHelpfulFlag", "is_helpful_flag"))
    createdAt: str = Field(..., validation_alias=AliasChoices("createdAt", "created_at"))
    updatedAt: str = Field(..., validation_alias=AliasChoices("updatedAt", "updated_at"))
    userHasUpvoted: bool = Field(False, validation_alias=AliasChoices("userHasUpvoted", "user_has_upvoted"))
    replies: List["CommentResponse"] = Field(default_factory=list)


class CommentVoteResponse(BaseModel):
    """Vote toggle response for comment."""
    upvotesCount: int
    userHasUpvoted: bool


CommentResponse.model_rebuild()
