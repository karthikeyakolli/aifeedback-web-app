"""Pydantic schemas for Phase 5 Research Report Generation and Persistence."""

from __future__ import annotations

from enum import Enum
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, ConfigDict, AliasChoices


class ResearchReportType(str, Enum):
    """Supported Phase 4 and Phase 5 research document types."""
    ANALYTICAL_REPORT = "analytical_report"
    EXECUTIVE_SUMMARY = "executive_summary"
    PRD = "prd"
    ENGINEERING_TICKET = "engineering_ticket"
    UX_BRIEF = "ux_brief"
    IMPROVEMENT_ROADMAP = "improvement_roadmap"
    ENGINEERING_INVESTIGATION = "engineering_investigation"


class ReportGenerateRequest(BaseModel):
    """Payload to trigger generation of a research document."""
    model_config = ConfigDict(populate_by_name=True)

    reportType: ResearchReportType = Field(
        ...,
        validation_alias=AliasChoices("reportType", "report_type"),
        description="Type of research document to generate",
    )
    customFocus: Optional[str] = Field(
        default=None,
        max_length=500,
        validation_alias=AliasChoices("customFocus", "custom_focus"),
        description="Optional custom focus area or hypothesis to emphasize in the report",
    )
    title: Optional[str] = Field(
        default=None,
        max_length=200,
        description="Optional custom title override for the generated report",
    )


class ReportUpdateRequest(BaseModel):
    """Payload to update an editable research report draft."""
    model_config = ConfigDict(populate_by_name=True)

    title: Optional[str] = Field(
        default=None,
        max_length=200,
        description="Updated title for the report",
    )
    contentMarkdown: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("contentMarkdown", "content_markdown"),
        description="Updated Markdown content of the report draft",
    )


class ResearchReportResponse(BaseModel):
    """Response representation of a persisted research document."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    postId: str = Field(..., validation_alias=AliasChoices("postId", "post_id"))
    ownerId: str = Field(..., validation_alias=AliasChoices("ownerId", "owner_id"))
    reportType: str = Field(..., validation_alias=AliasChoices("reportType", "report_type"))
    title: str
    contentMarkdown: str = Field(..., validation_alias=AliasChoices("contentMarkdown", "content_markdown"))
    status: str
    sourceAnalysisId: Optional[str] = Field(default=None, validation_alias=AliasChoices("sourceAnalysisId", "source_analysis_id"))
    version: int = 1
    metadata: Dict[str, Any] = Field(default_factory=dict)
    createdAt: str = Field(..., validation_alias=AliasChoices("createdAt", "created_at"))
    updatedAt: str = Field(..., validation_alias=AliasChoices("updatedAt", "updated_at"))
