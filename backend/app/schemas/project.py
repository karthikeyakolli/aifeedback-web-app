"""Pydantic schemas for Projects, Project Attachments, and AI Feedback Foundation."""

from __future__ import annotations
from typing import Optional, List, Literal, Union
from datetime import datetime
from pydantic import BaseModel, Field, AliasChoices, ConfigDict, computed_field


ProjectStatus = Literal['draft', 'ready', 'in_review', 'reviewed', 'archived']
ProjectCategory = Literal[
    'developer-tools',
    'productivity',
    'ai-ml',
    'design-ux',
    'saas-b2b',
    'mobile',
    'infrastructure'
]
FindingSeverity = Literal['blocker', 'high', 'medium', 'low']
FindingCategory = Literal['ux', 'performance', 'security', 'bug', 'architecture', 'accessibility']
FindingStatus = Literal['open', 'in_progress', 'addressed']


class ProjectBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str = Field(..., min_length=3, max_length=120, description="Project name")
    tagline: str = Field(..., min_length=10, max_length=200, description="Short summary/tagline")
    description: Optional[str] = Field("", description="Project description or specifications")
    category: ProjectCategory
    repository_url: Optional[str] = Field(
        None,
        validation_alias=AliasChoices("repositoryUrl", "repository_url"),
        serialization_alias="repositoryUrl",
        description="GitHub/GitLab repository URL",
    )
    demo_url: Optional[str] = Field(
        None,
        validation_alias=AliasChoices("demoUrl", "demo_url"),
        serialization_alias="demoUrl",
        description="Live prototype/demo URL",
    )
    is_public: bool = Field(
        False,
        validation_alias=AliasChoices("isPublic", "is_public"),
        serialization_alias="isPublic",
        description="Whether published to Public Explore",
    )


class ProjectCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str = Field(..., min_length=3, max_length=120)
    tagline: str = Field(..., min_length=10, max_length=200)
    category: ProjectCategory
    description: Optional[str] = Field("", description="Optional initial description")
    repository_url: Optional[str] = Field(
        None,
        validation_alias=AliasChoices("repositoryUrl", "repository_url"),
        serialization_alias="repositoryUrl",
    )
    demo_url: Optional[str] = Field(
        None,
        validation_alias=AliasChoices("demoUrl", "demo_url"),
        serialization_alias="demoUrl",
    )
    is_public: bool = Field(
        False,
        validation_alias=AliasChoices("isPublic", "is_public"),
        serialization_alias="isPublic",
    )


class ProjectUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: Optional[str] = Field(None, min_length=3, max_length=120)
    tagline: Optional[str] = Field(None, min_length=10, max_length=200)
    description: Optional[str] = None
    category: Optional[ProjectCategory] = None
    repository_url: Optional[str] = Field(
        None,
        validation_alias=AliasChoices("repositoryUrl", "repository_url"),
        serialization_alias="repositoryUrl",
    )
    demo_url: Optional[str] = Field(
        None,
        validation_alias=AliasChoices("demoUrl", "demo_url"),
        serialization_alias="demoUrl",
    )
    is_public: bool = Field(
        False,
        validation_alias=AliasChoices("isPublic", "is_public"),
        serialization_alias="isPublic",
    )
    status: Optional[ProjectStatus] = None
    is_public: Optional[bool] = Field(
        None,
        validation_alias=AliasChoices("isPublic", "is_public"),
        serialization_alias="isPublic",
    )


class ProjectRead(ProjectBase):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    user_id: str = Field(..., validation_alias=AliasChoices("userId", "user_id"), serialization_alias="userId")
    status: ProjectStatus
    upvotes_count: int = Field(0, validation_alias=AliasChoices("upvotesCount", "upvotes_count"), serialization_alias="upvotesCount")
    reviews_count: int = Field(0, validation_alias=AliasChoices("reviewsCount", "reviews_count"), serialization_alias="reviewsCount")
    created_at: Union[datetime, str] = Field(..., validation_alias=AliasChoices("createdAt", "created_at"), serialization_alias="createdAt")
    updated_at: Union[datetime, str] = Field(..., validation_alias=AliasChoices("updatedAt", "updated_at"), serialization_alias="updatedAt")


class PublicProjectRead(BaseModel):
    """Server-side public data projection: excludes internal user_id, private notes, and internal operational logs."""
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    name: str
    tagline: str
    description: str
    category: ProjectCategory
    repository_url: Optional[str] = Field(None, validation_alias=AliasChoices("repositoryUrl", "repository_url"), serialization_alias="repositoryUrl")
    demo_url: Optional[str] = Field(None, validation_alias=AliasChoices("demoUrl", "demo_url"), serialization_alias="demoUrl")
    status: ProjectStatus
    is_public: bool = Field(True, validation_alias=AliasChoices("isPublic", "is_public"), serialization_alias="isPublic")
    upvotes_count: int = Field(0, validation_alias=AliasChoices("upvotesCount", "upvotes_count"), serialization_alias="upvotesCount")
    reviews_count: int = Field(0, validation_alias=AliasChoices("reviewsCount", "reviews_count"), serialization_alias="reviewsCount")
    creator_username: Optional[str] = Field(None, validation_alias=AliasChoices("creatorUsername", "creator_username"), serialization_alias="creatorUsername")
    creator_display_name: Optional[str] = Field(None, validation_alias=AliasChoices("creatorDisplayName", "creator_display_name"), serialization_alias="creatorDisplayName")
    created_at: Union[datetime, str] = Field(..., validation_alias=AliasChoices("createdAt", "created_at"), serialization_alias="createdAt")
    updated_at: Union[datetime, str] = Field(..., validation_alias=AliasChoices("updatedAt", "updated_at"), serialization_alias="updatedAt")


class PublicUpvoteResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    project_id: str = Field(..., validation_alias=AliasChoices("projectId", "project_id"), serialization_alias="projectId")
    upvotes_count: int = Field(..., validation_alias=AliasChoices("upvotesCount", "upvotes_count"), serialization_alias="upvotesCount")
    has_upvoted: bool = Field(True, validation_alias=AliasChoices("hasUpvoted", "has_upvoted"), serialization_alias="hasUpvoted")



class ProjectAttachmentRead(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    project_id: str = Field(..., validation_alias=AliasChoices("projectId", "project_id"), serialization_alias="projectId")
    filename: str
    file_size: int = Field(..., validation_alias=AliasChoices("fileSize", "file_size"), serialization_alias="fileSize")
    mime_type: str = Field(..., validation_alias=AliasChoices("mimeType", "mime_type"), serialization_alias="mimeType")
    created_at: Union[datetime, str] = Field(..., validation_alias=AliasChoices("createdAt", "created_at"), serialization_alias="createdAt")


class FindingRead(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    report_id: str = Field(..., validation_alias=AliasChoices("reportId", "report_id"), serialization_alias="reportId")
    project_id: str = Field(..., validation_alias=AliasChoices("projectId", "project_id"), serialization_alias="projectId")
    title: str
    severity: FindingSeverity
    category: FindingCategory
    observation: str
    evidence_quote: str = Field(..., validation_alias=AliasChoices("evidenceQuote", "evidence_quote"), serialization_alias="evidenceQuote")
    recommendation: str
    status: FindingStatus = 'open'
    resolved_at: Optional[Union[datetime, str]] = Field(None, validation_alias=AliasChoices("resolvedAt", "resolved_at"), serialization_alias="resolvedAt")
    created_at: Union[datetime, str] = Field(..., validation_alias=AliasChoices("createdAt", "created_at"), serialization_alias="createdAt")


class FindingStatusUpdate(BaseModel):
    status: FindingStatus


class FeedbackReportRead(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    review_id: str = Field(..., validation_alias=AliasChoices("reviewId", "review_id"), serialization_alias="reviewId")
    project_id: str = Field(..., validation_alias=AliasChoices("projectId", "project_id"), serialization_alias="projectId")
    executive_summary: str = Field(..., validation_alias=AliasChoices("executiveSummary", "executive_summary"), serialization_alias="executiveSummary")
    strengths_summary: str = Field(..., validation_alias=AliasChoices("strengthsSummary", "strengths_summary"), serialization_alias="strengthsSummary")
    total_findings_count: int = Field(..., validation_alias=AliasChoices("totalFindingsCount", "total_findings_count"), serialization_alias="totalFindingsCount")
    blockers_count: int = Field(..., validation_alias=AliasChoices("blockersCount", "blockers_count"), serialization_alias="blockersCount")
    high_count: int = Field(..., validation_alias=AliasChoices("highCount", "high_count"), serialization_alias="highCount")
    medium_count: int = Field(..., validation_alias=AliasChoices("mediumCount", "medium_count"), serialization_alias="mediumCount")
    low_count: int = Field(..., validation_alias=AliasChoices("lowCount", "low_count"), serialization_alias="lowCount")
    findings: List[FindingRead] = []
    created_at: Union[datetime, str] = Field(..., validation_alias=AliasChoices("createdAt", "created_at"), serialization_alias="createdAt")


ReviewLifecycleStatus = Literal['pending', 'queued', 'processing', 'completed', 'failed']


class AIReviewStartRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    focus_areas: Optional[List[str]] = Field(default_factory=list, description="Optional areas of emphasis (e.g. ['security', 'performance'])")
    model_override: Optional[str] = Field(None, description="Optional approved model override")
    sync: Optional[bool] = Field(None, description="Optional synchronous execution flag (for testing or direct wait)")


class AIReviewStatusResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    project_id: str = Field(..., validation_alias=AliasChoices("projectId", "project_id"), serialization_alias="projectId")
    user_id: str = Field(..., validation_alias=AliasChoices("userId", "user_id"), serialization_alias="userId")
    status: ReviewLifecycleStatus
    provider: str
    model_id: str = Field(..., validation_alias=AliasChoices("modelId", "model_id"), serialization_alias="modelId")
    error_message: Optional[str] = Field(None, validation_alias=AliasChoices("errorMessage", "error_message"), serialization_alias="errorMessage")
    execution_duration_ms: Optional[int] = Field(None, validation_alias=AliasChoices("executionDurationMs", "execution_duration_ms"), serialization_alias="executionDurationMs")
    worker_id: Optional[str] = Field(None, validation_alias=AliasChoices("workerId", "worker_id"), serialization_alias="workerId")
    attempt_count: Optional[int] = Field(0, validation_alias=AliasChoices("attemptCount", "attempt_count"), serialization_alias="attemptCount")
    max_attempts: Optional[int] = Field(3, validation_alias=AliasChoices("maxAttempts", "max_attempts"), serialization_alias="maxAttempts")
    scheduled_at: Optional[Union[datetime, str]] = Field(None, validation_alias=AliasChoices("scheduledAt", "scheduled_at"), serialization_alias="scheduledAt")
    created_at: Union[datetime, str] = Field(..., validation_alias=AliasChoices("createdAt", "created_at"), serialization_alias="createdAt")
    completed_at: Optional[Union[datetime, str]] = Field(None, validation_alias=AliasChoices("completedAt", "completed_at"), serialization_alias="completedAt")


class RawProjectFindingProposal(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    severity: FindingSeverity
    category: FindingCategory
    observation: str = Field(..., min_length=10)
    evidence_quote: str = Field(..., min_length=3, description="Exact quotation or evidence from project context")
    recommendation: str = Field(..., min_length=10)


class StructuredProjectFeedbackProposal(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    executive_summary: str = Field(..., min_length=20, validation_alias=AliasChoices("executiveSummary", "executive_summary"))
    strengths_summary: str = Field(..., min_length=20, validation_alias=AliasChoices("strengthsSummary", "strengths_summary"))
    findings: List[RawProjectFindingProposal] = Field(..., min_length=1)
    provider: Optional[str] = None
    model: Optional[str] = None
    is_fallback: bool = Field(False, validation_alias=AliasChoices("isFallback", "is_fallback"))
    fallback_reason: Optional[str] = Field(None, validation_alias=AliasChoices("fallbackReason", "fallback_reason"))
    execution_mode: str = Field("ai_orchestrated", validation_alias=AliasChoices("executionMode", "execution_mode"))

    @computed_field
    def executiveSummary(self) -> str:
        return self.executive_summary

    @computed_field
    def strengthsSummary(self) -> str:
        return self.strengths_summary


class FindingComparisonItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    finding_id: str = Field(..., validation_alias=AliasChoices("findingId", "finding_id"), serialization_alias="findingId")
    title: str
    severity: FindingSeverity
    category: FindingCategory
    status_in_base: Optional[FindingStatus] = Field(None, validation_alias=AliasChoices("statusInBase", "status_in_base"), serialization_alias="statusInBase")
    status_in_target: Optional[FindingStatus] = Field(None, validation_alias=AliasChoices("statusInTarget", "status_in_target"), serialization_alias="statusInTarget")
    change_type: Literal['new', 'resolved', 'reopened', 'persisted', 'potentially_resolved', 'not_detected'] = Field(..., validation_alias=AliasChoices("changeType", "change_type"), serialization_alias="changeType")


class FeedbackReportComparison(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    project_id: str = Field(..., validation_alias=AliasChoices("projectId", "project_id"), serialization_alias="projectId")
    base_report_id: str = Field(..., validation_alias=AliasChoices("baseReportId", "base_report_id"), serialization_alias="baseReportId")
    target_report_id: str = Field(..., validation_alias=AliasChoices("targetReportId", "target_report_id"), serialization_alias="targetReportId")
    total_findings_delta: int = Field(..., validation_alias=AliasChoices("totalFindingsDelta", "total_findings_delta"), serialization_alias="totalFindingsDelta")
    resolved_count: int = Field(..., validation_alias=AliasChoices("resolvedCount", "resolved_count"), serialization_alias="resolvedCount")
    new_count: int = Field(..., validation_alias=AliasChoices("newCount", "new_count"), serialization_alias="newCount")
    persisted_count: int = Field(..., validation_alias=AliasChoices("persistedCount", "persisted_count"), serialization_alias="persistedCount")
    items: List[FindingComparisonItem] = []


class ReportExportResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    project_id: str = Field(..., validation_alias=AliasChoices("projectId", "project_id"), serialization_alias="projectId")
    report_id: str = Field(..., validation_alias=AliasChoices("reportId", "report_id"), serialization_alias="reportId")
    format: str = "markdown"
    filename: str
    content: str


# =============================================================================
# Phase 4 to 10 Schemas: Sources, RAG, Graph, Tasks, and Chats
# =============================================================================

class ProjectSourceRead(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    project_id: str = Field(..., validation_alias=AliasChoices("projectId", "project_id"), serialization_alias="projectId")
    owner_id: str = Field(..., validation_alias=AliasChoices("ownerId", "owner_id"), serialization_alias="ownerId")
    source_type: str = Field(..., validation_alias=AliasChoices("sourceType", "source_type"), serialization_alias="sourceType")
    name: str
    original_filename: str = Field(..., validation_alias=AliasChoices("originalFilename", "original_filename"), serialization_alias="originalFilename")
    file_size: int = Field(0, validation_alias=AliasChoices("fileSize", "file_size"), serialization_alias="fileSize")
    mime_type: str = Field("text/plain", validation_alias=AliasChoices("mimeType", "mime_type"), serialization_alias="mimeType")
    content_text: str = Field("", validation_alias=AliasChoices("contentText", "content_text"), serialization_alias="contentText")
    metadata: dict = Field(default_factory=dict)
    version: int = 1
    is_active: bool = Field(True, validation_alias=AliasChoices("isActive", "is_active"), serialization_alias="isActive")
    created_at: str = Field(..., validation_alias=AliasChoices("createdAt", "created_at"), serialization_alias="createdAt")


class ProjectRepoLinkRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    repository_url: str = Field(..., validation_alias=AliasChoices("repositoryUrl", "repository_url"), min_length=10)
    credential_id: Optional[str] = Field(None, validation_alias=AliasChoices("credentialId", "credential_id"))
    branch: Optional[str] = Field("main", validation_alias=AliasChoices("branch"))


class ProjectDesignLinkRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    design_url: str = Field(..., validation_alias=AliasChoices("designUrl", "design_url"), min_length=10)
    credential_id: Optional[str] = Field(None, validation_alias=AliasChoices("credentialId", "credential_id"))


class RAGQueryRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    query: str = Field(..., min_length=2)
    top_k: int = Field(6, validation_alias=AliasChoices("topK", "top_k"), ge=1, le=20)
    include_reference: bool = Field(True, validation_alias=AliasChoices("includeReference", "include_reference"))


class ProjectAIConfigRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    task_type: str = Field("review", validation_alias=AliasChoices("taskType", "task_type"))
    primary_provider: str = Field("gemini", validation_alias=AliasChoices("primaryProvider", "primary_provider"))
    fallback_provider: Optional[str] = Field("openrouter", validation_alias=AliasChoices("fallbackProvider", "fallback_provider"))
    model_override: Optional[str] = Field(None, validation_alias=AliasChoices("modelOverride", "model_override"))


class CompletenessDecisionRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    node_id: str = Field(..., validation_alias=AliasChoices("nodeId", "node_id"))
    decision: str = Field("approved")  # approved, dismissed, deferred
    rationale: Optional[str] = ""


class ProjectChatCreateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    title: str = Field("Project Discussion", min_length=1)
    chat_scope: str = Field("project_wide", validation_alias=AliasChoices("chatScope", "chat_scope"))
    target_review_id: Optional[str] = Field(None, validation_alias=AliasChoices("targetReviewId", "target_review_id"))
    target_finding_id: Optional[str] = Field(None, validation_alias=AliasChoices("targetFindingId", "target_finding_id"))


class ProjectChatMessageRequest(BaseModel):
    content: str = Field(..., min_length=1)


class FindingActionRequest(BaseModel):
    action: str = Field("accept")  # accept, edit, reject, defer
    custom_recommendation: Optional[str] = Field(None, validation_alias=AliasChoices("customRecommendation", "custom_recommendation"))
    rationale: Optional[str] = None


class TaskStatusUpdateRequest(BaseModel):
    status: str = Field(...)  # todo, in_progress, completed


