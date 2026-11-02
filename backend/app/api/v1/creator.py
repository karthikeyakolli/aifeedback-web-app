"""Creator Space API routes."""

from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, Depends
from backend.app.schemas.creator import (
    CreatorProfileRead,
    CreatorProfileUpdate,
    CreatorStudioOverview,
    PublicCreatorProfile,
)
from backend.app.services.auth_service import get_current_user_required
from backend.app.db.creator_repository import creator_repo

router = APIRouter(tags=["Creator Space"])


def get_user_id(user_claims: dict) -> str:
    return user_claims.get("sub") or user_claims.get("id") or ""


@router.get("/creator/studio", response_model=CreatorStudioOverview)
async def get_creator_studio(
    current_user: dict = Depends(get_current_user_required),
) -> CreatorStudioOverview:
    """Returns the authenticated creator's studio metrics, profile, and project showcase list."""
    user_id = get_user_id(current_user)
    data = creator_repo.get_creator_studio_overview(user_id)
    return CreatorStudioOverview(**data)


@router.patch("/creator/profile", response_model=CreatorProfileRead)
async def update_creator_profile(
    payload: CreatorProfileUpdate,
    current_user: dict = Depends(get_current_user_required),
) -> CreatorProfileRead:
    """Updates the authenticated creator's maker presentation profile."""
    user_id = get_user_id(current_user)
    updates = payload.model_dump(exclude_unset=True)
    updated = creator_repo.update_creator_profile(user_id, updates)
    return CreatorProfileRead(**updated)


@router.post("/creator/projects/{project_id}/publish")
async def publish_project(
    project_id: str,
    current_user: dict = Depends(get_current_user_required),
) -> Dict[str, Any]:
    """Explicitly publishes a project from Creator Studio to Public Space."""
    user_id = get_user_id(current_user)
    return creator_repo.set_project_visibility(project_id, user_id, is_public=True)


@router.post("/creator/projects/{project_id}/unpublish")
async def unpublish_project(
    project_id: str,
    current_user: dict = Depends(get_current_user_required),
) -> Dict[str, Any]:
    """Explicitly revokes public visibility, immediately returning direct requests to 404."""
    user_id = get_user_id(current_user)
    return creator_repo.set_project_visibility(project_id, user_id, is_public=False)


@router.get("/creators/{username_or_id}", response_model=PublicCreatorProfile)
async def get_public_creator_profile(
    username_or_id: str,
) -> PublicCreatorProfile:
    """Public maker profile. Strictly projects only published projects and non-sensitive maker metadata."""
    data = creator_repo.get_public_creator_profile(username_or_id)
    return PublicCreatorProfile(**data)
