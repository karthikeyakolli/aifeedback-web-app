"""AI Research Intelligence and Feedback Synthesis API Endpoints."""

from __future__ import annotations

import logging
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

from backend.app.schemas.ai import (
    AIAnalysisResponse,
    ChatMessageRequest,
    ChatMessageResponse,
    ChatSessionCreateRequest,
    ChatSessionResponse,
    ChatSessionUpdateRequest,
    ProductSuggestionResponse,
    ResearchAnswerResponse,
)
from backend.app.schemas.research_report import (
    ResearchReportType,
    ReportGenerateRequest,
    ReportUpdateRequest,
    ResearchReportResponse,
)
from backend.app.schemas.product_review import (
    GenerateReviewRequest,
    ProductReviewResponse,
    ReviewSourceAvailabilityResponse,
)
from backend.app.services.auth_service import get_current_user_required, get_current_user_optional
from backend.app.services.analysis_service import analysis_service, flatten_comments_tree
from backend.app.services.chat_service import chat_service
from backend.app.services.suggestion_service import suggestion_service
from backend.app.services.report_generation_service import report_generation_service
from backend.app.services.review_service import review_service
from backend.app.services.gemini_service import (
    GeminiConfigurationError,
    GeminiRateLimitError,
    GeminiTimeoutError,
    LLMProviderError,
)
from backend.app.db.repository import community_repo
from backend.app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["AI Research Intelligence"])


@router.get("/{post_id}/insights", response_model=AIAnalysisResponse)
async def get_post_insights(
    post_id: str,
    user: Optional[Dict[str, Any]] = Depends(get_current_user_optional),
) -> AIAnalysisResponse:
    """Retrieves the latest verified AI research insights for a published post.

    Publicly readable by all users once generated.
    """
    insights = analysis_service.get_latest_insights(post_id)
    if not insights:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No AI analysis run found for this post. Analysis engine (Phase 3) can generate insights via POST /api/v1/ai/{post_id}/analyze.",
        )

    return insights



@router.post("/{post_id}/analyze", response_model=AIAnalysisResponse)
async def trigger_post_analysis(
    post_id: str,
    force_refresh: bool = Query(False, description="Bypass cache and force fresh synthesis"),
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> AIAnalysisResponse:
    """Triggers or refreshes evidence-grounded AI feedback synthesis for a post.

    Restricted strictly to the post author or an authorized moderator.
    Enforces per-post analysis cooldowns to prevent resource exhaustion.
    """
    post = community_repo.get_post(post_id)
    if not post:
        raise HTTPException(status_code=404, detail=f"Post '{post_id}' not found.")

    # Authorization Check: Author or Moderator only
    profile = community_repo.get_profile(user["sub"]) or {}
    is_author = post.get("author", {}).get("id") == user["sub"]
    # Check internal raw author_id from DB if masked in response
    if not is_author:
        with community_repo.db.session() as conn:
            raw_post = conn.execute("SELECT author_id FROM posts WHERE id = ?", (post_id,)).fetchone()
            if raw_post and raw_post["author_id"] == user["sub"]:
                is_author = True

    is_moderator = profile.get("isModerator", False)

    if not is_author and not is_moderator:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden. Only the post author or an authorized moderator can trigger AI analysis.",
        )

    # Cooldown Check: Prevent rapid re-triggering
    remaining_cooldown = community_repo.get_analysis_cooldown_remaining(
        post_id=post_id, cooldown_seconds=settings.ai_cooldown_seconds
    )
    if remaining_cooldown > 0 and force_refresh:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Analysis cooldown active. Please wait {remaining_cooldown} seconds before requesting a fresh synthesis.",
        )

    # Execute Analysis Pipeline with Safe Error Mapping
    try:
        analysis_result = analysis_service.analyze_post(
            post_id=post_id,
            requested_by=user["sub"],
            force_refresh=force_refresh,
        )
        # Social Translucence & Proactive Feedback: notify requester of AI completion
        try:
            community_repo.create_notification(
                user_id=user["sub"],
                actor_id=None,
                type="ai_ready",
                title="AI Research Synthesis Ready",
                message=f'Analysis complete for "{post.get("title", "Discussion")[:40]}". Themes & PRD recommendations available.',
                link_url=f"/posts/{post_id}",
            )
        except Exception as notif_err:
            logger.warning("Failed to emit notification on analysis completion: %s", notif_err)

        return analysis_result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except GeminiConfigurationError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=e.message)
    except GeminiRateLimitError as e:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=e.message)
    except GeminiTimeoutError as e:
        raise HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail=e.message)
    except LLMProviderError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        logger.error("Unhandled error during AI post analysis: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI analysis synthesis failed. Please try again later.",
        )


# =============================================================================
# Phase 4: Conversational Research Assistant & Suggestions Endpoints
# =============================================================================

@router.post("/{post_id}/chat/sessions", response_model=ChatSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_chat_session(
    post_id: str,
    payload: Optional[ChatSessionCreateRequest] = None,
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> ChatSessionResponse:
    """Creates a new conversational research session for the authenticated user and post."""
    title = payload.title if payload else None
    return chat_service.create_session(post_id=post_id, user_id=user["sub"], title=title)


@router.get("/{post_id}/chat/sessions", response_model=list[ChatSessionResponse])
async def list_chat_sessions(
    post_id: str,
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> list[ChatSessionResponse]:
    """Lists all research chat sessions belonging to the authenticated user for this post."""
    return chat_service.list_sessions(post_id=post_id, user_id=user["sub"])


@router.get("/chat/sessions/{session_id}", response_model=Dict[str, Any])
async def get_chat_session(
    session_id: str,
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> Dict[str, Any]:
    """Retrieves session details and its message history, enforcing ownership."""
    return chat_service.get_session(session_id=session_id, user_id=user["sub"])


@router.put("/chat/sessions/{session_id}", response_model=ChatSessionResponse)
async def rename_chat_session(
    session_id: str,
    payload: ChatSessionUpdateRequest,
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> ChatSessionResponse:
    """Renames an active research chat session, enforcing ownership."""
    return chat_service.rename_session(session_id=session_id, user_id=user["sub"], title=payload.title)


@router.delete("/chat/sessions/{session_id}", status_code=status.HTTP_200_OK)
async def delete_chat_session(
    session_id: str,
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> Dict[str, bool]:
    """Deletes a research chat session and its message history, enforcing ownership."""
    chat_service.delete_session(session_id=session_id, user_id=user["sub"])
    return {"success": True}


@router.post("/chat/sessions/{session_id}/messages", response_model=ResearchAnswerResponse)
async def send_chat_message(
    session_id: str,
    payload: ChatMessageRequest,
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> ResearchAnswerResponse:
    """Sends a research question, runs RAG retrieval, invokes LLM, validates citations, and persists turn."""
    try:
        return chat_service.send_message(
            session_id=session_id,
            user_id=user["sub"],
            question=payload.question,
            included_doc_ids=payload.includedDocIds,
            include_community=payload.includeCommunity,
            source_type=payload.sourceType or "both",
            agent_mode=payload.agentMode or "analytical",
        )
    except HTTPException:
        raise
    except GeminiConfigurationError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=e.message)
    except GeminiRateLimitError as e:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=e.message)
    except GeminiTimeoutError as e:
        raise HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail=e.message)
    except LLMProviderError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        logger.error("Unhandled error during research chat turn: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI research assistant encountered an error. Please try again.",
        )


@router.get("/{post_id}/suggestions", response_model=list[ProductSuggestionResponse])
async def get_product_suggestions(
    post_id: str,
    user: Optional[Dict[str, Any]] = Depends(get_current_user_optional),
) -> list[ProductSuggestionResponse]:
    """Retrieves evidence-grounded product improvement suggestions with deterministic prioritization scores."""
    post = community_repo.get_post(post_id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Post '{post_id}' not found.")

    raw_comments = community_repo.list_comments_for_post(post_id)
    flat_comments = flatten_comments_tree(raw_comments)

    latest_run = community_repo.get_latest_analysis_run(post_id)
    analysis_dict = latest_run.get("resultData") if latest_run else None

    suggestions = suggestion_service.generate_suggestions(
        post=post,
        comments=flat_comments,
        analysis_run=analysis_dict,
    )
    return [ProductSuggestionResponse.model_validate(s) for s in suggestions]


# -----------------------------------------------------------------------------
# Phase 5: Research Reports & PRD Documents
# -----------------------------------------------------------------------------

@router.post("/{post_id}/reports/generate", response_model=ResearchReportResponse, status_code=status.HTTP_201_CREATED)
async def generate_research_report(
    post_id: str,
    payload: ReportGenerateRequest,
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> ResearchReportResponse:
    """Generates an evidence-backed research report, PRD draft, ticket, or UX brief."""
    post = community_repo.get_post(post_id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Post '{post_id}' not found.")

    try:
        report = report_generation_service.generate_report(
            post_id=post_id,
            owner_id=user["sub"],
            report_type=payload.reportType,
            custom_focus=payload.customFocus,
            title_override=payload.title,
        )
        return ResearchReportResponse.model_validate(report)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error("Unhandled error generating research report: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate research report. Please try again.",
        )


@router.get("/{post_id}/reports", response_model=List[ResearchReportResponse])
async def list_user_reports_for_post(
    post_id: str,
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> List[ResearchReportResponse]:
    """Lists research reports owned by the requesting user for a given post."""
    post = community_repo.get_post(post_id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Post '{post_id}' not found.")

    reports = community_repo.list_research_reports(post_id=post_id, owner_id=user["sub"])
    return [ResearchReportResponse.model_validate(r) for r in reports]


@router.get("/reports/{report_id}", response_model=ResearchReportResponse)
async def get_research_report(
    report_id: str,
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> ResearchReportResponse:
    """Retrieves a specific research report, enforcing strict user ownership boundaries."""
    report = community_repo.get_research_report(report_id=report_id, owner_id=user["sub"])
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found or access unauthorized.",
        )
    return ResearchReportResponse.model_validate(report)


@router.put("/reports/{report_id}", response_model=ResearchReportResponse)
async def update_research_report(
    report_id: str,
    payload: ReportUpdateRequest,
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> ResearchReportResponse:
    """Updates an editable report draft (e.g. PRD), incrementing version and verifying ownership."""
    updated = community_repo.update_research_report(
        report_id=report_id,
        owner_id=user["sub"],
        title=payload.title,
        content_markdown=payload.contentMarkdown,
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found or access unauthorized.",
        )
    return ResearchReportResponse.model_validate(updated)


@router.delete("/reports/{report_id}")
async def delete_research_report(
    report_id: str,
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> Dict[str, Any]:
    """Deletes an owned research report."""
    deleted = community_repo.delete_research_report(report_id=report_id, owner_id=user["sub"])
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found or access unauthorized.",
        )
    return {"success": True, "message": "Research report deleted successfully."}


@router.get("/reports/{report_id}/download")
async def download_research_report(
    report_id: str,
    format: str = Query("md", pattern="^(md|pdf)$", description="Export format: 'md' or 'pdf'"),
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> Response:
    """Downloads a saved research document as Markdown or publication-grade PDF."""
    report = community_repo.get_research_report(report_id=report_id, owner_id=user["sub"])
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found or access unauthorized.",
        )

    # Sanitize filename
    clean_title = "".join(c for c in report["title"] if c.isalnum() or c in (" ", "-", "_")).strip()
    safe_slug = clean_title.replace(" ", "_")[:50] or f"report_{report_id}"

    if format == "pdf":
        try:
            pdf_bytes = report_generation_service.render_pdf(report)
            return Response(
                content=pdf_bytes,
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f'attachment; filename="{safe_slug}.pdf"',
                    "Content-Length": str(len(pdf_bytes)),
                },
            )
        except Exception as e:
            logger.error("Failed to render PDF for report %s: %s", report_id, e, exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to render PDF document.",
            )
    else:
        md_bytes = report["contentMarkdown"].encode("utf-8")
        return Response(
            content=md_bytes,
            media_type="text/markdown; charset=utf-8",
            headers={
                "Content-Disposition": f'attachment; filename="{safe_slug}.md"',
                "Content-Length": str(len(md_bytes)),
            },
        )


# ==============================================================================
# Full Product Review & Review-Linked Research Conversation Endpoints
# ==============================================================================

@router.get("/{post_id}/review/sources", response_model=ReviewSourceAvailabilityResponse)
async def get_review_source_availability(
    post_id: str,
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> ReviewSourceAvailabilityResponse:
    """Pre-generation check: returns eligible comment count, attached documents, and new-activity state.

    Opening AI Lab calls this to fetch source availability. It performs ZERO LLM invocations.
    Strictly restricted to the verified post author.
    """
    return review_service.get_source_availability(post_id=post_id, user_id=user["sub"])


@router.post("/{post_id}/review/generate", response_model=ProductReviewResponse)
async def generate_full_product_review(
    post_id: str,
    payload: GenerateReviewRequest,
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> ProductReviewResponse:
    """Manual action only: generates a comprehensive 13-section Full Product Review.

    Executes the 7 processing stages, saves an immutable versioned snapshot, and initializes
    the linked research conversation. Restricted to the verified post author.
    """
    try:
        return review_service.generate_full_product_review(
            post_id=post_id,
            user_id=user["sub"],
            request=payload,
        )
    except (GeminiConfigurationError, GeminiRateLimitError, GeminiTimeoutError, LLMProviderError) as e:
        logger.error("AI Provider error during review generation for post %s: %s", post_id, e)
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/{post_id}/reviews", response_model=List[ProductReviewResponse])
async def list_product_reviews(
    post_id: str,
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> List[ProductReviewResponse]:
    """Lists all immutable review versions (V1, V2, etc.) generated for a post.

    Strictly restricted to the verified post author.
    """
    return review_service.list_reviews(post_id=post_id, user_id=user["sub"])


@router.get("/reviews/{review_id}", response_model=ProductReviewResponse)
async def get_product_review(
    review_id: str,
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> ProductReviewResponse:
    """Retrieves a specific review version, verifying user ownership boundaries."""
    return review_service.get_review(review_id=review_id, user_id=user["sub"])


@router.get("/reviews/{review_id}/download")
async def download_product_review(
    review_id: str,
    format: str = Query("md", pattern="^(md|pdf)$", description="Export format: 'md' or 'pdf'"),
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> Response:
    """Exports an immutable review version as clean Markdown or publication-grade PDF."""
    review = review_service.get_review(review_id=review_id, user_id=user["sub"])
    safe_slug = f"product_review_v{review.version}_{review_id[:8]}"

    if format == "pdf":
        try:
            pdf_bytes = review_service.render_review_pdf(review.model_dump())
            return Response(
                content=pdf_bytes,
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f'attachment; filename="{safe_slug}.pdf"',
                    "Content-Length": str(len(pdf_bytes)),
                },
            )
        except Exception as e:
            logger.error("Failed to render PDF for review %s: %s", review_id, e, exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to render PDF document.",
            )
    else:
        md_bytes = review.contentMarkdown.encode("utf-8")
        return Response(
            content=md_bytes,
            media_type="text/markdown; charset=utf-8",
            headers={
                "Content-Disposition": f'attachment; filename="{safe_slug}.md"',
                "Content-Length": str(len(md_bytes)),
            },
        )


@router.get("/reviews/{review_id}/conversation")
async def get_review_conversation(
    review_id: str,
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> Dict[str, Any]:
    """Retrieves session metadata and full message history for the review-linked conversation."""
    return review_service.get_review_conversation(review_id=review_id, user_id=user["sub"])


@router.post("/reviews/{review_id}/messages", response_model=ChatMessageResponse)
async def send_review_conversation_message(
    review_id: str,
    payload: ChatMessageRequest,
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> ChatMessageResponse:
    """Sends a follow-up question linked strictly to the active review version and its source snapshot.

    Answers are grounded in review findings, executive overview, pain points, recommendations,
    and the review's frozen source snapshot.
    """
    try:
        return review_service.send_review_message(
            review_id=review_id,
            user_id=user["sub"],
            user_question=payload.question,
            agent_mode=payload.agentMode or "analytical",
        )
    except (GeminiConfigurationError, GeminiRateLimitError, GeminiTimeoutError, LLMProviderError) as e:
        logger.error("AI Provider error during review chat for review %s: %s", review_id, e)
        raise HTTPException(status_code=e.status_code, detail=e.message)



