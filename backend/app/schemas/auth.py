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


class AuthenticatedPrincipal(BaseModel):
    """Canonical authenticated user principal across all API routes and services."""

    user_id: str = Field(..., description="Canonical internal user UUID")
    email: str = Field(..., description="User's primary email address")
    username: str = Field(..., description="Display handle")
    display_name: str = Field(..., description="Public display name")
    avatar_url: Optional[str] = None
    role: str = Field("authenticated", description="Primary authorization role")
    provider: str = Field("local", description="Authentication provider (supabase, local, google, github)")
    provider_subject: str = Field("", description="Subject claim from identity provider")
    email_verified: bool = Field(True, description="Whether email has been verified")
    session_id: Optional[str] = None
    roles: list[str] = Field(default_factory=lambda: ["authenticated"])


class PasswordResetRequestPayload(BaseModel):
    email: EmailStr


class PasswordResetConfirmPayload(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)


class OAuthCallbackPayload(BaseModel):
    provider: str
    code: str
    state: str


class MFAEnrollResponse(BaseModel):
    factor_id: str
    secret: str
    qr_code_uri: str


class MFAVerifyPayload(BaseModel):
    code: str = Field(..., min_length=6, max_length=8)


class MFAStatusResponse(BaseModel):
    is_enabled: bool
    factor_type: Optional[str] = None

