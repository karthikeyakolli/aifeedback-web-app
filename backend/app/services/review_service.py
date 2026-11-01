"""Full Product Review & Review-Linked Research Conversation Service.

Orchestrates the 7 processing stages for generating comprehensive 13-section Product Reviews:
  Stage 1: Checking access (strict owner authorization)
  Stage 2: Collecting sources (comments, replies, attached documents)
  Stage 3: Retrieving relevant evidence (BM25, document text extraction)
  Stage 4: Preparing context & snapshot
  Stage 5: Generating review via structured provider
  Stage 6: Validating citations & calculating deterministic stats
  Stage 7: Saving immutable versioned results & linking conversation session

Also manages Review-Linked Research Conversations grounded in review versions and frozen snapshots.
"""

from __future__ import annotations

import datetime
import json
import logging
import re
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, status
from fpdf import FPDF

from backend.app.config import settings
from backend.app.db.repository import community_repo
from backend.app.schemas.ai import (
    ChatMessageResponse,
    ChatSessionResponse,
    CitationRecord,
    CrossSourceComparison,
    ResearchAnswerResponse,
    StructuredRecommendation,
)
from backend.app.schemas.product_review import (
    DocumentSourceInfo,
    GenerateReviewRequest,
    ProductReviewResponse,
    ReviewFinding,
    ReviewSourceAvailabilityResponse,
    StructuredProductReview,
    StructuredProductReviewProposal,
)
from backend.app.services.analysis_service import flatten_comments_tree
from backend.app.services.gemini_service import LLMProvider, get_ai_provider
from backend.app.services.report_generation_service import ReportPDFRenderer, _sanitize_for_pdf
from backend.app.services.retrieval_service import retrieve_evidence
from backend.app.services.text_cleaner import clean_input_text

logger = logging.getLogger(__name__)


class ReviewService:
    """Core domain service for Full Product Reviews and Review-Linked Conversations."""

    def __init__(self, provider: Optional[LLMProvider] = None) -> None:
        self._provider = provider

    @property
    def provider(self) -> LLMProvider:
        if self._provider is None:
            self._provider = get_ai_provider()
        return self._provider

    def _verify_post_owner(self, post_id: str, user_id: str) -> Dict[str, Any]:
        """Strictly verifies that user_id is the verified owner of post_id; raises 403 or 404."""
        post = community_repo.get_post(post_id)
        if not post:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Discussion post not found.")

        is_owner = post.get("authorId") == user_id or post.get("author_id") == user_id
        if not is_owner and post.get("author", {}).get("id") == user_id:
            is_owner = True
        if not is_owner:
            with community_repo.db.session() as conn:
                raw_p = conn.execute("SELECT author_id FROM posts WHERE id = ?", (post_id,)).fetchone()
                if raw_p and raw_p["author_id"] == user_id:
                    is_owner = True

        if not is_owner:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden. Only the verified project owner can generate or view reviews for this workspace.",
            )
        return post

    def get_source_availability(self, post_id: str, user_id: str) -> ReviewSourceAvailabilityResponse:
        """Returns source availability metrics and new-activity indicator without calling LLM."""
        self._verify_post_owner(post_id, user_id)
        data = community_repo.get_product_source_availability(post_id, user_id)
        return ReviewSourceAvailabilityResponse.model_validate(data)

    def generate_full_product_review(
        self,
        post_id: str,
        user_id: str,
        request: GenerateReviewRequest,
    ) -> ProductReviewResponse:
        """Executes the 7 processing stages to create an immutable review version."""
        stages_completed: List[str] = []

        # Stage 1: Checking access
        post = self._verify_post_owner(post_id, user_id)
        stages_completed.append("access_verified")

        # Stage 2: Collecting sources
        eligible_comments: List[Dict[str, Any]] = []
        if request.includeCommunity and request.sourceType in ("both", "community"):
            raw_tree = community_repo.list_comments_for_post(post_id)
            eligible_comments = flatten_comments_tree(raw_tree)

        attached_docs: List[Dict[str, Any]] = []
        if request.sourceType in ("both", "documents"):
            all_docs = community_repo.list_post_documents(post_id)
            if request.includedDocIds is not None:
                included_set = set(request.includedDocIds)
                attached_docs = [d for d in all_docs if d["id"] in included_set]
            else:
                attached_docs = all_docs
        stages_completed.append("sources_collected")

        # Stage 3: Retrieving relevant evidence
        # Build lookup tables for valid citations
        valid_comment_map: Dict[str, Dict[str, Any]] = {c["id"]: c for c in eligible_comments}
        valid_doc_map: Dict[str, Dict[str, Any]] = {d["id"]: d for d in attached_docs}
        stages_completed.append("evidence_retrieved")

        # Stage 4: Preparing context & snapshot
        source_snapshot: Dict[str, Any] = {
            "comment_ids": [c["id"] for c in eligible_comments],
            "doc_ids": [d["id"] for d in attached_docs],
            "comment_count": len(eligible_comments),
            "document_count": len(attached_docs),
            "source_type": request.sourceType,
            "included_doc_ids": request.includedDocIds,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        }
        stages_completed.append("context_prepared")

        # Stage 5: Generating review via provider
        post_title = post.get("title", "Untitled Product")
        post_desc = post.get("description", "")
        post_category = post.get("category", "General")

        proposal: StructuredProductReviewProposal = self.provider.generate_full_product_review(
            post_title=post_title,
            post_description=post_desc,
            post_category=post_category,
            eligible_comments=eligible_comments,
            attached_docs=attached_docs,
        )
        stages_completed.append("review_generated")

        # Stage 6: Validating citations & calculating deterministic stats
        all_citations: List[CitationRecord] = []
        all_cited_ids: List[str] = []

        def _ground_findings(raw_findings: List[Any], category_name: str) -> List[ReviewFinding]:
            grounded_list: List[ReviewFinding] = []
            for idx, rf in enumerate(raw_findings):
                finding_id = f"rf_{category_name}_{idx + 1}"
                valid_ids: List[str] = []
                finding_citations: List[CitationRecord] = []

                for cid in rf.supporting_comment_ids:
                    if cid in valid_comment_map:
                        valid_ids.append(cid)
                        c_item = valid_comment_map[cid]
                        author = c_item.get("author_username") or c_item.get("author", {}).get("username") or "reviewer"
                        snippet = clean_input_text(c_item.get("content", ""))[:120]
                        cit = CitationRecord(
                            commentId=cid,
                            quoteSnippet=snippet,
                            authorDisplay=author,
                            sourceType="comment",
                        )
                        finding_citations.append(cit)
                        all_citations.append(cit)
                        all_cited_ids.append(cid)
                    elif cid in valid_doc_map:
                        valid_ids.append(cid)
                        d_item = valid_doc_map[cid]
                        cit = CitationRecord(
                            commentId=cid,
                            quoteSnippet=clean_input_text(d_item.get("content_text", d_item.get("content", "")))[:120],
                            authorDisplay=d_item.get("filename", "Internal Document"),
                            sourceType="document",
                            filename=d_item.get("filename", "Internal Document"),
                        )
                        finding_citations.append(cit)
                        all_citations.append(cit)
                        all_cited_ids.append(cid)

                grounded_list.append(
                    ReviewFinding(
                        id=finding_id,
                        title=rf.title,
                        explanation=rf.explanation,
                        interpretation=rf.interpretation,
                        recommendation=rf.recommendation,
                        uncertainty=rf.uncertainty,
                        supporting_comment_ids=valid_ids,
                        citations=finding_citations,
                        evidence_count=len(valid_ids),
                    )
                )
            return grounded_list

        grounded_strengths = _ground_findings(proposal.product_strengths, "str")
        grounded_pain_points = _ground_findings(proposal.customer_pain_points, "pain")
        grounded_features = _ground_findings(proposal.feature_requests, "feat")

        # Deterministic statistics (never hallucinated)
        total_sources = len(eligible_comments) + len(attached_docs)
        unique_cited = len(set(all_cited_ids))
        coverage_ratio = round(unique_cited / max(total_sources, 1), 3)

        deterministic_stats: Dict[str, Any] = {
            "totalSourcesConsidered": total_sources,
            "commentsAnalyzed": len(eligible_comments),
            "documentsAnalyzed": len(attached_docs),
            "uniqueCitedSourcesCount": unique_cited,
            "coverageRatio": coverage_ratio,
            "strengthsCount": len(grounded_strengths),
            "painPointsCount": len(grounded_pain_points),
            "featureRequestsCount": len(grounded_features),
            "recommendationsCount": len(proposal.recommendations),
        }

        structured_review = StructuredProductReview(
            executive_overview=proposal.executive_overview,
            product_understanding=proposal.product_understanding,
            key_highlights=proposal.key_highlights,
            product_strengths=grounded_strengths,
            customer_pain_points=grounded_pain_points,
            feature_requests=grounded_features,
            user_experience_assessment=proposal.user_experience_assessment,
            feedback_patterns=proposal.feedback_patterns,
            documentation_alignment=proposal.documentation_alignment,
            improvement_opportunities=proposal.improvement_opportunities,
            recommendations=proposal.recommendations,
            evidence_gaps=proposal.evidence_gaps,
            overall_assessment=proposal.overall_assessment,
        )
        stages_completed.append("citations_validated")

        # Stage 7: Saving results
        version = community_repo.get_next_product_review_version(post_id)
        content_markdown = self.render_review_markdown(
            post=post,
            review=structured_review,
            stats=deterministic_stats,
            version=version,
        )

        provider_name = getattr(self.provider, "model_name", "gemini-3.8-flash")
        provider_type = (settings.ai_provider or "gemini").lower()

        stages_completed.append("results_persisted")

        review_record = community_repo.create_product_review(
            post_id=post_id,
            owner_id=user_id,
            version=version,
            provider=provider_type,
            model=provider_name,
            source_snapshot=source_snapshot,
            content_markdown=content_markdown,
            structured_output=structured_review.model_dump(),
            citations=[c.model_dump() for c in all_citations],
            deterministic_stats=deterministic_stats,
            stages_completed=stages_completed,
        )

        # Automatically link/initialize review-linked conversation session
        session = community_repo.get_or_create_conversation_session_for_review(
            review_id=review_record["id"],
            post_id=post_id,
            user_id=user_id,
            review_version=version,
        )
        review_record["linkedSessionId"] = session["id"]

        return ProductReviewResponse.model_validate(review_record)

    def list_reviews(self, post_id: str, user_id: str) -> List[ProductReviewResponse]:
        """Lists all immutable review versions for a post owned by user_id."""
        self._verify_post_owner(post_id, user_id)
        records = community_repo.list_product_reviews(post_id, user_id)
        return [ProductReviewResponse.model_validate(r) for r in records]

    def get_review(self, review_id: str, user_id: str) -> ProductReviewResponse:
        """Retrieves a specific review version, verifying user ownership."""
        record = community_repo.get_product_review(review_id, user_id)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product review not found or access unauthorized.",
            )
        # Link session id if exists
        session = community_repo.get_or_create_conversation_session_for_review(
            review_id=record["id"],
            post_id=record["postId"],
            user_id=user_id,
            review_version=record["version"],
        )
        record["linkedSessionId"] = session["id"]
        return ProductReviewResponse.model_validate(record)

    def get_review_conversation(self, review_id: str, user_id: str) -> Dict[str, Any]:
        """Retrieves session metadata and full message history for the review-linked conversation."""
        review = self.get_review(review_id, user_id)
        session = community_repo.get_or_create_conversation_session_for_review(
            review_id=review.id,
            post_id=review.postId,
            user_id=user_id,
            review_version=review.version,
        )
        messages = community_repo.list_chat_messages(session["id"])
        return {
            "reviewId": review.id,
            "reviewVersion": review.version,
            "session": ChatSessionResponse.model_validate(session),
            "messages": [ChatMessageResponse.model_validate(m) for m in messages],
        }

    def send_review_message(
        self,
        review_id: str,
        user_id: str,
        user_question: str,
        agent_mode: str = "analytical",
    ) -> ChatMessageResponse:
        """Sends a question to the Review-Linked Conversation, strictly grounded in the review version."""
        review = self.get_review(review_id, user_id)
        session = community_repo.get_or_create_conversation_session_for_review(
            review_id=review.id,
            post_id=review.postId,
            user_id=user_id,
            review_version=review.version,
        )

        # 1. Record user message in DB
        community_repo.save_chat_message(
            session_id=session["id"],
            role="user",
            content=user_question,
            citations=[],
            metadata={"agent_mode": agent_mode},
        )

        # 2. Fetch conversation history for bounded multi-turn context
        history_records = community_repo.list_chat_messages(session["id"])
        conversation_history = [
            {"role": m.get("role", "user"), "content": m.get("content", "")}
            for m in history_records[-6:]  # Bounded to recent 6 turns
        ]

        # 3. Retrieve evidence from the review's frozen snapshot
        snapshot = review.sourceSnapshot or {}
        snapshot_comment_ids = set(snapshot.get("comment_ids", []))
        snapshot_doc_ids = set(snapshot.get("doc_ids", []))

        # Retrieve relevant comments
        all_comments = flatten_comments_tree(community_repo.list_comments_for_post(review.postId))
        snapshot_comments = [c for c in all_comments if c["id"] in snapshot_comment_ids]

        # Retrieve relevant docs
        all_docs = community_repo.list_post_documents(review.postId)
        snapshot_docs = [d for d in all_docs if d["id"] in snapshot_doc_ids]

        # Retrieve post
        post = community_repo.get_post(review.postId) or {}

        # Perform BM25 retrieval over snapshot comments
        retrieval_res = retrieve_evidence(
            post=post,
            comments=snapshot_comments,
            question=user_question,
            top_k=5,
        )
        retrieved_comments = retrieval_res.get("retrieved_comments", [])

        # 4. Synthesize prompt context including Review findings
        structured = review.structuredOutput or {}
        review_context_summary = (
            f"LINKED PRODUCT REVIEW VERSION: V{review.version}\n"
            f"Executive Overview: {structured.get('executiveOverview', '')[:300]}\n"
            f"Key Highlights: {', '.join(structured.get('keyHighlights', [])[:3])}\n"
            f"Top Pain Points: {', '.join([p.get('title', '') for p in structured.get('customerPainPoints', [])[:3]])}\n"
            f"Top Recommendations: {', '.join([r.get('action', '') for r in structured.get('recommendations', [])[:3]])}\n"
        )

        # 5. Invoke LLM chat response
        augmented_description = f"{post.get('description', '')}\n\n[REVIEW V{review.version} CONTEXT]:\n{review_context_summary}"

        proposal = self.provider.generate_chat_response(
            post_title=post.get("title", "Product Workspace"),
            post_description=augmented_description,
            post_category=post.get("category", "General"),
            retrieved_comments=retrieved_comments,
            matching_themes=[],
            conversation_history=conversation_history,
            user_question=user_question,
            agent_mode=agent_mode,
        )

        # 6. Validate citations against snapshot
        valid_c_ids = [cid for cid in proposal.supporting_comment_ids if cid in snapshot_comment_ids or cid in snapshot_doc_ids]
        citations = []
        for cid in valid_c_ids:
            matching = next((c for c in snapshot_comments if c["id"] == cid), None)
            if matching:
                citations.append(
                    CitationRecord(
                        commentId=cid,
                        quoteSnippet=clean_input_text(matching.get("content", ""))[:120],
                        authorDisplay=matching.get("author_username") or "reviewer",
                        sourceType="comment",
                    )
                )

        # 7. Record assistant message in DB
        assistant_metadata = {
            "agent_mode": agent_mode,
            "observed_facts": proposal.observed_facts,
            "hypotheses": proposal.hypotheses_and_interpretations,
            "recommendations": [r.model_dump(by_alias=True) for r in proposal.recommendations],
            "limitations": proposal.limitations_and_uncertainty,
            "suggested_follow_ups": proposal.suggested_follow_ups,
            "cross_source_comparison": proposal.cross_source_comparison.model_dump(by_alias=True) if proposal.cross_source_comparison else None,
            "executive_summary": proposal.executive_summary,
            "key_findings": proposal.key_findings,
            "visual_diagram": proposal.visual_diagram,
            "ui_mockup_concept": proposal.ui_mockup_concept,
            "image_prompt": proposal.image_prompt,
        }

        assistant_record = community_repo.save_chat_message(
            session_id=session["id"],
            role="assistant",
            content=proposal.direct_answer,
            citations=[c.model_dump() for c in citations],
            metadata=assistant_metadata,
        )

        return ChatMessageResponse.model_validate(assistant_record)

    def render_review_markdown(
        self,
        post: Dict[str, Any],
        review: StructuredProductReview,
        stats: Dict[str, Any],
        version: int,
    ) -> str:
        """Renders comprehensive Markdown formatting all 13 sections with tables, blockquotes, and citations."""
        post_title = post.get("title", "Product Workspace")
        date_str = datetime.datetime.now(datetime.timezone.utc).strftime("%B %d, %Y")

        lines: List[str] = [
            f"# Full Product Review: {post_title} (Version {version})",
            f"*Generated on {date_str}  |  Confidential Strategic Assessment*",
            "",
            "## Review Metadata & Source Snapshot",
            f"| Metric | Value |",
            f"| :--- | :--- |",
            f"| Review Version | V{version} |",
            f"| Total Sources Considered | {stats.get('totalSourcesConsidered', 0)} |",
            f"| Community Comments Analyzed | {stats.get('commentsAnalyzed', 0)} |",
            f"| Internal Documents Analyzed | {stats.get('documentsAnalyzed', 0)} |",
            f"| Unique Sources Cited | {stats.get('uniqueCitedSourcesCount', 0)} |",
            f"| Evidence Sample Coverage | {int(stats.get('coverageRatio', 0) * 100)}% |",
            "",
            "---",
            "",
            "## 1. Executive Overview",
            review.executiveOverview,
            "",
            "## 2. Product Understanding",
            review.productUnderstanding,
            "",
            "## 3. Key Highlights",
        ]

        for hl in review.keyHighlights:
            lines.append(f"- {hl}")
        if not review.keyHighlights:
            lines.append("*No specific highlights identified.*")

        lines.extend([
            "",
            "## 4. Product Strengths",
        ])
        if review.productStrengths:
            for s in review.productStrengths:
                cites = f" *(Citations: {', '.join(s.supportingCommentIds)})*" if s.supportingCommentIds else ""
                lines.append(f"### {s.title}{cites}")
                lines.append(f"**Observed Evidence:** {s.explanation}")
                lines.append(f"**Strategic Interpretation:** {s.interpretation}")
                if s.recommendation:
                    lines.append(f"**Suggested Leverage:** {s.recommendation}")
                if s.uncertainty:
                    lines.append(f"> *Caveat / Limitations: {s.uncertainty}*")
                lines.append("")
        else:
            lines.append("*No product strengths reported in available evidence.*")
            lines.append("")

        lines.append("## 5. Customer Pain Points")
        if review.customerPainPoints:
            for p in review.customerPainPoints:
                cites = f" *(Citations: {', '.join(p.supportingCommentIds)})*" if p.supportingCommentIds else ""
                lines.append(f"### {p.title}{cites}")
                lines.append(f"**Reported Friction:** {p.explanation}")
                lines.append(f"**Root Cause / Impact:** {p.interpretation}")
                if p.recommendation:
                    lines.append(f"**Remediation Action:** {p.recommendation}")
                if p.uncertainty:
                    lines.append(f"> *Confidence / Context: {p.uncertainty}*")
                lines.append("")
        else:
            lines.append("*No customer complaints or blockers reported in the analyzed feedback.*")
            lines.append("")

        lines.append("## 6. Feature Requests")
        if review.featureRequests:
            for f in review.featureRequests:
                cites = f" *(Citations: {', '.join(f.supportingCommentIds)})*" if f.supportingCommentIds else ""
                lines.append(f"### {f.title}{cites}")
                lines.append(f"**Requested Capability:** {f.explanation}")
                lines.append(f"**Workflow Significance:** {f.interpretation}")
                if f.recommendation:
                    lines.append(f"**Implementation Path:** {f.recommendation}")
                lines.append("")
        else:
            lines.append("*No specific feature requests recorded.*")
            lines.append("")

        lines.extend([
            "## 7. User Experience Assessment",
            review.userExperienceAssessment,
            "",
            "## 8. Feedback Patterns",
        ])
        for pat in review.feedbackPatterns:
            lines.append(f"- {pat}")
        if not review.feedbackPatterns:
            lines.append("*No recurring patterns detected.*")

        lines.extend([
            "",
            "## 9. Documentation Alignment",
            "### Areas of Agreement",
        ])
        for a in review.documentationAlignment.agreement:
            lines.append(f"- {a}")
        lines.append("\n### Contradictions / Divergence")
        for c in review.documentationAlignment.contradiction:
            lines.append(f"- {c}")
        lines.append("\n### Missing Documentation")
        for m in review.documentationAlignment.missingDocumentation:
            lines.append(f"- {m}")
        lines.append("\n### Unverified Assumptions")
        for u in review.documentationAlignment.unverifiedAssumptions:
            lines.append(f"- {u}")

        lines.extend([
            "",
            "## 10. Improvement Opportunities",
        ])
        for opp in review.improvementOpportunities:
            lines.append(f"- {opp}")
        if not review.improvementOpportunities:
            lines.append("*No additional opportunities identified.*")

        lines.extend([
            "",
            "## 11. Recommendations",
        ])
        if review.recommendations:
            lines.append("| Action | Rationale | Scope | Success Measure |")
            lines.append("| :--- | :--- | :--- | :--- |")
            for r in review.recommendations:
                act = r.action.replace("|", "-")
                reas = r.reason.replace("|", "-")
                appl = r.applicability.replace("|", "-")
                succ = (r.suggestedSuccessMeasure or "").replace("|", "-")
                lines.append(f"| {act} | {reas} | {appl} | {succ} |")
        else:
            lines.append("*No recommendations generated.*")

        lines.extend([
            "",
            "## 12. Evidence Gaps",
            review.evidenceGaps,
            "",
            "## 13. Overall Assessment",
            review.overallAssessment,
            "",
        ])

        return "\n".join(lines)

    def render_review_pdf(self, review_record: Dict[str, Any]) -> bytes:
        """Generates a styled, publication-ready PDF document of the 13-section review."""
        title = f"Product Review V{review_record.get('version', 1)}"
        pdf = ReportPDFRenderer(doc_type="FULL_PRODUCT_REVIEW", report_title=title)
        pdf.alias_nb_pages()
        pdf.add_page()

        # Cover / Title Block
        pdf.set_font("Helvetica", "B", 18)
        pdf.set_text_color(15, 23, 42)  # Slate 900
        clean_title = _sanitize_for_pdf(f"{title}: Full Strategic Synthesis")
        pdf.multi_cell(0, 9, clean_title)
        pdf.ln(3)

        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(100, 116, 139)  # Slate 500
        stats = review_record.get("deterministicStats") or review_record.get("deterministic_stats") or {}
        created_at = review_record.get("createdAt") or review_record.get("created_at") or ""
        meta_line = (
            f"Generated: {created_at[:10]}  |  Sources: {stats.get('totalSourcesConsidered', 0)}  |  "
            f"Coverage: {int(stats.get('coverageRatio', 0) * 100)}%  |  Confidential"
        )
        pdf.cell(0, 5, _sanitize_for_pdf(meta_line), new_x="LMARGIN", new_y="NEXT")
        pdf.ln(6)

        # Markdown Parser for PDF
        markdown_text = review_record.get("contentMarkdown") or review_record.get("content_markdown") or ""
        lines = markdown_text.splitlines()

        in_table = False
        table_rows: List[List[str]] = []

        def _flush_table():
            nonlocal in_table, table_rows
            if in_table and table_rows:
                # Render table
                pdf.set_font("Helvetica", "B", 8.5)
                pdf.set_fill_color(241, 245, 249)
                pdf.set_text_color(30, 41, 59)
                col_width = (pdf.w - pdf.l_margin - pdf.r_margin) / max(len(table_rows[0]), 1)
                for header_cell in table_rows[0]:
                    pdf.cell(col_width, 6, _sanitize_for_pdf(header_cell)[:30], border=1, fill=True)
                pdf.ln()

                pdf.set_font("Helvetica", "", 8)
                pdf.set_text_color(51, 65, 85)
                for row in table_rows[1:]:
                    for cell in row:
                        pdf.cell(col_width, 6, _sanitize_for_pdf(cell)[:35], border=1)
                    pdf.ln()
                pdf.ln(4)
                table_rows = []
                in_table = False

        for line in lines:
            trimmed = line.strip()
            pdf.set_x(pdf.l_margin)
            if not trimmed:
                _flush_table()
                pdf.ln(2)
                continue

            if trimmed.startswith("# ") and not trimmed.startswith("## "):
                continue

            if trimmed.startswith("## "):
                _flush_table()
                heading_text = _sanitize_for_pdf(trimmed[3:].strip())
                pdf.ln(4)
                pdf.set_x(pdf.l_margin)
                pdf.set_font("Helvetica", "B", 12)
                pdf.set_text_color(30, 41, 59)
                pdf.cell(0, 7, heading_text, border="B", new_x="LMARGIN", new_y="NEXT")
                pdf.ln(2)
                continue

            if trimmed.startswith("### "):
                _flush_table()
                heading_text = _sanitize_for_pdf(trimmed[4:].strip())
                pdf.ln(2)
                pdf.set_x(pdf.l_margin)
                pdf.set_font("Helvetica", "B", 10)
                pdf.set_text_color(51, 65, 85)
                pdf.cell(0, 6, heading_text, new_x="LMARGIN", new_y="NEXT")
                pdf.ln(1)
                continue

            if trimmed.startswith("|") and trimmed.endswith("|"):
                in_table = True
                if re.match(r"^\|(\s*:?-+:?\s*\|)+$", trimmed):
                    continue
                cells = [c.strip() for c in trimmed[1:-1].split("|")]
                table_rows.append(cells)
                continue
            else:
                _flush_table()

            if trimmed in ("---", "***", "___"):
                pdf.ln(2)
                pdf.set_x(pdf.l_margin)
                pdf.set_draw_color(226, 232, 240)
                pdf.line(pdf.l_margin, pdf.get_y(), pdf.w - pdf.r_margin, pdf.get_y())
                pdf.ln(3)
                continue

            if trimmed.startswith(">"):
                quote_text = _sanitize_for_pdf(trimmed[1:].strip().replace("**", ""))
                pdf.set_font("Helvetica", "I", 9)
                pdf.set_text_color(71, 85, 105)
                pdf.set_x(pdf.l_margin)
                pdf.multi_cell(0, 5, f"   {quote_text}")
                pdf.ln(1)
                continue

            if trimmed.startswith("- ") or trimmed.startswith("* "):
                bullet_content = _sanitize_for_pdf(trimmed[2:].strip().replace("**", ""))
                pdf.set_font("Helvetica", "", 9)
                pdf.set_text_color(30, 41, 59)
                pdf.set_x(pdf.l_margin)
                pdf.multi_cell(0, 5, f"*  {bullet_content}")
                continue

            # Standard body paragraph
            body_content = _sanitize_for_pdf(trimmed.replace("**", "").replace("`", ""))
            pdf.set_font("Helvetica", "", 9)
            pdf.set_text_color(30, 41, 59)
            pdf.set_x(pdf.l_margin)
            pdf.multi_cell(0, 5, body_content)

        _flush_table()
        return bytes(pdf.output())


review_service = ReviewService()
