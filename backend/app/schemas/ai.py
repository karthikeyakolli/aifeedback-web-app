"""Pydantic schemas for AI Research Intelligence."""

from __future__ import annotations

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class CitationRecord(BaseModel):
    """Verifiable citation linking to a real comment."""

    comment_id: str
    quote_snippet: str
    author_display: str


class ThemeFinding(BaseModel):
    """Recurring feedback theme with evidence."""

    theme_name: str
    category: str = Field(..., description="complaint, praise, feature_request, friction")
    summary: str
    supporting_comment_ids: List[str]
    citations: List[CitationRecord] = Field(default_factory=list)
    comment_count: int
    severity: str = Field(default="medium", description="high, medium, low")


class DisagreementFinding(BaseModel):
    """Contrasting or conflicting community opinions."""

    topic: str
    perspective_a: str
    supporting_ids_a: List[str]
    perspective_b: str
    supporting_ids_b: List[str]
    takeaway: str


class RecommendationFinding(BaseModel):
    """Evidence-backed product suggestion."""

    title: str
    problem_addressed: str
    rationale: str
    suggested_validation: str
    supporting_comment_ids: List[str]
    frequency_score: int
    confidence: str = Field(default="medium", description="high, medium, low")
    recommended_priority: str = Field(default="P2", description="P0, P1, P2, P3")


class AIAnalysisResponse(BaseModel):
    """Comprehensive post-level AI research intelligence run."""

    id: str
    post_id: str
    model_version: str
    created_at: str
    comment_count_analyzed: int
    discussion_summary: str
    themes: List[ThemeFinding] = Field(default_factory=list)
    disagreements: List[DisagreementFinding] = Field(default_factory=list)
    recommendations: List[RecommendationFinding] = Field(default_factory=list)
    limitations_and_uncertainty: str
    is_cached: bool = True
