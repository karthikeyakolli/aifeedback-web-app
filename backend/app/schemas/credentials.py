"""Pydantic schemas for secure BYOK Credential Vault (Phase 3)."""

from __future__ import annotations

from datetime import datetime
from typing import Optional, Literal, Union
from pydantic import BaseModel, Field, ConfigDict, AliasChoices

AIProviderType = Literal['gemini', 'groq', 'nvidia', 'openrouter']
ValidationStatus = Literal['unverified', 'valid', 'invalid', 'rate_limited']


class CredentialCreateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    provider: AIProviderType = Field(..., description="Target AI provider (gemini, groq, nvidia, openrouter)")
    display_name: str = Field(..., min_length=2, max_length=100, description="User-assigned label", validation_alias=AliasChoices("displayName", "display_name", "name"))
    secret_key: str = Field(..., min_length=8, description="Plaintext secret key to encrypt and persist", validation_alias=AliasChoices("secretKey", "secret_key", "secret"))


class CredentialUpdateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    display_name: Optional[str] = Field(None, min_length=2, max_length=100, validation_alias=AliasChoices("displayName", "display_name", "name"))
    is_enabled: Optional[bool] = Field(None, validation_alias=AliasChoices("isEnabled", "is_enabled"))


class CredentialRotateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    new_secret_key: str = Field(..., min_length=8, validation_alias=AliasChoices("newSecretKey", "new_secret_key", "newSecret", "new_secret", "secret"))



class CredentialMetadataResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    user_id: str = Field(..., validation_alias=AliasChoices("userId", "user_id"), serialization_alias="userId")
    provider: AIProviderType
    display_name: str = Field(..., validation_alias=AliasChoices("displayName", "display_name"), serialization_alias="displayName")
    masked_preview: str = Field(..., validation_alias=AliasChoices("maskedPreview", "masked_preview"), serialization_alias="maskedPreview")
    is_enabled: bool = Field(..., validation_alias=AliasChoices("isEnabled", "is_enabled"), serialization_alias="isEnabled")
    validation_status: ValidationStatus = Field(..., validation_alias=AliasChoices("validationStatus", "validation_status"), serialization_alias="validationStatus")
    last_tested_at: Optional[Union[datetime, str]] = Field(None, validation_alias=AliasChoices("lastTestedAt", "last_tested_at"), serialization_alias="lastTestedAt")
    created_at: Union[datetime, str] = Field(..., validation_alias=AliasChoices("createdAt", "created_at"), serialization_alias="createdAt")
    updated_at: Union[datetime, str] = Field(..., validation_alias=AliasChoices("updatedAt", "updated_at"), serialization_alias="updatedAt")


class CredentialTestResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    credential: CredentialMetadataResponse
    status: ValidationStatus
    message: str
