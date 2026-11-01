"""Pydantic schemas for Posts and Feed interactions with dual camelCase/snake_case support."""

from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict, AliasChoices, field_validator


class PostBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str = Field(..., min_length=5, max_length=200, description="Post title")
    description: str = Field(..., min_length=10, description="Post body or review request description")
    postType: str = Field(
        default="product_review",
        validation_alias=AliasChoices("postType", "post_type"),
        description="Type: product_review, idea_critique, problem_discovery, general_feedback",
    )
    productUrl: Optional[str] = Field(
        None,
        validation_alias=AliasChoices("productUrl", "product_url"),
        description="Optional website or repository URL",
    )
    category: str = Field(..., description="Category, e.g., Developer Tools, Productivity, AI/ML")
    tags: List[str] = Field(default_factory=list, description="Associated topic tags")
    isAnonymous: bool = Field(
        default=False,
        validation_alias=AliasChoices("isAnonymous", "is_anonymous"),
        description="Whether author chooses anonymous public display",
    )

    @field_validator("productUrl")
    @classmethod
    def validate_product_url(cls, v: Optional[str]) -> Optional[str]:
        if v and v.strip():
            stripped = v.strip()
            if not (stripped.startswith("http://") or stripped.startswith("https://")):
                raise ValueError("productUrl must start with http:// or https://")
            return stripped
        return None


class PostCreate(PostBase):
    """Payload for creating a post."""
    pass


class PostUpdate(BaseModel):
    """Payload for updating an existing post."""
    model_config = ConfigDict(populate_by_name=True)

    title: Optional[str] = Field(None, min_length=5, max_length=200)
    description: Optional[str] = Field(None, min_length=10)
    productUrl: Optional[str] = Field(None, validation_alias=AliasChoices("productUrl", "product_url"))
    category: Optional[str] = None
    tags: Optional[List[str]] = None

    @field_validator("productUrl")
    @classmethod
    def validate_product_url(cls, v: Optional[str]) -> Optional[str]:
        if v and v.strip():
            stripped = v.strip()
            if not (stripped.startswith("http://") or stripped.startswith("https://")):
                raise ValueError("productUrl must start with http:// or https://")
            return stripped
        return None



class PostAuthor(BaseModel):
    """Public author profile information."""
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = None
    username: str
    displayName: str = Field(..., validation_alias=AliasChoices("displayName", "display_name"))
    avatarUrl: Optional[str] = Field(None, validation_alias=AliasChoices("avatarUrl", "avatar_url"))
    reputationScore: Optional[int] = Field(0, validation_alias=AliasChoices("reputationScore", "reputation_score"))
    isAnonymous: bool = Field(False, validation_alias=AliasChoices("isAnonymous", "is_anonymous"))


class PostResponse(PostBase):
    """Full serialized post response."""
    model_config = ConfigDict(populate_by_name=True)

    id: str
    author: PostAuthor
    upvotesCount: int = Field(0, validation_alias=AliasChoices("upvotesCount", "upvotes_count"))
    commentsCount: int = Field(0, validation_alias=AliasChoices("commentsCount", "comments_count"))
    hasAiAnalysis: bool = Field(False, validation_alias=AliasChoices("hasAiAnalysis", "has_ai_analysis"))
    status: str = "published"
    createdAt: str = Field(..., validation_alias=AliasChoices("createdAt", "created_at"))
    updatedAt: str = Field(..., validation_alias=AliasChoices("updatedAt", "updated_at"))
    userHasUpvoted: bool = Field(False, validation_alias=AliasChoices("userHasUpvoted", "user_has_upvoted"))
    userHasBookmarked: bool = Field(False, validation_alias=AliasChoices("userHasBookmarked", "user_has_bookmarked"))


class PostVoteResponse(BaseModel):
    """Vote toggle response."""
    upvotesCount: int
    userHasUpvoted: bool


class PostBookmarkResponse(BaseModel):
    """Bookmark toggle response."""
    userHasBookmarked: bool


class PostDocumentResponse(BaseModel):
    """Metadata of an attached project document."""
    model_config = ConfigDict(populate_by_name=True)

    id: str
    postId: str = Field(..., validation_alias=AliasChoices("postId", "post_id"))
    ownerId: str = Field(..., validation_alias=AliasChoices("ownerId", "owner_id"))
    filename: str
    fileType: str = Field(..., validation_alias=AliasChoices("fileType", "file_type"))
    fileSize: int = Field(..., validation_alias=AliasChoices("fileSize", "file_size"))
    characterCount: int = Field(0, validation_alias=AliasChoices("characterCount", "character_count"))
    contentText: Optional[str] = Field(None, validation_alias=AliasChoices("contentText", "content_text"))
    createdAt: str = Field(..., validation_alias=AliasChoices("createdAt", "created_at"))

