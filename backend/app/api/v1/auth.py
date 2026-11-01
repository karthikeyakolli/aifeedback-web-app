"""Authentication and user session routes."""

from __future__ import annotations

from typing import Dict, Any
from fastapi import APIRouter, Depends, Header
from backend.app.config import settings
from backend.app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    AuthTokenResponse,
    UserProfileResponse,
)
from backend.app.services.auth_service import (
    create_access_token,
    get_current_user_required,
    get_active_auth_provider,
)
from backend.app.db.repository import community_repo
from fastapi import HTTPException, status

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/config")
async def get_auth_config() -> Dict[str, Any]:
    """Returns current active authentication provider configuration."""
    provider = get_active_auth_provider()
    return {
        "provider": provider,
        "isSupabase": provider == "supabase",
    }


@router.post("/signup", response_model=AuthTokenResponse)
async def signup(payload: UserRegisterRequest) -> AuthTokenResponse:
    """Registers a new account. Active in development and local mode."""
    if settings.environment.lower() == "production" and get_active_auth_provider() == "supabase":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="In production/Supabase mode, sign-ups must be performed directly via Supabase Auth client.",
        )
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
    """Authenticates existing user. Active in development and local mode."""
    if settings.environment.lower() == "production" and get_active_auth_provider() == "supabase":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="In production/Supabase mode, login must be performed directly via Supabase Auth client.",
        )
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

