"""API routes for Project Feedback Foundation (Phase 0 & 2)."""

from __future__ import annotations
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, File, UploadFile

from backend.app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectRead,
    FindingRead,
    FindingStatusUpdate,
    FeedbackReportRead,
    AIReviewStartRequest,
    AIReviewStatusResponse,
    FeedbackReportComparison,
    FindingComparisonItem,
    ReportExportResponse,
    PublicProjectRead,
    PublicUpvoteResponse,
    StructuredProjectFeedbackProposal,
    ProjectSourceRead,
    ProjectRepoLinkRequest,
    RAGQueryRequest,
    ProjectAIConfigRequest,
    CompletenessDecisionRequest,
    ProjectChatCreateRequest,
    ProjectChatMessageRequest,
    FindingActionRequest,
    TaskStatusUpdateRequest,
)
from backend.app.db.project_repository import project_repo
from backend.app.services.auth_service import get_current_user_optional, get_current_user_required
from backend.app.services.project_ai_review_engine import project_ai_engine
from backend.app.services.source_ingestion_service import source_ingestion_service
from backend.app.services.rag_engine import rag_engine
from backend.app.services.ai_orchestrator import ai_orchestrator
from backend.app.services.comprehensive_intelligence_service import comprehensive_intelligence
from backend.app.services.completeness_map_service import completeness_map_service
from backend.app.services.project_chat_service import project_chat_service

router = APIRouter(tags=["Projects"])


def get_user_id(user_claims: dict) -> str:
    return user_claims.get("sub") or user_claims.get("id")


@router.post("/projects", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    current_user: dict = Depends(get_current_user_required),
):
    """Creates a new private project record in Personal space."""
    user_id = get_user_id(current_user)
    created = project_repo.create_project(
        user_id=user_id,
        name=payload.name,
        tagline=payload.tagline,
        category=payload.category,
        description=payload.description or "",
        repository_url=payload.repository_url,
        demo_url=payload.demo_url,
        is_public=bool(payload.is_public),
    )
    return created


@router.get("/projects/personal", response_model=List[ProjectRead])
def list_personal_projects(
    status: Optional[str] = Query("all"),
    category: Optional[str] = Query("all"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user_required),
):
    """Lists private projects belonging to the authenticated user."""
    user_id = get_user_id(current_user)
    return project_repo.list_personal_projects(
        user_id=user_id,
        status_filter=status,
        category_filter=category,
        limit=limit,
        offset=offset,
    )


@router.get("/projects/public", response_model=List[PublicProjectRead])
def list_public_projects(
    category: Optional[str] = Query("all"),
    search: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """Lists projects published to the Public Explore feed via server-side public projection."""
    return project_repo.list_public_projects(
        category_filter=category,
        search_query=search,
        limit=limit,
        offset=offset,
    )


@router.get("/projects/public/{project_id}", response_model=PublicProjectRead)
def get_public_project(project_id: str):
    """Retrieves a single published project via public data projection (404 if private)."""
    return project_repo.get_public_project(project_id)


@router.get("/projects/public/{project_id}/report", response_model=Optional[FeedbackReportRead])
def get_public_feedback_report(project_id: str):
    """Fetches the public feedback report for a published project (404 if private)."""
    return project_repo.get_public_feedback_report(project_id)


@router.post("/projects/public/{project_id}/upvote", response_model=PublicUpvoteResponse)
def upvote_public_project(
    project_id: str,
    current_user: dict = Depends(get_current_user_required),
):
    """Upvotes or toggles upvote for a published public project (Authenticated users)."""
    user_id = get_user_id(current_user)
    return project_repo.upvote_public_project(project_id, user_id)


@router.get("/projects/{project_id}", response_model=ProjectRead)
def get_project(
    project_id: str,
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    """Retrieves project details if public or if caller is the owner."""
    user_id = get_user_id(current_user) if current_user else None
    return project_repo.get_project(project_id, requesting_user_id=user_id)


@router.patch("/projects/{project_id}", response_model=ProjectRead)
def update_project(
    project_id: str,
    payload: ProjectUpdate,
    current_user: dict = Depends(get_current_user_required),
):
    """Updates project information and context (Owner only)."""
    user_id = get_user_id(current_user)
    updates = payload.model_dump(exclude_unset=True)
    return project_repo.update_project(project_id, user_id, updates)


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: str,
    current_user: dict = Depends(get_current_user_required),
):
    """Permanently deletes a project (Owner only)."""
    user_id = get_user_id(current_user)
    project_repo.delete_project(project_id, user_id)
    return None


@router.patch("/findings/{finding_id}/status", response_model=FindingRead)
def update_finding_status(
    finding_id: str,
    payload: FindingStatusUpdate,
    current_user: dict = Depends(get_current_user_required),
):
    """Updates finding resolution status (e.g. Open -> Addressed) (Owner only)."""
    user_id = get_user_id(current_user)
    return project_repo.update_finding_status(finding_id, user_id, payload.status)


@router.post("/projects/{project_id}/review/start", response_model=AIReviewStatusResponse)
def start_ai_review(
    project_id: str,
    payload: AIReviewStartRequest = AIReviewStartRequest(),
    current_user: dict = Depends(get_current_user_required),
):
    """Initiates an AI review run for the specified project (Owner only)."""
    user_id = get_user_id(current_user)
    return project_ai_engine.start_review(project_id, user_id, payload)


@router.get("/projects/{project_id}/reviews/{review_id}/status", response_model=AIReviewStatusResponse)
def get_ai_review_status(
    project_id: str,
    review_id: str,
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    """Fetches real-time status and metadata for an AI review session."""
    user_id = get_user_id(current_user) if current_user else None
    return project_repo.get_ai_review(review_id, requesting_user_id=user_id)


@router.get("/projects/{project_id}/report", response_model=Optional[FeedbackReportRead])
def get_latest_feedback_report(
    project_id: str,
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    """Fetches the latest synthesized AI feedback report and findings for a project."""
    user_id = get_user_id(current_user) if current_user else None
    return project_repo.get_latest_feedback_report_for_project(project_id, requesting_user_id=user_id)


@router.get("/projects/{project_id}/reviews", response_model=List[AIReviewStatusResponse])
def list_project_reviews(
    project_id: str,
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    """Lists historical AI review runs for a project."""
    user_id = get_user_id(current_user) if current_user else None
    return project_repo.list_project_reviews(project_id, requesting_user_id=user_id)


@router.get("/projects/{project_id}/reports", response_model=List[FeedbackReportRead])
def list_project_reports(
    project_id: str,
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    """Lists all historical feedback reports generated for a project."""
    user_id = get_user_id(current_user) if current_user else None
    return project_repo.list_feedback_reports_for_project(project_id, requesting_user_id=user_id)


@router.get("/projects/{project_id}/reports/compare", response_model=FeedbackReportComparison)
def compare_feedback_reports(
    project_id: str,
    base_id: str = Query(..., description="Base (earlier) report ID"),
    target_id: str = Query(..., description="Target (later) report ID"),
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    """Compares two feedback reports for the same project to track resolved and new findings."""
    user_id = get_user_id(current_user) if current_user else None
    base_report = project_repo.get_feedback_report_for_project(project_id, base_id, requesting_user_id=user_id)
    target_report = project_repo.get_feedback_report_for_project(project_id, target_id, requesting_user_id=user_id)

    base_map = {f["title"].strip().lower(): f for f in base_report["findings"]}
    target_map = {f["title"].strip().lower(): f for f in target_report["findings"]}

    comparison_items: List[FindingComparisonItem] = []
    resolved = 0
    new_findings = 0
    persisted = 0

    for key, tf in target_map.items():
        if key in base_map:
            bf = base_map[key]
            if bf["status"] != "addressed" and tf["status"] == "addressed":
                change = "resolved"
                resolved += 1
            elif bf["status"] == "addressed" and tf["status"] != "addressed":
                change = "reopened"
            else:
                change = "persisted"
                persisted += 1
            comparison_items.append(
                FindingComparisonItem(
                    finding_id=tf["id"],
                    title=tf["title"],
                    severity=tf["severity"],
                    category=tf["category"],
                    status_in_base=bf["status"],
                    status_in_target=tf["status"],
                    change_type=change,
                )
            )
        else:
            new_findings += 1
            comparison_items.append(
                FindingComparisonItem(
                    finding_id=tf["id"],
                    title=tf["title"],
                    severity=tf["severity"],
                    category=tf["category"],
                    status_in_base=None,
                    status_in_target=tf["status"],
                    change_type="new",
                )
            )

    # Check for base findings absent in target report (resolved by omission)
    for key, bf in base_map.items():
        if key not in target_map:
            resolved += 1
            comparison_items.append(
                FindingComparisonItem(
                    finding_id=bf["id"],
                    title=bf["title"],
                    severity=bf["severity"],
                    category=bf["category"],
                    status_in_base=bf["status"],
                    status_in_target=None,
                    change_type="resolved",
                )
            )

    return FeedbackReportComparison(
        project_id=project_id,
        base_report_id=base_id,
        target_report_id=target_id,
        total_findings_delta=target_report["totalFindingsCount"] - base_report["totalFindingsCount"],
        resolved_count=resolved,
        new_count=new_findings,
        persisted_count=persisted,
        items=comparison_items,
    )


@router.get("/projects/{project_id}/reports/{report_id}", response_model=FeedbackReportRead)
def get_project_report(
    project_id: str,
    report_id: str,
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    """Fetches a specific historical feedback report for a project."""
    user_id = get_user_id(current_user) if current_user else None
    return project_repo.get_feedback_report_for_project(project_id, report_id, requesting_user_id=user_id)


@router.get("/projects/{project_id}/reviews/{review_id}/report", response_model=Optional[FeedbackReportRead])
def get_report_by_review(
    project_id: str,
    review_id: str,
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    """Fetches the feedback report generated by a specific review run."""
    user_id = get_user_id(current_user) if current_user else None
    return project_repo.get_feedback_report_by_review_id(project_id, review_id, requesting_user_id=user_id)


@router.get("/projects/{project_id}/report/export", response_model=ReportExportResponse)
def export_feedback_report(
    project_id: str,
    report_id: Optional[str] = Query(None, description="Optional specific report ID; defaults to latest"),
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    """Exports a feedback report as sanitized, permission-verified Markdown."""
    user_id = get_user_id(current_user) if current_user else None
    markdown_content = project_repo.generate_report_markdown_export(project_id, report_id, requesting_user_id=user_id)
    target_report = (
        project_repo.get_feedback_report_for_project(project_id, report_id, requesting_user_id=user_id)
        if report_id
        else project_repo.get_latest_feedback_report_for_project(project_id, requesting_user_id=user_id)
    )
    safe_id = target_report["id"] if target_report else "latest"
    return ReportExportResponse(
        project_id=project_id,
        report_id=safe_id,
        format="markdown",
        filename=f"feedback-report-{project_id[:8]}-{safe_id[:8]}.md",
        content=markdown_content,
    )


# =============================================================================
# Phase 4: Project Source Ingestion Endpoints
# =============================================================================

@router.post("/projects/{project_id}/sources/upload", response_model=List[ProjectSourceRead], status_code=status.HTTP_201_CREATED)
async def upload_project_source_file(
    project_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user_required),
):
    """Uploads and ingests a source file or ZIP archive into project sources and indexes into RAG."""
    user_id = get_user_id(current_user)
    _ = project_repo.get_project(project_id, requesting_user_id=user_id)

    file_bytes = await file.read()
    sources = source_ingestion_service.ingest_uploaded_file(
        project_id=project_id,
        owner_id=user_id,
        filename=file.filename or "upload.txt",
        content_bytes=file_bytes,
        mime_type=file.content_type,
    )
    for s in sources:
        rag_engine.index_project_source(s)

    return sources


@router.post("/projects/{project_id}/sources/repository", response_model=List[ProjectSourceRead], status_code=status.HTTP_201_CREATED)
def link_project_repository(
    project_id: str,
    payload: ProjectRepoLinkRequest,
    current_user: dict = Depends(get_current_user_required),
):
    """Inspects a public GitHub or GitLab repository and ingests source and architecture specs into RAG."""
    user_id = get_user_id(current_user)
    _ = project_repo.get_project(project_id, requesting_user_id=user_id)

    sources = source_ingestion_service.ingest_git_repository(
        project_id=project_id,
        owner_id=user_id,
        repo_url=payload.repository_url,
    )
    for s in sources:
        rag_engine.index_project_source(s)

    return sources


@router.get("/projects/{project_id}/sources", response_model=List[ProjectSourceRead])
def list_project_sources(
    project_id: str,
    current_user: dict = Depends(get_current_user_required),
):
    """Lists all active source files ingested for a project."""
    user_id = get_user_id(current_user)
    _ = project_repo.get_project(project_id, requesting_user_id=user_id)
    return source_ingestion_service.list_project_sources(project_id, owner_id=user_id)


@router.delete("/projects/{project_id}/sources/{source_id}")
def delete_project_source(
    project_id: str,
    source_id: str,
    current_user: dict = Depends(get_current_user_required),
):
    """Deletes (soft deletes) an ingested source file from a project."""
    user_id = get_user_id(current_user)
    _ = project_repo.get_project(project_id, requesting_user_id=user_id)
    success = source_ingestion_service.delete_project_source(source_id=source_id, owner_id=user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Source not found or unauthorized.")
    return {"deleted": True, "sourceId": source_id}


# =============================================================================
# Phase 5: Advanced RAG Retrieval Endpoints
# =============================================================================

@router.post("/projects/{project_id}/rag/query")
def query_project_rag(
    project_id: str,
    payload: RAGQueryRequest,
    current_user: dict = Depends(get_current_user_required),
):
    """Executes hybrid BM25 and dense semantic retrieval across project and reference knowledge bases."""
    user_id = get_user_id(current_user)
    _ = project_repo.get_project(project_id, requesting_user_id=user_id)
    results = rag_engine.hybrid_search(
        project_id=project_id,
        query=payload.query,
        top_k=payload.top_k,
        include_reference_kb=payload.include_reference,
    )
    return [
        {
            "chunkId": r.chunk_id,
            "sourceId": r.source_id,
            "sourceName": r.source_name,
            "cleanQuote": r.clean_quote,
            "knowledgeBase": r.knowledge_base,
            "score": r.score,
            "relevancePercentage": r.relevance_percentage,
            "pageNumber": r.page_number,
            "sectionHeading": r.section_heading,
            "lineRange": r.line_range,
        }
        for r in results
    ]


# =============================================================================
# Phase 6: AI Provider Orchestration & Usage Ledger Endpoints
# =============================================================================

@router.get("/projects/{project_id}/ai-config")
def get_project_ai_config(
    project_id: str,
    current_user: dict = Depends(get_current_user_required),
):
    """Retrieves AI provider preferences and task configurations for a project."""
    user_id = get_user_id(current_user)
    _ = project_repo.get_project(project_id, requesting_user_id=user_id)
    return ai_orchestrator.get_project_ai_config(project_id)


@router.post("/projects/{project_id}/ai-config")
def set_project_ai_config(
    project_id: str,
    payload: ProjectAIConfigRequest,
    current_user: dict = Depends(get_current_user_required),
):
    """Configures primary and fallback AI providers for a project task."""
    user_id = get_user_id(current_user)
    _ = project_repo.get_project(project_id, requesting_user_id=user_id)
    return ai_orchestrator.set_project_ai_config(
        project_id=project_id,
        user_id=user_id,
        task_type=payload.task_type,
        primary_provider=payload.primary_provider,
        fallback_provider=payload.fallback_provider,
        model_override=payload.model_override,
    )


@router.get("/projects/{project_id}/usage")
def get_project_ai_usage(
    project_id: str,
    current_user: dict = Depends(get_current_user_required),
):
    """Returns aggregated token usage, cost ledger, and average latency metrics for a project."""
    user_id = get_user_id(current_user)
    _ = project_repo.get_project(project_id, requesting_user_id=user_id)
    return ai_orchestrator.get_project_usage_summary(project_id)


# =============================================================================
# Phase 7: Comprehensive AI Intelligence Endpoints
# =============================================================================

@router.post("/projects/{project_id}/audit", response_model=StructuredProjectFeedbackProposal)
def run_comprehensive_project_audit(
    project_id: str,
    review_mode: str = Query("comprehensive", pattern="^(immediate|comprehensive|guided_discovery)$"),
    roles: Optional[List[str]] = Query(None),
    current_user: dict = Depends(get_current_user_required),
):
    """Executes a multi-role specialized technical audit across Architect, Product, Code, and UX domains."""
    user_id = get_user_id(current_user)
    project = project_repo.get_project(project_id, requesting_user_id=user_id)
    return comprehensive_intelligence.run_multi_role_audit(
        project=project,
        review_mode=review_mode,
        focus_roles=roles,
        user_id=user_id,
    )


@router.get("/projects/{project_id}/discovery-questions")
def get_guided_discovery_questions(
    project_id: str,
    current_user: dict = Depends(get_current_user_required),
):
    """Generates structured architectural discovery questions tailored to project category and specs."""
    user_id = get_user_id(current_user)
    project = project_repo.get_project(project_id, requesting_user_id=user_id)
    return comprehensive_intelligence.generate_guided_discovery_questions(project)


# =============================================================================
# Phase 8: Product Completeness Map Endpoints
# =============================================================================

@router.get("/projects/{project_id}/completeness-map")
def get_product_completeness_map(
    project_id: str,
    current_user: dict = Depends(get_current_user_required),
):
    """Builds and returns the product completeness knowledge graph, tree hierarchy, and gap matrix."""
    user_id = get_user_id(current_user)
    project = project_repo.get_project(project_id, requesting_user_id=user_id)
    return completeness_map_service.build_completeness_map(project)


@router.post("/projects/{project_id}/completeness-map/decisions")
def record_author_decision(
    project_id: str,
    payload: CompletenessDecisionRequest,
    current_user: dict = Depends(get_current_user_required),
):
    """Records an author decision (approved, dismissed, deferred) for a completeness graph node."""
    user_id = get_user_id(current_user)
    _ = project_repo.get_project(project_id, requesting_user_id=user_id)
    return completeness_map_service.record_author_decision(
        project_id=project_id,
        user_id=user_id,
        node_id=payload.node_id,
        decision_type=payload.decision,
        rationale=payload.rationale or "",
    )


# =============================================================================
# Phase 9: Project Chat, Findings Actions, and Improvement Tasks
# =============================================================================

@router.get("/projects/{project_id}/chats")
def list_project_chats(
    project_id: str,
    current_user: dict = Depends(get_current_user_required),
):
    """Lists persistent project chat sessions."""
    user_id = get_user_id(current_user)
    _ = project_repo.get_project(project_id, requesting_user_id=user_id)
    return project_chat_service.list_chats(project_id=project_id, user_id=user_id)


@router.post("/projects/{project_id}/chats", status_code=status.HTTP_201_CREATED)
def create_project_chat(
    project_id: str,
    payload: ProjectChatCreateRequest,
    current_user: dict = Depends(get_current_user_required),
):
    """Creates a new scoped chat session (project_wide, review, or finding)."""
    user_id = get_user_id(current_user)
    _ = project_repo.get_project(project_id, requesting_user_id=user_id)
    return project_chat_service.create_chat(
        project_id=project_id,
        user_id=user_id,
        title=payload.title,
        chat_scope=payload.chat_scope,
        target_review_id=payload.target_review_id,
        target_finding_id=payload.target_finding_id,
    )


@router.get("/projects/{project_id}/chats/{chat_id}")
def get_project_chat(
    project_id: str,
    chat_id: str,
    current_user: dict = Depends(get_current_user_required),
):
    """Fetches chat session message history with classified intent and citations."""
    user_id = get_user_id(current_user)
    _ = project_repo.get_project(project_id, requesting_user_id=user_id)
    return project_chat_service.get_chat(chat_id=chat_id, user_id=user_id)


@router.post("/projects/{project_id}/chats/{chat_id}/messages")
def send_project_chat_message(
    project_id: str,
    chat_id: str,
    payload: ProjectChatMessageRequest,
    current_user: dict = Depends(get_current_user_required),
):
    """Sends a message, retrieves context via RAG, generates assistant response, and classifies message."""
    user_id = get_user_id(current_user)
    _ = project_repo.get_project(project_id, requesting_user_id=user_id)
    return project_chat_service.send_message(
        chat_id=chat_id,
        user_id=user_id,
        content=payload.content,
    )


@router.post("/projects/{project_id}/findings/{finding_id}/actions")
def take_finding_action(
    project_id: str,
    finding_id: str,
    payload: FindingActionRequest,
    current_user: dict = Depends(get_current_user_required),
):
    """Applies author action (accept, edit, reject, defer) to a finding and creates an improvement task."""
    user_id = get_user_id(current_user)
    _ = project_repo.get_project(project_id, requesting_user_id=user_id)
    return project_chat_service.take_finding_action(
        project_id=project_id,
        finding_id=finding_id,
        user_id=user_id,
        action=payload.action,
        custom_recommendation=payload.custom_recommendation,
        rationale=payload.rationale,
    )


@router.get("/projects/{project_id}/tasks")
def list_improvement_tasks(
    project_id: str,
    current_user: dict = Depends(get_current_user_required),
):
    """Lists improvement tasks created from AI findings for a project."""
    user_id = get_user_id(current_user)
    _ = project_repo.get_project(project_id, requesting_user_id=user_id)
    return project_chat_service.list_improvement_tasks(project_id=project_id, user_id=user_id)


@router.patch("/projects/{project_id}/tasks/{task_id}")
def update_task_status(
    project_id: str,
    task_id: str,
    payload: TaskStatusUpdateRequest,
    current_user: dict = Depends(get_current_user_required),
):
    """Updates the progress status of an improvement task."""
    user_id = get_user_id(current_user)
    _ = project_repo.get_project(project_id, requesting_user_id=user_id)
    return project_chat_service.update_task_status(
        task_id=task_id,
        user_id=user_id,
        new_status=payload.status,
    )


@router.post("/projects/{project_id}/tasks/{task_id}/verify")
def verify_task_implementation(
    project_id: str,
    task_id: str,
    current_user: dict = Depends(get_current_user_required),
):
    """Runs automated AI verification against project sources to verify if a task is solved."""
    user_id = get_user_id(current_user)
    _ = project_repo.get_project(project_id, requesting_user_id=user_id)
    return project_chat_service.verify_task_implementation(
        task_id=task_id,
        user_id=user_id,
    )




