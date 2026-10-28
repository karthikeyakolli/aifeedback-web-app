"""User profiles endpoint with strict privacy controls."""

from __future__ import annotations

from fastapi import APIRouter
from backend.app.schemas.auth import PublicUserProfileResponse
from backend.app.db.repository import community_repo

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/{user_id}/profile", response_model=PublicUserProfileResponse)
async def get_user_public_profile(user_id: str) -> PublicUserProfileResponse:
    """Retrieves public user profile. Strictly excludes email and any anonymous posts."""
    profile_data = community_repo.get_public_profile(user_id)
    return PublicUserProfileResponse(**profile_data)
