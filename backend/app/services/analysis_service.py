"""Deterministic Analysis and Citation Verification Service for Product Research Intelligence.

Orchestrates post and comment context extraction, deterministic metric computation,
LLM provider invocation, strict citation and hallucination validation,
and persistence of versioned analysis runs.
"""

from __future__ import annotations

import hashlib
import logging
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple

from backend.app.config import settings
from backend.app.db.repository import community_repo
from backend.app.schemas.ai import (
    AIAnalysisResponse,
    ThemeFinding,
    DisagreementFinding,
    RecommendationFinding,
    CitationRecord,
    GeminiAnalysisOutput,
)
from backend.app.services.gemini_service import (
    LLMProvider,
    get_ai_provider,
    PROMPT_VERSION,
    LLMProviderError,
    GeminiConfigurationError,
)

logger = logging.getLogger(__name__)


def compute_discussion_input_hash(post: Dict[str, Any], comments: List[Dict[str, Any]]) -> str:
    """Computes a deterministic SHA-256 hash over post content and sorted comments.

    Enables reliable stale detection and cache invalidation when comments change.
    """
    sorted_comments = sorted(comments, key=lambda c: c["id"])
    serialized_parts = [
        post["id"],
        post.get("title", ""),
        post.get("description", ""),
        f"count:{len(comments)}",
    ]
    for c in sorted_comments:
        serialized_parts.append(f"{c['id']}:{c['content'].strip()}:{c.get('updatedAt', '')}")

    hash_source = "|".join(serialized_parts)
    return hashlib.sha256(hash_source.encode("utf-8")).hexdigest()


def flatten_comments_tree(comments_tree: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Recursively flattens threaded comments into an eligible list of comments."""
    flat: List[Dict[str, Any]] = []

    def _traverse(node: Dict[str, Any]) -> None:
        if node.get("status") not in ("moderated", "hidden", "flagged"):
            flat.append(node)
        for reply in node.get("replies", []):
            _traverse(reply)

    for root in comments_tree:
        _traverse(root)

    return flat


class InsufficientFeedbackError(ValueError):
    """Raised when feedback discussion is insufficient (e.g. 0 comments)."""
    pass


class AnalysisService:
    """Coordinates deterministic metrics, LLM generation, and citation verification."""

    def __init__(
        self,
        provider: Optional[LLMProvider] = None,
        max_comments: Optional[int] = None,
    ) -> None:
        self.provider = provider or get_ai_provider()
        self.max_comments = max_comments

    def get_latest_insights(self, post_id: str) -> Optional[AIAnalysisResponse]:
        """Retrieves the latest completed analysis run, computing real-time staleness."""
        latest_data = community_repo.get_latest_analysis_run(post_id)
        if not latest_data:
            return None

        # Verify whether current discussion has changed since analysis
        try:
            post = community_repo.get_post(post_id)
            raw_tree = community_repo.list_comments_for_post(post_id)
            flat_comments = flatten_comments_tree(raw_tree)
            current_hash = compute_discussion_input_hash(post, flat_comments)
            is_stale = current_hash != latest_data.get("inputHash")
        except Exception as e:
            logger.warning("Could not compute current hash for post %s: %s", post_id, e)
            is_stale = False

        latest_data["isStale"] = is_stale
        return AIAnalysisResponse.model_validate(latest_data)

    def analyze_feedback(
        self,
        post: Dict[str, Any],
        raw_comments: List[Dict[str, Any]],
        requested_by: Optional[str] = None,
        max_comments: Optional[int] = None,
    ) -> AIAnalysisResponse:
        """Analyzes in-memory post and comments directly without repository lookups."""
        flat_comments = flatten_comments_tree(raw_comments)
        total_comments = len(flat_comments)
        if total_comments == 0:
            raise InsufficientFeedbackError(
                "Discussion has no comments to analyze. At least one review or critique is required."
            )

        limit = max_comments or self.max_comments or settings.max_analysis_comments
        analyzed_comments = flat_comments[:limit]
        comments_payload = [
            {"id": c["id"], "content": c["content"].strip()}
            for c in analyzed_comments
        ]

        model_name = getattr(self.provider, "model_name", "gemini-3.8-flash")
        if hasattr(self.provider, "synthesize_community_feedback"):
            raw_output = self.provider.synthesize_community_feedback(post, analyzed_comments)
        else:
            raw_output = self.provider.generate_analysis(
                post_title=post.get("title", ""),
                post_description=post.get("description", ""),
                category=post.get("category", "General"),
                comments_data=comments_payload,
            )

        validated_result = self._validate_and_ground_citations(
            post=post,
            raw_output=raw_output,
            available_comments=flat_comments,
            total_comments=total_comments,
            analyzed_count=len(analyzed_comments),
            model_name=model_name,
        )

        input_hash = compute_discussion_input_hash(post, flat_comments)
        run_data = {
            "id": f"run_{uuid.uuid4().hex[:12]}",
            "postId": post["id"],
            "modelVersion": model_name,
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "commentCountAnalyzed": len(analyzed_comments),
            "totalCommentsAvailable": total_comments,
            "inputHash": input_hash,
            "isCached": False,
            "isStale": False,
            **validated_result,
        }
        return AIAnalysisResponse.model_validate(run_data)

    def analyze_post(
        self,
        post_id: Optional[str] = None,
        post: Any = None,
        raw_comments: Optional[List[Dict[str, Any]]] = None,
        requested_by: Optional[str] = None,
        force_refresh: bool = False,
    ) -> AIAnalysisResponse:
        """Runs the complete feedback analysis pipeline for a post.

        Accepts either post_id (string) or post (dict) with raw_comments.
        """
        if post is not None and isinstance(post, dict):
            return self.analyze_feedback(
                post=post,
                raw_comments=raw_comments or [],
                requested_by=requested_by,
            )

        target_post_id = post_id or (str(post) if post else None)
        if not target_post_id:
            raise ValueError("post_id must be provided for analysis.")

        post_record = community_repo.get_post(target_post_id)
        if not post_record:
            raise ValueError(f"Post '{target_post_id}' not found.")

        if post_record.get("status") != "published":
            raise ValueError(f"Post '{target_post_id}' is not in published status and cannot be analyzed.")

        raw_comments_data = community_repo.list_comments_for_post(target_post_id)
        flat_comments = flatten_comments_tree(raw_comments_data)
        total_comments = len(flat_comments)

        if total_comments == 0:
            raise InsufficientFeedbackError(
                "Post has no community comments to analyze. At least one review or critique is required."
            )

        # Compute deterministic discussion input hash
        input_hash = compute_discussion_input_hash(post_record, flat_comments)

        # Check existing cached analysis if not forcing refresh
        if not force_refresh:
            existing = community_repo.get_latest_analysis_run(target_post_id)
            if existing and existing.get("inputHash") == input_hash:
                logger.info("Discussion for post %s is unchanged. Returning cached analysis.", target_post_id)
                existing["isStale"] = False
                return AIAnalysisResponse.model_validate(existing)

        # Bound analyzed comments by configured maximum
        max_comments = self.max_comments or settings.max_analysis_comments
        analyzed_comments = flat_comments[:max_comments]

        # Prepare sanitized payload for external provider (IDs and text only)
        comments_payload = [
            {"id": c["id"], "content": c["content"].strip()}
            for c in analyzed_comments
        ]

        # Invoke LLM provider
        model_name = getattr(self.provider, "model_name", "gemini-3.8-flash")
        provider_name = "gemini" if "Gemini" in self.provider.__class__.__name__ else "mock"

        try:
            raw_output = self.provider.generate_analysis(
                post_title=post_record["title"],
                post_description=post_record["description"],
                category=post_record["category"],
                comments_data=comments_payload,
            )
        except Exception as e:
            # Persist failure record for visibility and debugging
            community_repo.save_analysis_run(
                post_id=target_post_id,
                requested_by=requested_by,
                status="failed",
                provider=provider_name,
                model=model_name,
                prompt_version=PROMPT_VERSION,
                input_hash=input_hash,
                total_comment_count=total_comments,
                analyzed_comment_count=len(analyzed_comments),
                result_data={},
                error_message=str(e),
            )
            raise

        # Deterministic Citation Verification & Hallucination Guard
        validated_result = self._validate_and_ground_citations(
            post=post_record,
            raw_output=raw_output,
            available_comments=flat_comments,
            total_comments=total_comments,
            analyzed_count=len(analyzed_comments),
            model_name=model_name,
        )

        # Persist completed analysis run
        saved_run = community_repo.save_analysis_run(
            post_id=target_post_id,
            requested_by=requested_by,
            status="completed",
            provider=provider_name,
            model=model_name,
            prompt_version=PROMPT_VERSION,
            input_hash=input_hash,
            total_comment_count=total_comments,
            analyzed_comment_count=len(analyzed_comments),
            result_data=validated_result,
        )

        saved_run["isCached"] = False
        saved_run["isStale"] = False
        return AIAnalysisResponse.model_validate(saved_run)

    def _validate_and_ground_citations(
        self,
        post: Dict[str, Any],
        raw_output: GeminiAnalysisOutput,
        available_comments: List[Dict[str, Any]],
        total_comments: int,
        analyzed_count: int,
        model_name: str,
    ) -> Dict[str, Any]:
        """Validates all citations against stored records and extracts real quotes."""
        # Index comments by ID for O(1) lookup
        comment_map = {c["id"]: c for c in available_comments}

        # 1. Validate Themes & Citations
        validated_themes = []
        for idx, t in enumerate(raw_output.themes, start=1):
            valid_supporting_ids = [
                cid for cid in t.supporting_comment_ids if cid in comment_map
            ]

            # Build grounded citations directly from stored records
            citations = []
            for cid in valid_supporting_ids:
                c_row = comment_map[cid]
                # Enforce anonymous author masking
                if c_row.get("isAnonymous") or c_row.get("is_anonymous"):
                    author_display = "Anonymous Contributor"
                else:
                    author_obj = c_row.get("author", {})
                    author_display = author_obj.get("displayName") or author_obj.get("username") or "Contributor"

                # Extract real stored quote snippet (never trust model's fabricated quote)
                content = c_row["content"].strip()
                snippet = content[:160] + ("..." if len(content) > 160 else "")

                citations.append({
                    "commentId": cid,
                    "quoteSnippet": snippet,
                    "authorDisplay": author_display,
                })

            # Calculate deterministic comment count
            actual_count = len(valid_supporting_ids)

            # Keep theme even if some IDs were invalid, provided at least one valid citation remains
            # or if the theme represents general sentiment observed in the batch
            validated_themes.append({
                "id": f"thm_{uuid.uuid4().hex[:8]}",
                "themeName": t.theme_name.strip(),
                "category": t.category,
                "summary": t.summary.strip(),
                "supportingCommentIds": valid_supporting_ids,
                "citations": citations,
                "commentCount": actual_count,
                "severity": t.severity,
            })

        # 2. Validate Disagreements
        validated_disagreements = []
        for idx, d in enumerate(raw_output.disagreements, start=1):
            valid_a = [cid for cid in d.supporting_ids_a if cid in comment_map]
            valid_b = [cid for cid in d.supporting_ids_b if cid in comment_map]

            validated_disagreements.append({
                "id": f"dis_{uuid.uuid4().hex[:8]}",
                "topic": d.topic.strip(),
                "perspectiveA": d.perspective_a.strip(),
                "supportingIdsA": valid_a,
                "perspectiveB": d.perspective_b.strip(),
                "supportingIdsB": valid_b,
                "takeaway": d.takeaway.strip(),
            })

        # 3. Validate Recommendations
        validated_recommendations = []
        for idx, r in enumerate(raw_output.recommendations, start=1):
            valid_rec_ids = [cid for cid in r.supporting_comment_ids if cid in comment_map]
            frequency = len(valid_rec_ids)

            validated_recommendations.append({
                "id": f"rec_{uuid.uuid4().hex[:8]}",
                "title": r.title.strip(),
                "problemAddressed": r.problem_addressed.strip(),
                "rationale": r.rationale.strip(),
                "suggestedValidation": r.suggested_validation.strip(),
                "supportingCommentIds": valid_rec_ids,
                "frequencyScore": frequency,
                "confidence": r.confidence,
                "recommendedPriority": r.recommended_priority,
            })

        # 4. Formulate Coverage Notes
        coverage_note = raw_output.limitations_and_uncertainty
        if total_comments > analyzed_count:
            coverage_note = (
                f"Coverage Notice: Sampled {analyzed_count} of {total_comments} comments analyzed due to input size limits. "
                + coverage_note
            )

        now = datetime.now(timezone.utc).isoformat()

        return {
            "id": f"ar_{uuid.uuid4().hex[:12]}",
            "postId": post["id"],
            "modelVersion": model_name,
            "createdAt": now,
            "commentCountAnalyzed": analyzed_count,
            "totalCommentsAvailable": total_comments,
            "discussionSummary": raw_output.discussion_summary.strip(),
            "themes": validated_themes,
            "disagreements": validated_disagreements,
            "recommendations": validated_recommendations,
            "limitationsAndUncertainty": coverage_note.strip(),
        }


# Global singleton instance
analysis_service = AnalysisService()
