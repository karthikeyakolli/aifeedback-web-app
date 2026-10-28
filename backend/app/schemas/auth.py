"""Authentication Pydantic schemas."""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserRegisterRequest(BaseModel):
    """Payload for user registration."""

    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., min_length=8, description="Password (at least 8 characters)")
    username: str = Field(..., min_length=3, max_length=30, description="Unique username")
    display_name: str = Field(..., min_length=2, max_length=50, description="Public display name")
    bio: Optional[str] = Field("", max_length=300)
    avatar_url: Optional[str] = None


class UserLoginRequest(BaseModel):
    """Payload for login."""

    email: EmailStr
    password: str


class UserProfileResponse(BaseModel):
    """User profile response."""

    id: str
    username: str
    displayName: str
    email: Optional[str] = None
    avatarUrl: Optional[str] = None
    bio: Optional[str] = None
    reputationScore: int = 0
    isModerator: bool = False
    joinedAt: str


class AuthTokenResponse(BaseModel):
    """Authentication token response with user profile."""

    accessToken: str
    tokenType: str = "Bearer"
    user: UserProfileResponse


class PublicUserProfileResponse(BaseModel):
    """Public profile representation omitting private email and anonymous posts."""

    id: str
    username: str
    displayName: str
    avatarUrl: Optional[str] = None
    bio: Optional[str] = None
    reputationScore: int = 0
    joinedAt: str
    posts: list = Field(default_factory=list)

