"""API routes for Project Feedback Foundation (Phase 0 & 2)."""

from __future__ import annotations
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

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
)
from backend.app.db.project_repository import project_repo
from backend.app.services.auth_service import get_current_user_optional, get_current_user_required
from backend.app.services.project_ai_review_engine import project_ai_engine

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



