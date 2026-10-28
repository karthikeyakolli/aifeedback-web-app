"""Pydantic schemas for Posts and Feed interactions."""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, HttpUrl


class PostBase(BaseModel):
    title: str = Field(..., min_length=5, max_length=150, description="Post title")
    description: str = Field(..., min_length=10, description="Post body or review request description")
    post_type: str = Field(
        default="product_review",
        description="Type: product_review, idea_critique, problem_discovery, general_feedback",
    )
    product_url: Optional[str] = Field(None, description="Optional website or repository URL")
    category: str = Field(..., description="Category, e.g., Developer Tools, Productivity, AI/ML")
    tags: List[str] = Field(default_factory=list, description="Associated topic tags")
    is_anonymous: bool = Field(
        default=False, description="Whether author chooses anonymous public display"
    )


class PostCreate(PostBase):
    """Payload for creating a post."""
    pass


class PostUpdate(BaseModel):
    """Payload for updating an existing post."""

    title: Optional[str] = Field(None, min_length=5, max_length=150)
    description: Optional[str] = Field(None, min_length=10)
    product_url: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None


class PostAuthor(BaseModel):
    """Public author profile information."""

    id: Optional[str] = None
    username: str
    display_name: str
    avatar_url: Optional[str] = None
    is_anonymous: bool = False


class PostResponse(PostBase):
    """Full serialized post response."""

    id: str
    author: PostAuthor
    upvotes_count: int = 0
    comments_count: int = 0
    has_ai_analysis: bool = False
    status: str = "published"
    created_at: str
    updated_at: str
    user_has_upvoted: bool = False
    user_has_bookmarked: bool = False
