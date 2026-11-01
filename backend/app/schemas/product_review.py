"""Pydantic schemas for the Finalized Full Product Review & Review-Linked Chat Experience."""

from __future__ import annotations

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, AliasChoices
from backend.app.schemas.ai import CitationRecord, CrossSourceComparison, StructuredRecommendation


class ReviewFinding(BaseModel):
    """Evidence-grounded finding within a product review category."""
    model_config = ConfigDict(populate_by_name=True)

    id: str
    title: str = Field(..., description="Concise finding headline")
    explanation: str = Field(..., description="Factual explanation of what reviewers/users reported")
    interpretation: str = Field(..., description="Product or architecture significance and impact")
    recommendation: Optional[str] = Field(None, description="Suggested action, experiment, or mitigation")
    uncertainty: Optional[str] = Field(None, description="Confidence level, limitations, or caveats")
    supportingCommentIds: List[str] = Field(
        default_factory=list,
        validation_alias=AliasChoices("supportingCommentIds", "supporting_comment_ids"),
        description="IDs of supporting comments or document chunks",
    )
    citations: List[CitationRecord] = Field(default_factory=list)
    evidenceCount: int = Field(0, validation_alias=AliasChoices("evidenceCount", "evidence_count"))


class RawReviewFinding(BaseModel):
    """Raw finding payload produced by LLM during review generation."""
    title: str = Field(..., description="Concise finding headline")
    explanation: str = Field(..., description="Factual explanation of observations")
    interpretation: str = Field(..., description="Significance or root cause analysis")
    recommendation: Optional[str] = Field(None, description="Suggested next action")
    uncertainty: Optional[str] = Field(None, description="Limitations or caveats")
    supporting_comment_ids: List[str] = Field(
        default_factory=list,
        description="IDs of comments or document chunks explicitly cited",
    )


class StructuredProductReviewProposal(BaseModel):
    """Structured LLM output schema for the 13 required review sections."""
    executive_overview: str = Field(..., description="Section 1: High-level synthesis of product status and critical takeaways")
    product_understanding: str = Field(..., description="Section 2: Value proposition, target personas, and primary use cases")
    key_highlights: List[str] = Field(default_factory=list, description="Section 3: Top standout signals and core differentiators")
    product_strengths: List[RawReviewFinding] = Field(default_factory=list, description="Section 4: Validated features, praise, and wins")
    customer_pain_points: List[RawReviewFinding] = Field(default_factory=list, description="Section 5: Frustrations, blockers, bugs, and friction")
    feature_requests: List[RawReviewFinding] = Field(default_factory=list, description="Section 6: Explicit requested features and capabilities")
    user_experience_assessment: str = Field(..., description="Section 7: Usability, onboarding cognitive load, navigation, accessibility")
    feedback_patterns: List[str] = Field(default_factory=list, description="Section 8: Recurring trends and persona sentiment patterns")
    documentation_alignment: CrossSourceComparison = Field(..., description="Section 9: PRD vs feedback alignment, missing docs, assumptions")
    improvement_opportunities: List[str] = Field(default_factory=list, description="Section 10: High-leverage pivots, quick wins, enhancements")
    recommendations: List[StructuredRecommendation] = Field(default_factory=list, description="Section 11: Prioritized P0/P1/P2 actions")
    evidence_gaps: str = Field(..., description="Section 12: Honest admission of what feedback does NOT cover")
    overall_assessment: str = Field(..., description="Section 13: Final verdict, readiness grade, and next steps")


class StructuredProductReview(BaseModel):
    """Validated 13-section review output with grounded citations and deterministic metrics."""
    model_config = ConfigDict(populate_by_name=True)

    executiveOverview: str = Field(..., validation_alias=AliasChoices("executiveOverview", "executive_overview"))
    productUnderstanding: str = Field(..., validation_alias=AliasChoices("productUnderstanding", "product_understanding"))
    keyHighlights: List[str] = Field(default_factory=list, validation_alias=AliasChoices("keyHighlights", "key_highlights"))
    productStrengths: List[ReviewFinding] = Field(default_factory=list, validation_alias=AliasChoices("productStrengths", "product_strengths"))
    customerPainPoints: List[ReviewFinding] = Field(default_factory=list, validation_alias=AliasChoices("customerPainPoints", "customer_pain_points"))
    featureRequests: List[ReviewFinding] = Field(default_factory=list, validation_alias=AliasChoices("featureRequests", "feature_requests"))
    userExperienceAssessment: str = Field(..., validation_alias=AliasChoices("userExperienceAssessment", "user_experience_assessment"))
    feedbackPatterns: List[str] = Field(default_factory=list, validation_alias=AliasChoices("feedbackPatterns", "feedback_patterns"))
    documentationAlignment: CrossSourceComparison = Field(..., validation_alias=AliasChoices("documentationAlignment", "documentation_alignment"))
    improvementOpportunities: List[str] = Field(default_factory=list, validation_alias=AliasChoices("improvementOpportunities", "improvement_opportunities"))
    recommendations: List[StructuredRecommendation] = Field(default_factory=list)
    evidenceGaps: str = Field(..., validation_alias=AliasChoices("evidenceGaps", "evidence_gaps"))
    overallAssessment: str = Field(..., validation_alias=AliasChoices("overallAssessment", "overall_assessment"))


class GenerateReviewRequest(BaseModel):
    """Payload to trigger manual generation of a Full Product Review."""
    model_config = ConfigDict(populate_by_name=True)

    sourceType: str = Field("both", description="'both', 'community', or 'documents'")
    includeCommunity: bool = Field(True, description="Whether to include community comments and replies")
    includedDocIds: Optional[List[str]] = Field(None, description="Optional subset of document IDs to include (None = all)")


class ProductReviewResponse(BaseModel):
    """Response representation of an immutable Full Product Review version."""
    model_config = ConfigDict(populate_by_name=True)

    id: str
    postId: str = Field(..., validation_alias=AliasChoices("postId", "post_id"))
    ownerId: str = Field(..., validation_alias=AliasChoices("ownerId", "owner_id"))
    version: int
    status: str
    provider: str
    model: str
    sourceSnapshot: Dict[str, Any] = Field(default_factory=dict, validation_alias=AliasChoices("sourceSnapshot", "source_snapshot"))
    contentMarkdown: str = Field(..., validation_alias=AliasChoices("contentMarkdown", "content_markdown"))
    structuredOutput: Optional[Dict[str, Any]] = Field(None, validation_alias=AliasChoices("structuredOutput", "structured_output"))
    citations: List[CitationRecord] = Field(default_factory=list)
    deterministicStats: Dict[str, Any] = Field(default_factory=dict, validation_alias=AliasChoices("deterministicStats", "deterministic_stats"))
    stagesCompleted: List[str] = Field(default_factory=list, validation_alias=AliasChoices("stagesCompleted", "stages_completed"))
    errorMessage: Optional[str] = Field(None, validation_alias=AliasChoices("errorMessage", "error_message"))
    createdAt: str = Field(..., validation_alias=AliasChoices("createdAt", "created_at"))
    completedAt: Optional[str] = Field(None, validation_alias=AliasChoices("completedAt", "completed_at"))
    linkedSessionId: Optional[str] = Field(None, validation_alias=AliasChoices("linkedSessionId", "linked_session_id"))


class DocumentSourceInfo(BaseModel):
    """Metadata about an eligible internal document for review generation."""
    model_config = ConfigDict(populate_by_name=True)

    id: str
    filename: str
    fileType: str = Field(..., validation_alias=AliasChoices("fileType", "file_type"))
    fileSize: int = Field(..., validation_alias=AliasChoices("fileSize", "file_size"))
    characterCount: int = Field(..., validation_alias=AliasChoices("characterCount", "character_count"))
    createdAt: str = Field(..., validation_alias=AliasChoices("createdAt", "created_at"))


class ReviewSourceAvailabilityResponse(BaseModel):
    """Source availability information provided before triggering a review."""
    model_config = ConfigDict(populate_by_name=True)

    totalComments: int = Field(..., validation_alias=AliasChoices("totalComments", "total_comments"))
    totalDocuments: int = Field(..., validation_alias=AliasChoices("totalDocuments", "total_documents"))
    documents: List[DocumentSourceInfo] = Field(default_factory=list)
    latestReviewId: Optional[str] = Field(None, validation_alias=AliasChoices("latestReviewId", "latest_review_id"))
    latestReviewVersion: Optional[int] = Field(None, validation_alias=AliasChoices("latestReviewVersion", "latest_review_version"))
    latestReviewCreatedAt: Optional[str] = Field(None, validation_alias=AliasChoices("latestReviewCreatedAt", "latest_review_created_at"))
    hasNewActivitySinceLastReview: bool = Field(False, validation_alias=AliasChoices("hasNewActivitySinceLastReview", "has_new_activity_since_last_review"))
    newCommentsCountSinceLastReview: int = Field(0, validation_alias=AliasChoices("newCommentsCountSinceLastReview", "new_comments_count_since_last_review"))
    newDocumentsCountSinceLastReview: int = Field(0, validation_alias=AliasChoices("newDocumentsCountSinceLastReview", "new_documents_count_since_last_review"))

