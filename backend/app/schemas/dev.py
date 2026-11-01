"""Pydantic schemas for Phase 5 Developer Workspace, AI Testing Lab & Evaluation."""

from __future__ import annotations

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# -----------------------------------------------------------------------------
# System & Service Health
# -----------------------------------------------------------------------------
class ServiceHealth(BaseModel):
    name: str
    status: str = Field(..., description="operational | degraded | offline")
    details: Dict[str, Any] = Field(default_factory=dict)


class ProviderHealth(BaseModel):
    provider: str
    status: str = Field(..., description="configured | unconfigured | degraded")
    model: str
    api_key_configured: bool
    latency_ms: Optional[float] = None
    last_checked: Optional[str] = None


class RecentAIRun(BaseModel):
    id: str
    post_id: str
    post_title: Optional[str] = None
    provider: str
    model: str
    status: str
    analyzed_comment_count: int
    created_at: str
    completed_at: Optional[str] = None
    error_message: Optional[str] = None


class DevHealthResponse(BaseModel):
    status: str = "operational"
    environment: str
    app_version: str
    auth_mode: str
    frontend: Dict[str, Any]
    backend: Dict[str, Any]
    database: Dict[str, Any]
    gemini_provider: ProviderHealth
    groq_provider: ProviderHealth
    synthetic_data_status: Dict[str, Any]
    recent_runs: List[RecentAIRun] = Field(default_factory=list)
    recent_errors: List[Dict[str, Any]] = Field(default_factory=list)


# -----------------------------------------------------------------------------
# Synthetic Data Management
# -----------------------------------------------------------------------------
class SyntheticDataStats(BaseModel):
    is_seeded: bool
    post_count: int
    comment_count: int
    document_count: int
    synthetic_posts: List[Dict[str, Any]] = Field(default_factory=list)


class SyntheticDataActionResponse(BaseModel):
    action: str
    success: bool
    message: str
    stats: SyntheticDataStats
    fixtures_json: Optional[Dict[str, Any]] = None


# -----------------------------------------------------------------------------
# AI Testing Lab
# -----------------------------------------------------------------------------
class AITestCaseRequest(BaseModel):
    category: str = Field(
        ...,
        description=(
            "complaints | improvements | friction | opportunities | prd_comparison | "
            "architecture | insufficient_evidence | follow_up | doc_selection | "
            "empty_input | long_input | malformed_input | prompt_injection"
        ),
    )
    post_id: Optional[str] = None
    query: Optional[str] = None
    source_filter: str = Field("both", description="both | community | documents")
    selected_doc_ids: Optional[List[str]] = None
    provider: str = Field("auto", description="auto | gemini | groq")


class RetrievedEvidenceItem(BaseModel):
    id: str
    type: str = Field(..., description="comment | document_chunk")
    source_title: str
    snippet: str
    similarity_score: float
    relevance_reason: Optional[str] = None


class CitationVerification(BaseModel):
    id: str
    type: str
    verified: bool
    snippet: str
    source_title: str


class AITestCaseResult(BaseModel):
    test_id: str
    category: str
    status: str = Field(..., description="pass | warn | fail")
    execution_latency_ms: float
    provider_used: str
    model_used: str
    inputs: Dict[str, Any]
    retrieved_evidence: List[RetrievedEvidenceItem] = Field(default_factory=list)
    generated_response: str
    citations: List[CitationVerification] = Field(default_factory=list)
    validation: Dict[str, Any] = Field(
        ...,
        description="Groundedness, citation accuracy, unsupported claims, outcome explanation",
    )
    errors: List[str] = Field(default_factory=list)


# -----------------------------------------------------------------------------
# AI Evaluation & Benchmark
# -----------------------------------------------------------------------------
class EvaluationMetric(BaseModel):
    name: str
    score: float
    scale: str
    metric_type: str = Field(..., description="automated | benchmark | human_relevance")
    description: str


class ProviderComparisonStat(BaseModel):
    provider: str
    model: str
    avg_latency_ms: float
    retrieval_mrr: float
    citation_correctness_rate: float
    groundedness_score: float
    unsupported_claim_rate: float
    failure_rate: float


class EvaluationBenchmarkResponse(BaseModel):
    timestamp: str
    total_cases: int
    passed_cases: int
    metrics: List[EvaluationMetric]
    retrieval_recall_at_5: float
    retrieval_mrr: float
    citation_correctness_rate: float
    evidence_coverage: float
    groundedness_score: float
    unsupported_claim_rate: float
    human_relevance_rating: float
    avg_latency_ms: float
    p95_latency_ms: float
    provider_failure_rate: float
    schema_validation_failure_rate: float
    case_results: List[Dict[str, Any]]
    provider_comparison: List[ProviderComparisonStat]


# -----------------------------------------------------------------------------
# Developer Quick-Auth
# -----------------------------------------------------------------------------
class DevQuickTokenRequest(BaseModel):
    account_type: str = Field("creator", description="creator | visitor | moderator")


class DevQuickTokenResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    user_id: str
    email: str
    username: str
    display_name: str
    role: str
