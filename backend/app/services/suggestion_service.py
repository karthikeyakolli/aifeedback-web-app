"""Deterministic Product Suggestion & Opportunity Prioritization Engine.

Transforms community feedback and validated Phase 3 findings into actionable,
transparent product opportunity proposals with mathematically inspectable
prioritization scores (P0-P3).

Core Principle: Priority and frequency are computed deterministically by Python,
never arbitrarily hallucinated by an LLM.
"""

from __future__ import annotations

import re
import uuid
from dataclasses import dataclass
from typing import List, Dict, Any, Optional

from backend.app.schemas.ai import CitationRecord

# Keyword dictionaries for deterministic severity detection in feedback comments
SEVERITY_KEYWORDS = {
    "blocker": ["crash", "broken", "cannot", "freeze", "error", "500", "loss", "bug", "fails", "fail", "unusable"],
    "high": ["slow", "latency", "confusing", "hard", "frustrating", "stuck", "difficult", "missing", "painful", "too many"],
    "medium": ["awkward", "clunky", "wish", "prefer", "better", "unclear", "annoying", "verbose"],
    "low": ["minor", "tweak", "nice to have", "typo", "cosmetic", "color", "palette"],
}

CATEGORY_KEYWORDS = {
    "reliability": ["crash", "bug", "broken", "fail", "freeze", "500", "error", "exception"],
    "performance": ["slow", "latency", "memory", "ram", "cpu", "speed", "fast", "heavy"],
    "usability": ["confusing", "unintuitive", "workflow", "navigation", "onboarding", "clunky", "friction"],
    "documentation": ["docs", "documentation", "guide", "tutorial", "example", "unclear", "explain"],
    "feature_request": ["add", "integration", "support", "calendar", "export", "webhook", "api", "plugin"],
    "praise": ["love", "great", "excellent", "clean", "fast", "intuitive", "helpful", "amazing"],
}


@dataclass
class PrioritizationScoreBreakdown:
    """Inspectable components of the deterministic priority score."""
    frequency_score: float      # 0 - 35 points based on unique commenters
    severity_weight: float      # 0 - 35 points based on detected blocker/friction keywords
    consensus_weight: float     # 0 - 20 points based on agreement ratio vs contradictions
    confidence_weight: float    # 0 - 10 points based on total evidence volume
    total_score: int            # 0 - 100 aggregate score
    assigned_priority: str      # P0 (80+), P1 (60-79), P2 (40-59), P3 (<40)


def calculate_prioritization_score(
    unique_mention_count: int,
    total_comments: int,
    detected_severities: List[str],
    has_contradictions: bool = False,
) -> PrioritizationScoreBreakdown:
    """Calculates an inspectable deterministic priority score (0-100) and priority level (P0-P3).

    Formula:
    - Frequency (max 35): Ratio of unique mentions relative to total discussion (scaled).
    - Severity (max 35): Based on presence of blocker/high friction terminology in cited comments.
    - Consensus (max 20): High if feedback is unanimous, penalized if conflicting opinions exist.
    - Confidence (max 10): Log-scaled with overall evidence volume.
    """
    # 1. Frequency Score (0 to 35)
    ratio = (unique_mention_count / max(1, total_comments))
    raw_freq = (unique_mention_count * 8.0) + (ratio * 15.0)
    freq_score = min(35.0, round(raw_freq, 1))

    # 2. Severity Score (0 to 35)
    sev_counts = {"blocker": 0, "high": 0, "medium": 0, "low": 0}
    for s in detected_severities:
        if s in sev_counts:
            sev_counts[s] += 1

    if sev_counts["blocker"] > 0:
        sev_score = 35.0
    elif sev_counts["high"] > 0:
        sev_score = min(30.0, 20.0 + (sev_counts["high"] * 4.0))
    elif sev_counts["medium"] > 0:
        sev_score = min(20.0, 10.0 + (sev_counts["medium"] * 3.0))
    else:
        sev_score = 8.0

    # 3. Consensus Weight (0 to 20)
    consensus_score = 12.0 if has_contradictions else 20.0

    # 4. Confidence Weight (0 to 10)
    conf_score = min(10.0, 4.0 + (unique_mention_count * 2.0))

    total = int(round(freq_score + sev_score + consensus_score + conf_score))
    total = max(5, min(100, total))

    # Deterministic Priority Thresholds
    if total >= 80:
        priority = "P0"
    elif total >= 60:
        priority = "P1"
    elif total >= 40:
        priority = "P2"
    else:
        priority = "P3"

    return PrioritizationScoreBreakdown(
        frequency_score=freq_score,
        severity_weight=sev_score,
        consensus_weight=consensus_score,
        confidence_weight=conf_score,
        total_score=total,
        assigned_priority=priority,
    )


class ProductSuggestionService:
    """Generates grounded, prioritized product opportunity recommendations."""

    def generate_suggestions(
        self,
        post: Dict[str, Any],
        comments: List[Dict[str, Any]],
        analysis_run: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """Synthesizes prioritized product improvement suggestions with full evidence grounding."""
        # Index comments
        comment_map = {c["id"]: c for c in comments if c.get("status") not in ("moderated", "hidden")}
        total_eligible = len(comment_map)

        suggestions: List[Dict[str, Any]] = []

        # 1. First synthesize from validated Phase 3 recommendations and themes if available
        if analysis_run:
            existing_recs = analysis_run.get("recommendations", [])
            for r in existing_recs:
                supporting_ids = [cid for cid in r.get("supportingCommentIds", []) if cid in comment_map]
                citations: List[Dict[str, Any]] = []
                detected_severities: List[str] = []

                for cid in supporting_ids:
                    c = comment_map[cid]
                    content = c.get("content", "").strip()
                    # Detect severities
                    content_lower = content.lower()
                    for level, words in SEVERITY_KEYWORDS.items():
                        if any(w in content_lower for w in words):
                            detected_severities.append(level)

                    # Build citation
                    if c.get("isAnonymous") or c.get("is_anonymous"):
                        author = "Anonymous Contributor"
                    else:
                        author = c.get("author", {}).get("displayName") or "Contributor"

                    citations.append({
                        "commentId": cid,
                        "quoteSnippet": content[:140] + ("..." if len(content) > 140 else ""),
                        "authorDisplay": author,
                    })

                breakdown = calculate_prioritization_score(
                    unique_mention_count=max(1, len(supporting_ids)),
                    total_comments=total_eligible,
                    detected_severities=detected_severities,
                )

                # Classify category
                title_lower = (r.get("title", "") + " " + r.get("problemAddressed", "")).lower()
                category = "usability"
                for cat, kws in CATEGORY_KEYWORDS.items():
                    if any(k in title_lower for k in kws):
                        category = cat
                        break

                suggestions.append({
                    "id": f"sug_{uuid.uuid4().hex[:10]}",
                    "title": r.get("title", "Product Improvement Opportunity"),
                    "category": category,
                    "problemIdentified": r.get("problemAddressed", "Identified in community discussion"),
                    "proposedInvestigation": r.get("suggestedValidation", "Conduct targeted user testing."),
                    "rationale": r.get("rationale", "Derived from community feedback frequency."),
                    "evidenceCitations": citations,
                    "uniqueMentionCount": len(supporting_ids),
                    "scoreBreakdown": {
                        "frequency": breakdown.frequency_score,
                        "severity": breakdown.severity_weight,
                        "consensus": breakdown.consensus_weight,
                        "confidence": breakdown.confidence_weight,
                        "totalScore": breakdown.total_score,
                    },
                    "priority": breakdown.assigned_priority,
                    "confidence": r.get("confidence", "medium"),
                    "metricOfSuccess": f"Resolution of user friction reported in {len(supporting_ids)} comments.",
                    "limitations": "Recommendation is a preliminary investigation prompt. Human validation is required.",
                })

        # 2. If suggestions list is empty (e.g. no Phase 3 run yet), generate from raw comments
        if not suggestions and total_eligible > 0:
            # Group comments into friction vs praise vs feature requests
            for cid, c in list(comment_map.items())[:5]:
                content = c.get("content", "").strip()
                content_lower = content.lower()

                category = "usability"
                for cat, kws in CATEGORY_KEYWORDS.items():
                    if any(k in content_lower for k in kws):
                        category = cat
                        break

                detected_severities = []
                for level, words in SEVERITY_KEYWORDS.items():
                    if any(w in content_lower for w in words):
                        detected_severities.append(level)

                breakdown = calculate_prioritization_score(
                    unique_mention_count=1,
                    total_comments=total_eligible,
                    detected_severities=detected_severities,
                )

                author = "Anonymous Contributor" if (c.get("isAnonymous") or c.get("is_anonymous")) else (c.get("author", {}).get("displayName") or "Contributor")

                suggestions.append({
                    "id": f"sug_{uuid.uuid4().hex[:10]}",
                    "title": f"Address feedback regarding {category.replace('_', ' ').capitalize()}",
                    "category": category,
                    "problemIdentified": content[:120] + "...",
                    "proposedInvestigation": "Interview contributor to clarify setup or usability steps.",
                    "rationale": f"Direct observation from comment {cid}.",
                    "evidenceCitations": [{
                        "commentId": cid,
                        "quoteSnippet": content[:140] + ("..." if len(content) > 140 else ""),
                        "authorDisplay": author,
                    }],
                    "uniqueMentionCount": 1,
                    "scoreBreakdown": {
                        "frequency": breakdown.frequency_score,
                        "severity": breakdown.severity_weight,
                        "consensus": breakdown.consensus_weight,
                        "confidence": breakdown.confidence_weight,
                        "totalScore": breakdown.total_score,
                    },
                    "priority": breakdown.assigned_priority,
                    "confidence": "medium",
                    "metricOfSuccess": "Successful reproduction and validation of reported user feedback.",
                    "limitations": "Single commenter signal. Needs broader corroboration.",
                })

        # Sort by totalScore descending
        suggestions.sort(key=lambda s: s["scoreBreakdown"]["totalScore"], reverse=True)
        return suggestions


# Global suggestion engine instance
suggestion_service = ProductSuggestionService()
