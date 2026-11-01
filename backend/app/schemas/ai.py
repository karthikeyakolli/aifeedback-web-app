"""Pydantic schemas for AI Research Intelligence and structured Gemini output.

Supports dual camelCase/snake_case serialization to maintain 100% compatibility
with React/TypeScript types, database records, and Gemini structured output specifications.
"""

from __future__ import annotations

from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field, ConfigDict, AliasChoices


# =============================================================================
# 1. Raw LLM Structured Output Schema (Passed to Gemini API)
# =============================================================================
class RawThemeProposal(BaseModel):
    """Proposal from LLM representing an observed recurring feedback theme."""

    theme_name: str = Field(..., description="Concise, informative title of the recurring theme")
    category: Literal["complaint", "praise", "feature_request", "friction"] = Field(
        ..., description="Category: complaint, praise, feature_request, or friction"
    )
    summary: str = Field(..., description="Factual explanation of what users reported and why")
    supporting_comment_ids: List[str] = Field(
        default_factory=list,
        description="IDs of comments from the provided input that directly support this theme",
    )
    severity: Literal["high", "medium", "low"] = Field(
        default="medium", description="Observed friction severity: high, medium, or low"
    )


class RawDisagreementProposal(BaseModel):
    """Proposal from LLM representing conflicting community opinions or tensions."""

    topic: str = Field(..., description="Subject of the community divergence")
    perspective_a: str = Field(..., description="First viewpoint expressed in discussion")
    supporting_ids_a: List[str] = Field(
        default_factory=list, description="Comment IDs supporting perspective A"
    )
    perspective_b: str = Field(..., description="Contrasting viewpoint expressed in discussion")
    supporting_ids_b: List[str] = Field(
        default_factory=list, description="Comment IDs supporting perspective B"
    )
    takeaway: str = Field(..., description="Objective synthesis of the architectural or product tension")


class RawRecommendationProposal(BaseModel):
    """Proposal from LLM representing an evidence-grounded research hypothesis."""

    title: str = Field(..., description="Proposed research investigation or validation action")
    problem_addressed: str = Field(..., description="Specific problem or friction identified in feedback")
    rationale: str = Field(..., description="Evidence connecting community reports to this proposal")
    suggested_validation: str = Field(
        ..., description="Falsifiable user test, metric check, or prototype validation step"
    )
    supporting_comment_ids: List[str] = Field(
        default_factory=list, description="Comment IDs that motivate this investigation"
    )
    confidence: Literal["high", "medium", "low"] = Field(
        default="medium", description="Confidence based on evidence quantity and clarity"
    )
    recommended_priority: Literal["P0", "P1", "P2", "P3"] = Field(
        default="P2", description="Priority level: P0, P1, P2, or P3"
    )


class GeminiAnalysisOutput(BaseModel):
    """Full structured JSON schema expected from Gemini generate_content."""

    discussion_summary: str = Field(
        ..., description="Concise, 2-4 sentence executive synthesis of community sentiment and feedback"
    )
    themes: List[RawThemeProposal] = Field(
        default_factory=list, description="Recurring themes observed in the community feedback"
    )
    disagreements: List[RawDisagreementProposal] = Field(
        default_factory=list, description="Contrasting perspectives or trade-offs raised by users"
    )
    recommendations: List[RawRecommendationProposal] = Field(
        default_factory=list, description="Prioritized investigations and suggested validation experiments"
    )
    limitations_and_uncertainty: str = Field(
        ..., description="Explicit notes on data limitations, sample size, or gaps in feedback"
    )


# =============================================================================
# 2. Verified Application Models & API Responses
# =============================================================================
class CitationRecord(BaseModel):
    """Verifiable citation linking directly to a real stored comment or attached document."""

    model_config = ConfigDict(populate_by_name=True)

    commentId: str = Field(..., validation_alias=AliasChoices("commentId", "comment_id"))
    quoteSnippet: str = Field(..., validation_alias=AliasChoices("quoteSnippet", "quote_snippet"))
    authorDisplay: str = Field(..., validation_alias=AliasChoices("authorDisplay", "author_display"))
    sourceType: str = Field("comment", validation_alias=AliasChoices("sourceType", "source_type"))
    filename: Optional[str] = Field(None, validation_alias=AliasChoices("filename"))
    pageNumber: Optional[int] = Field(None, validation_alias=AliasChoices("pageNumber", "page_number"))
    section: Optional[str] = Field(None, validation_alias=AliasChoices("section"))



class ThemeFinding(BaseModel):
    """Recurring feedback theme with verified citations and calculated comment counts."""

    model_config = ConfigDict(populate_by_name=True)

    id: str
    themeName: str = Field(..., validation_alias=AliasChoices("themeName", "theme_name"))
    category: str = Field(..., description="complaint, praise, feature_request, friction")
    summary: str
    supportingCommentIds: List[str] = Field(
        default_factory=list,
        validation_alias=AliasChoices("supportingCommentIds", "supporting_comment_ids"),
    )
    citations: List[CitationRecord] = Field(default_factory=list)
    commentCount: int = Field(0, validation_alias=AliasChoices("commentCount", "comment_count"))
    severity: str = Field(default="medium", description="high, medium, low")


class DisagreementFinding(BaseModel):
    """Contrasting community viewpoints with validated comment references."""

    model_config = ConfigDict(populate_by_name=True)

    id: str
    topic: str
    perspectiveA: str = Field(..., validation_alias=AliasChoices("perspectiveA", "perspective_a"))
    supportingIdsA: List[str] = Field(
        default_factory=list, validation_alias=AliasChoices("supportingIdsA", "supporting_ids_a")
    )
    perspectiveB: str = Field(..., validation_alias=AliasChoices("perspectiveB", "perspective_b"))
    supportingIdsB: List[str] = Field(
        default_factory=list, validation_alias=AliasChoices("supportingIdsB", "supporting_ids_b")
    )
    takeaway: str


class RecommendationFinding(BaseModel):
    """Evidence-backed product suggestion with deterministic frequency score."""

    model_config = ConfigDict(populate_by_name=True)

    id: str
    title: str
    problemAddressed: str = Field(
        ..., validation_alias=AliasChoices("problemAddressed", "problem_addressed")
    )
    rationale: str
    suggestedValidation: str = Field(
        ..., validation_alias=AliasChoices("suggestedValidation", "suggested_validation")
    )
    supportingCommentIds: List[str] = Field(
        default_factory=list,
        validation_alias=AliasChoices("supportingCommentIds", "supporting_comment_ids"),
    )
    frequencyScore: int = Field(0, validation_alias=AliasChoices("frequencyScore", "frequency_score"))
    confidence: str = Field(default="medium", description="high, medium, low")
    recommendedPriority: str = Field(
        default="P2", validation_alias=AliasChoices("recommendedPriority", "recommended_priority")
    )


class AIAnalysisResponse(BaseModel):
    """Comprehensive post-level AI research intelligence run."""

    model_config = ConfigDict(populate_by_name=True)

    id: str
    postId: str = Field(..., validation_alias=AliasChoices("postId", "post_id"))
    modelVersion: str = Field(..., validation_alias=AliasChoices("modelVersion", "model_version"))
    createdAt: str = Field(..., validation_alias=AliasChoices("createdAt", "created_at"))
    commentCountAnalyzed: int = Field(
        ..., validation_alias=AliasChoices("commentCountAnalyzed", "comment_count_analyzed")
    )
    totalCommentsAvailable: int = Field(
        ..., validation_alias=AliasChoices("totalCommentsAvailable", "total_comments_available")
    )
    discussionSummary: str = Field(
        ..., validation_alias=AliasChoices("discussionSummary", "discussion_summary")
    )
    themes: List[ThemeFinding] = Field(default_factory=list)
    disagreements: List[DisagreementFinding] = Field(default_factory=list)
    recommendations: List[RecommendationFinding] = Field(default_factory=list)
    limitationsAndUncertainty: str = Field(
        ..., validation_alias=AliasChoices("limitationsAndUncertainty", "limitations_and_uncertainty")
    )
    isCached: bool = Field(True, validation_alias=AliasChoices("isCached", "is_cached"))
    isStale: bool = Field(False, validation_alias=AliasChoices("isStale", "is_stale"))


# =============================================================================
# 3. Phase 4: Conversational Research Assistant & Suggestions Schemas
# =============================================================================
class ChatSessionCreateRequest(BaseModel):
    """Payload to create a new research chat session."""
    title: Optional[str] = Field(None, description="Optional title or initial question for the research session")


class ChatSessionUpdateRequest(BaseModel):
    """Payload to rename an existing research chat session."""
    title: str = Field(..., min_length=1, max_length=120, description="Updated session title")


class ChatSessionResponse(BaseModel):
    """Conversation session metadata for a specific post and user."""
    model_config = ConfigDict(populate_by_name=True)

    id: str
    postId: str = Field(..., validation_alias=AliasChoices("postId", "post_id"))
    userId: str = Field(..., validation_alias=AliasChoices("userId", "user_id"))
    title: str
    createdAt: str = Field(..., validation_alias=AliasChoices("createdAt", "created_at"))
    updatedAt: str = Field(..., validation_alias=AliasChoices("updatedAt", "updated_at"))
    messageCount: int = Field(0, validation_alias=AliasChoices("messageCount", "message_count"))


class ChatMessageRequest(BaseModel):
    """Question sent by an authenticated user to the research assistant."""
    question: str = Field(..., min_length=2, max_length=1500, description="Research question about the discussion")
    sourceType: str = Field("both", description="Selected source types: 'community', 'documents', or 'both'")
    includedDocIds: Optional[List[str]] = Field(None, description="Optional doc IDs to include in context")
    includeCommunity: bool = Field(True, description="Whether to include community comments in context")
    agentMode: Optional[str] = Field("analytical", description="Selected agent mode: 'analytical', 'professional', 'visual', or 'explorer'")


class ChatMessageResponse(BaseModel):
    """Individual conversation message turn with grounded citations."""
    model_config = ConfigDict(populate_by_name=True)

    id: str
    sessionId: str = Field(..., validation_alias=AliasChoices("sessionId", "session_id"))
    role: str = Field(..., description="user or assistant")
    content: str
    citations: List[CitationRecord] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    createdAt: str = Field(..., validation_alias=AliasChoices("createdAt", "created_at"))


class CrossSourceComparison(BaseModel):
    """Comparison between community user feedback and internal project documentation."""
    model_config = ConfigDict(populate_by_name=True)

    agreement: List[str] = Field(default_factory=list, description="Points where community feedback and documentation agree")
    contradiction: List[str] = Field(default_factory=list, description="Contradictions between feedback and specs/assumptions")
    missingDocumentation: List[str] = Field(
        default_factory=list,
        validation_alias=AliasChoices("missingDocumentation", "missing_documentation"),
        description="User concerns not addressed in uploaded documentation",
    )
    unverifiedAssumptions: List[str] = Field(
        default_factory=list,
        validation_alias=AliasChoices("unverifiedAssumptions", "unverified_assumptions"),
        description="Assumptions in specs unverified by customer feedback",
    )


class StructuredRecommendation(BaseModel):
    """Actionable recommendation directly motivated by evidence."""
    model_config = ConfigDict(populate_by_name=True)

    action: str = Field(..., description="Concrete product action proposed")
    reason: str = Field(..., description="Root cause or justification")
    evidence: str = Field(..., description="Supporting comment IDs or doc references")
    applicability: str = Field("core", description="Scope of applicability (e.g. all users, enterprise, mobile)")
    suggestedSuccessMeasure: str = Field(
        ...,
        validation_alias=AliasChoices("suggestedSuccessMeasure", "suggested_success_measure"),
        description="Measurable metric or validation check",
    )
    missingInformation: str = Field(
        "",
        validation_alias=AliasChoices("missingInformation", "missing_information"),
        description="Gaps in knowledge or unconfirmed details",
    )


class ResearchAnswerProposal(BaseModel):
    """Structured LLM output schema for conversational research questions."""
    direct_answer: str = Field(..., description="Clear, objective 2-4 sentence conversational answer to user's question")
    executive_summary: str = Field("", description="Concise executive summary of findings")
    key_findings: List[str] = Field(default_factory=list, description="Key thematic findings, issues, and opportunities")
    supporting_comment_ids: List[str] = Field(default_factory=list, description="IDs of comments directly supporting the answer")
    observed_facts: List[str] = Field(default_factory=list, description="Directly reported feedback observations")
    hypotheses_and_interpretations: List[str] = Field(default_factory=list, description="Product hypotheses or interpretations clearly separated from facts")
    cross_source_comparison: Optional[CrossSourceComparison] = Field(None, description="Cross-source synthesis between community feedback and internal specs")
    recommendations: List[StructuredRecommendation] = Field(default_factory=list, description="Actionable product recommendations")
    limitations_and_uncertainty: str = Field(..., description="Notes on evidence gaps, small sample size, or conflicting signals")
    suggested_follow_ups: List[str] = Field(default_factory=list, description="2-3 relevant follow-up research questions")
    visual_diagram: Optional[str] = Field(None, description="Mermaid diagram syntax (flowchart TD, sequenceDiagram, or classDiagram) illustrating the system architecture, state machine, or workflow")
    ui_mockup_concept: Optional[str] = Field(None, description="Detailed UI wireframe layout specification or component hierarchy")
    image_prompt: Optional[str] = Field(None, description="Detailed visual prompt for AI image generation (e.g. Midjourney/Imagen)")
    agent_mode: Optional[str] = Field("analytical", description="Agent persona used for generation: analytical, professional, visual, or explorer")


class ResearchAnswerResponse(BaseModel):
    """Validated, grounded assistant answer returned to the frontend."""
    model_config = ConfigDict(populate_by_name=True)

    userMessage: ChatMessageResponse = Field(..., validation_alias=AliasChoices("userMessage", "user_message"))
    assistantMessage: ChatMessageResponse = Field(..., validation_alias=AliasChoices("assistantMessage", "assistant_message"))
    directAnswer: str = Field("", validation_alias=AliasChoices("directAnswer", "direct_answer"))
    executiveSummary: str = Field("", validation_alias=AliasChoices("executiveSummary", "executive_summary"))
    keyFindings: List[str] = Field(default_factory=list, validation_alias=AliasChoices("keyFindings", "key_findings"))
    observedFacts: List[str] = Field(default_factory=list, validation_alias=AliasChoices("observedFacts", "observed_facts"))
    hypotheses: List[str] = Field(default_factory=list)
    crossSourceComparison: Optional[CrossSourceComparison] = Field(None, validation_alias=AliasChoices("crossSourceComparison", "cross_source_comparison"))
    recommendations: List[StructuredRecommendation] = Field(default_factory=list)
    limitations: str = ""
    suggestedFollowUps: List[str] = Field(default_factory=list, validation_alias=AliasChoices("suggestedFollowUps", "suggested_follow_ups"))
    hasSufficientEvidence: bool = Field(True, validation_alias=AliasChoices("hasSufficientEvidence", "has_sufficient_evidence"))
    communityEvidence: List[CitationRecord] = Field(default_factory=list, validation_alias=AliasChoices("communityEvidence", "community_evidence"))
    documentEvidence: List[CitationRecord] = Field(default_factory=list, validation_alias=AliasChoices("documentEvidence", "document_evidence"))
    stagesCompleted: List[str] = Field(default_factory=list, validation_alias=AliasChoices("stagesCompleted", "stages_completed"))
    deterministicMetrics: Dict[str, Any] = Field(default_factory=dict, validation_alias=AliasChoices("deterministicMetrics", "deterministic_metrics"))
    agentMode: str = Field("analytical", validation_alias=AliasChoices("agentMode", "agent_mode"))
    visualDiagram: Optional[str] = Field(None, validation_alias=AliasChoices("visualDiagram", "visual_diagram"))
    uiMockupConcept: Optional[str] = Field(None, validation_alias=AliasChoices("uiMockupConcept", "ui_mockup_concept"))
    imagePrompt: Optional[str] = Field(None, validation_alias=AliasChoices("imagePrompt", "image_prompt"))


class ScoreBreakdownSchema(BaseModel):
    """Transparent mathematical components of the prioritization score."""
    model_config = ConfigDict(populate_by_name=True)

    frequency: float
    severity: float
    consensus: float
    confidence: float
    totalScore: int = Field(..., validation_alias=AliasChoices("totalScore", "total_score"))


class ProductSuggestionResponse(BaseModel):
    """Actionable product opportunity recommendation with inspectable score."""
    model_config = ConfigDict(populate_by_name=True)

    id: str
    title: str
    category: str
    problemIdentified: str = Field(..., validation_alias=AliasChoices("problemIdentified", "problem_identified"))
    proposedInvestigation: str = Field(..., validation_alias=AliasChoices("proposedInvestigation", "proposed_investigation"))
    rationale: str
    evidenceCitations: List[CitationRecord] = Field(default_factory=list, validation_alias=AliasChoices("evidenceCitations", "evidence_citations"))
    uniqueMentionCount: int = Field(0, validation_alias=AliasChoices("uniqueMentionCount", "unique_mention_count"))
    scoreBreakdown: ScoreBreakdownSchema = Field(..., validation_alias=AliasChoices("scoreBreakdown", "score_breakdown"))
    priority: str = Field("P2", description="P0, P1, P2, P3")
    confidence: str = Field("medium", description="high, medium, low")
    metricOfSuccess: str = Field(..., validation_alias=AliasChoices("metricOfSuccess", "metric_of_success"))
    limitations: str

