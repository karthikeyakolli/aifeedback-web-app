"""Encrypted BYOK Credential Vault API Routes (Phase 3)."""

from __future__ import annotations

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, status

from backend.app.schemas.credentials import (
    CredentialCreateRequest,
    CredentialUpdateRequest,
    CredentialRotateRequest,
    CredentialMetadataResponse,
    CredentialTestResponse,
)
from backend.app.services.vault_service import vault_service
from backend.app.services.auth_service import get_current_user_required

router = APIRouter(prefix="/credentials", tags=["BYOK Credential Vault"])


def _extract_user_id(current_user: Dict[str, Any]) -> str:
    return current_user.get("user_id") or current_user.get("sub") or current_user.get("id") or ""


@router.post("", response_model=CredentialMetadataResponse, status_code=status.HTTP_201_CREATED)
async def add_credential(
    payload: CredentialCreateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user_required),
) -> CredentialMetadataResponse:
    """Encrypts and securely persists a user-owned AI provider credential."""
    user_id = _extract_user_id(current_user)
    cred = vault_service.add_credential(
        user_id=user_id,
        provider=payload.provider,
        display_name=payload.display_name,
        secret_key=payload.secret_key,
    )
    return CredentialMetadataResponse(**cred)


@router.get("", response_model=List[CredentialMetadataResponse])
async def list_credentials(
    current_user: Dict[str, Any] = Depends(get_current_user_required),
) -> List[CredentialMetadataResponse]:
    """Lists safe masked metadata for all credentials owned by the current user."""
    user_id = _extract_user_id(current_user)
    creds = vault_service.list_user_credentials(user_id)
    return [CredentialMetadataResponse(**c) for c in creds]


@router.get("/{credential_id}", response_model=CredentialMetadataResponse)
async def get_credential(
    credential_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user_required),
) -> CredentialMetadataResponse:
    """Retrieves safe metadata for a specific credential owned by the current user."""
    user_id = _extract_user_id(current_user)
    cred = vault_service.get_credential_metadata(user_id, credential_id)
    return CredentialMetadataResponse(**cred)


@router.post("/{credential_id}/test", response_model=CredentialTestResponse)
async def test_credential(
    credential_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user_required),
) -> CredentialTestResponse:
    """Tests credential connectivity against the external AI provider without invoking generation."""
    user_id = _extract_user_id(current_user)
    result = await vault_service.test_credential_connectivity(user_id, credential_id)
    return CredentialTestResponse(
        credential=CredentialMetadataResponse(**result["credential"]),
        status=result["status"],
        message=result["message"],
    )


@router.patch("/{credential_id}", response_model=CredentialMetadataResponse)
async def update_credential(
    credential_id: str,
    payload: CredentialUpdateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user_required),
) -> CredentialMetadataResponse:
    """Updates display name or toggles enabled status for a credential."""
    user_id = _extract_user_id(current_user)
    updated = vault_service.update_credential(
        user_id=user_id,
        credential_id=credential_id,
        display_name=payload.display_name,
        is_enabled=payload.is_enabled,
    )
    return CredentialMetadataResponse(**updated)


@router.post("/{credential_id}/rotate", response_model=CredentialMetadataResponse)
async def rotate_credential(
    credential_id: str,
    payload: CredentialRotateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user_required),
) -> CredentialMetadataResponse:
    """Rotates the secret key for an existing credential record."""
    user_id = _extract_user_id(current_user)
    rotated = vault_service.rotate_credential_secret(
        user_id=user_id,
        credential_id=credential_id,
        new_secret_key=payload.new_secret_key,
    )
    return CredentialMetadataResponse(**rotated)


@router.delete("/{credential_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_credential(
    credential_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user_required),
) -> None:
    """Deletes an encrypted credential record from the vault."""
    user_id = _extract_user_id(current_user)
    vault_service.delete_credential(user_id, credential_id)

