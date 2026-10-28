"""Authentication and user session routes."""

from __future__ import annotations

from typing import Dict, Any
from fastapi import APIRouter, Depends, Header
from backend.app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    AuthTokenResponse,
    UserProfileResponse,
)
from backend.app.services.auth_service import (
    create_access_token,
    get_current_user_required,
)
from backend.app.db.repository import community_repo

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=AuthTokenResponse)
async def signup(payload: UserRegisterRequest) -> AuthTokenResponse:
    """Registers a new account and returns JWT session token."""
    user_id, profile = community_repo.create_user(
        email=payload.email,
        password=payload.password,
        username=payload.username,
        display_name=payload.display_name,
        bio=payload.bio or "",
        avatar_url=payload.avatar_url,
    )
    token = create_access_token(user_id=user_id, email=payload.email, username=payload.username)
    return AuthTokenResponse(
        accessToken=token,
        tokenType="Bearer",
        user=UserProfileResponse(**profile),
    )


@router.post("/login", response_model=AuthTokenResponse)
async def login(payload: UserLoginRequest) -> AuthTokenResponse:
    """Authenticates existing user and returns JWT session token."""
    profile = community_repo.authenticate_user(email=payload.email, password=payload.password)
    token = create_access_token(
        user_id=profile["id"], email=payload.email, username=profile["username"]
    )
    return AuthTokenResponse(
        accessToken=token,
        tokenType="Bearer",
        user=UserProfileResponse(**profile),
    )


@router.get("/me", response_model=UserProfileResponse)
async def get_me(user: Dict[str, Any] = Depends(get_current_user_required)) -> UserProfileResponse:
    """Retrieves authenticated user profile from verified JWT token."""
    profile = community_repo.get_profile(user["sub"])
    return UserProfileResponse(**profile)


@router.post("/logout")
async def logout(user: Dict[str, Any] = Depends(get_current_user_required)) -> Dict[str, str]:
    """Logs out user and invalidates client session."""
    return {"message": "Logged out successfully."}
