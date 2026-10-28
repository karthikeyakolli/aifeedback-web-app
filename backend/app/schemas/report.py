"""Content report schemas for moderation."""

from __future__ import annotations

from typing import Optional, Literal
from pydantic import BaseModel, Field, ConfigDict, AliasChoices


class ReportCreateRequest(BaseModel):
    """Payload for submitting a moderation report."""
    model_config = ConfigDict(populate_by_name=True)

    targetType: Literal["post", "comment"] = Field(
        ...,
        validation_alias=AliasChoices("targetType", "target_type"),
        description="Target entity type",
    )
    targetId: str = Field(
        ...,
        validation_alias=AliasChoices("targetId", "target_id"),
        description="UUID of reported post or comment",
    )
    reason: str = Field(..., min_length=3, max_length=150, description="Reason category for reporting")
    description: Optional[str] = Field("", max_length=1000, description="Additional context")


class ReportResponse(BaseModel):
    """Report submission response."""

    id: str
    targetType: str
    targetId: str
    status: str
    message: str
