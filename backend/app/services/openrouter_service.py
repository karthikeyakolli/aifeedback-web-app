"""OpenRouter LLM Provider Adapter for Project Feedback & Product Research.

Provides high-resilience AI inference via OpenRouter with STRICT Free-Tier enforcement:
- Strictly bounds usage to zero-cost (:free) models when openrouter_free_only is True.
- Automatically handles OpenRouter protocol headers (HTTP-Referer, X-Title).
- Multi-model free fallback chain to gracefully recover from temporary free-tier 429 rate limits.
- Supports structured Pydantic schema validation for Project Reviews, Community Analysis, and Chat.
"""

from __future__ import annotations

import json
import logging
import time
from typing import Any, Dict, List, Optional

import httpx

from backend.app.config import settings
from backend.app.schemas.ai import GeminiAnalysisOutput, ResearchAnswerProposal
from backend.app.schemas.product_review import StructuredProductReviewProposal
from backend.app.schemas.project import StructuredProjectFeedbackProposal
from backend.app.services.text_cleaner import (
    clean_input_text,
    sanitize_gemini_analysis,
    sanitize_research_proposal,
)

logger = logging.getLogger(__name__)

# Verified zero-cost models on OpenRouter
DEFAULT_FREE_FALLBACK_MODELS = [
    "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    "google/gemma-4-31b-it:free",
    "nvidia/nemotron-3.5-lightning:free",
    "cohere/north-mini-code:free",
    "liquid/lfm-2.5-2.6b:free",
]


class OpenRouterFreeTierViolationError(Exception):
    """Raised when an attempt is made to call a non-free model while free-only enforcement is active."""


class OpenRouterProvider:
    """OpenRouter API adapter strictly limited to free-tier models."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        timeout_seconds: Optional[int] = None,
        free_only: Optional[bool] = None,
    ) -> None:
        self.api_key = api_key or settings.openrouter_api_key
        self.model_name = model_name or settings.openrouter_model or "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free"
        self.timeout_seconds = timeout_seconds or settings.ai_timeout_seconds
        self.free_only = settings.openrouter_free_only if free_only is None else free_only
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"

    @property
    def is_configured(self) -> bool:
        """Returns True if a valid OpenRouter API key is configured."""
        return bool(self.api_key and "placeholder" not in self.api_key.lower())

    def _enforce_free_tier(self, requested_model: str) -> str:
        """Validates that the model is strictly in the free tier (:free suffix)."""
        if not self.free_only:
            return requested_model

        model = (requested_model or "").strip()
        if not model.endswith(":free"):
            free_candidate = f"{model}:free"
            logger.warning(
                "Enforcing OpenRouter free tier: model '%s' lacks ':free' suffix. Remapping to '%s'.",
                model,
                free_candidate,
            )
            return free_candidate
        return model

    def _get_headers(self) -> Dict[str, str]:
        """Builds standard OpenRouter headers per official documentation."""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": settings.openrouter_site_url,
            "X-Title": settings.openrouter_site_name,
            "Content-Type": "application/json",
        }

    def _call_openrouter_json(
        self,
        system_instruction: str,
        user_prompt: str,
        target_model: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Calls OpenRouter with JSON response format and automatic multi-model free fallback."""
        if not self.is_configured:
            from backend.app.services.gemini_service import GeminiConfigurationError
            raise GeminiConfigurationError("OPENROUTER_API_KEY is not configured in settings.")

        primary_model = self._enforce_free_tier(target_model or self.model_name)
        
        # Build cascade of free models to try if the primary hits 429 / 503
        models_to_try = [primary_model]
        for m in DEFAULT_FREE_FALLBACK_MODELS:
            if m not in models_to_try:
                models_to_try.append(m)

        last_error = None
        for model in models_to_try:
            logger.info("Calling OpenRouter with free-tier model: %s", model)
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": user_prompt},
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.2,
            }

            try:
                with httpx.Client(timeout=float(self.timeout_seconds)) as client:
                    resp = client.post(self.base_url, headers=self._get_headers(), json=payload)

                if resp.status_code == 200:
                    data = resp.json()
                    choices = data.get("choices", [])
                    if not choices:
                        raise ValueError("OpenRouter returned empty choices list.")
                    content_str = choices[0]["message"]["content"]
                    # Clean potential markdown fences
                    clean_str = content_str.strip()
                    if clean_str.startswith("```json"):
                        clean_str = clean_str[len("```json"):].strip()
                    elif clean_str.startswith("```"):
                        clean_str = clean_str[len("```"):].strip()
                    if clean_str.endswith("```"):
                        clean_str = clean_str[:-len("```")].strip()
                    return json.loads(clean_str)

                elif resp.status_code == 429:
                    logger.warning(
                        "OpenRouter model '%s' hit rate limit (HTTP 429). Trying next free-tier fallback model...",
                        model,
                    )
                    last_error = f"HTTP 429 Rate Limited: {resp.text}"
                    continue

                else:
                    logger.warning(
                        "OpenRouter model '%s' returned HTTP %s: %s. Trying next free-tier fallback...",
                        model,
                        resp.status_code,
                        resp.text[:200],
                    )
                    last_error = f"HTTP {resp.status_code}: {resp.text}"
                    continue

            except Exception as e:
                logger.warning("OpenRouter execution failed on model '%s': %s", model, e)
                last_error = str(e)
                continue

        raise RuntimeError(f"All OpenRouter free-tier models exhausted. Last error: {last_error}")

    def generate_project_feedback(
        self,
        project: Dict[str, Any],
        focus_areas: List[str],
    ) -> StructuredProjectFeedbackProposal:
        """Evaluates a project using OpenRouter free-tier model and returns structured findings."""
        name = clean_input_text(project.get("name", ""))
        tagline = clean_input_text(project.get("tagline", ""))
        category = clean_input_text(project.get("category", ""))
        description = clean_input_text(project.get("description", ""))
        repo = clean_input_text(project.get("repositoryUrl", "") or "")
        demo = clean_input_text(project.get("demoUrl", "") or "")
        focus_str = f"Specific Focus Areas: {', '.join(focus_areas)}\n" if focus_areas else ""

        system_instruction = (
            "You are a Senior Principal Software Architect, Security Auditor, and UX Evaluation Specialist.\n"
            "Your objective: Conduct a rigorous, critical technical evaluation of the project submitted by a creator.\n\n"
            "EVALUATION CRITERIA:\n"
            "1. Architecture & Design Patterns: evaluate modularity, coupling, separation of concerns, and framework fitness.\n"
            "2. UX & Usability: evaluate onboarding friction, cognitive load, user feedback loops, and clarity.\n"
            "3. Performance & Scaling: evaluate latency bottlenecks, unbounded loops, state synchronization, and memory efficiency.\n"
            "4. Security & Data Protection: evaluate authentication, authorization, access control boundaries, and secrets leakage risks.\n"
            "5. Accessibility & Reliability: evaluate error recovery, network resilience, and fault tolerance.\n\n"
            "CRITICAL CONSTRAINTS:\n"
            "- ZERO FABRICATED CITATIONS: Every finding must include an `evidence_quote` citing exact text from the creator's description or specification.\n"
            "- ACTIONABLE RECOMMENDATIONS: Provide concrete, step-by-step engineering guidance to address each finding.\n"
            "- HONEST FINDINGS: Produce at least 2 distinct findings highlighting real risks or trade-offs. Classify severity accurately ('blocker', 'high', 'medium', 'low').\n"
            "- Output MUST strictly be a JSON object with keys: executive_summary (string), strengths_summary (string), and findings (list of objects with title, severity, category, observation, evidence_quote, recommendation)."
        )

        user_prompt = (
            f"<project_context>\n"
            f"Project Name: {name}\n"
            f"Category: {category}\n"
            f"Tagline: {tagline}\n"
            f"Repository URL: {repo or 'Not provided'}\n"
            f"Live Demo URL: {demo or 'Not provided'}\n"
            f"{focus_str}\n"
            f"Technical Specification & Overview:\n"
            f"{description}\n"
            f"</project_context>\n\n"
            f"TASK: Analyze the project context above according to the 5 evaluation criteria. "
            f"Produce an executive summary, strengths summary, and a list of actionable findings with exact evidence quotes."
        )

        json_data = self._call_openrouter_json(system_instruction, user_prompt)
        return StructuredProjectFeedbackProposal.model_validate(json_data)

    def generate_analysis(
        self,
        post_title: str,
        post_description: str,
        category: str,
        comments_data: List[Dict[str, str]],
    ) -> GeminiAnalysisOutput:
        """Synthesizes community feedback using OpenRouter free models."""
        comments_formatted = []
        for c in comments_data:
            cid = c.get("id", "unknown")
            text = clean_input_text(c.get("content", ""))
            comments_formatted.append(f'  <comment id="{cid}">\n    {text}\n  </comment>')

        joined_comments = "\n".join(comments_formatted)

        system_instruction = (
            "You are a Senior Product Research Intelligence Specialist analyzing customer feedback.\n"
            "Extract recurring themes, praise, usability friction, feature requests, and disagreements.\n"
            "CRITICAL: Do NOT invent citations. Only cite valid comment IDs provided in the input.\n"
            f"You MUST output valid JSON matching this schema:\n"
            f"{json.dumps(GeminiAnalysisOutput.model_json_schema(), indent=2)}"
        )

        user_prompt = (
            f"PRODUCT CONTEXT:\n"
            f"Title: {clean_input_text(post_title)}\n"
            f"Category: {category}\n"
            f"Description: {clean_input_text(post_description)}\n\n"
            f"<community_feedback total_comments=\"{len(comments_data)}\">\n"
            f"{joined_comments}\n"
            f"</community_feedback>\n\n"
            f"Synthesize the community feedback into structured JSON."
        )

        json_data = self._call_openrouter_json(system_instruction, user_prompt)
        output = GeminiAnalysisOutput.model_validate(json_data)
        return sanitize_gemini_analysis(output)

    def generate_chat_response(
        self,
        post_title: str,
        post_description: str,
        post_category: str,
        retrieved_comments: List[Dict[str, Any]],
        matching_themes: List[Dict[str, Any]],
        conversation_history: List[Dict[str, str]],
        user_question: str,
        agent_mode: str = "analytical",
    ) -> ResearchAnswerProposal:
        """Generates grounded research answer proposal using OpenRouter free tier."""
        comments_formatted = []
        for c in retrieved_comments:
            cid = c.get("id", "unknown")
            text = clean_input_text(c.get("content", ""))
            comments_formatted.append(f'  <comment id="{cid}">\n    {text}\n  </comment>')
        comments_block = "\n".join(comments_formatted) if comments_formatted else "  <!-- No comments retrieved -->"

        system_instruction = (
            "You are an interactive Senior Product Research Assistant analyzing customer feedback on product discussions.\n"
            "Rules:\n"
            "1. Ground all answers strictly in <retrieved_evidence> and <post_context>.\n"
            "2. Never hallucinate citation IDs. Only cite comment and doc IDs present in <retrieved_evidence>.\n"
            "3. ZERO INVENTED NUMBERS: Never invent counts, percentages, user ratings, or fabricated statistics.\n"
            "4. If evidence is insufficient, clearly state that in direct_answer and limitations.\n"
            "5. Output valid JSON ONLY matching the provided ResearchAnswerProposal schema."
        )

        user_prompt = (
            f"<post_context>\n"
            f"Title: {clean_input_text(post_title)}\n"
            f"Description: {clean_input_text(post_description)}\n"
            f"Category: {post_category}\n"
            f"</post_context>\n\n"
            f"<retrieved_evidence>\n{comments_block}\n</retrieved_evidence>\n\n"
            f"Question: {clean_input_text(user_question)}"
        )

        json_data = self._call_openrouter_json(system_instruction, user_prompt)
        output = ResearchAnswerProposal.model_validate(json_data)
        return sanitize_research_proposal(output)

    def generate_full_product_review(
        self,
        post_title: str,
        post_description: str,
        post_category: str,
        eligible_comments: List[Dict[str, Any]],
        attached_docs: List[Dict[str, Any]],
    ) -> StructuredProductReviewProposal:
        """Generates a structured review proposal using OpenRouter free tier."""
        comments_formatted = []
        for c in eligible_comments:
            cid = c.get("id", "unknown")
            author = c.get("author_username") or "reviewer"
            text = clean_input_text(c.get("content", ""))
            comments_formatted.append(f'  <comment id="{cid}" author="{author}">\n    {text}\n  </comment>')
        comments_block = "\n".join(comments_formatted) if comments_formatted else "  <!-- No community feedback comments provided -->"

        system_instruction = (
            "You are a Principal Product Strategy Lead conducting an authoritative Full Product Review.\n"
            "Synthesize all product documentation and community feedback into an evidence-grounded review.\n"
            "Output MUST strictly be valid JSON adhering to StructuredProductReviewProposal."
        )

        user_prompt = (
            f"Title: {clean_input_text(post_title)}\n"
            f"Description: {clean_input_text(post_description)}\n"
            f"Category: {post_category}\n\n"
            f"<community_feedback>\n{comments_block}\n</community_feedback>"
        )

        json_data = self._call_openrouter_json(system_instruction, user_prompt)
        return StructuredProductReviewProposal.model_validate(json_data)


openrouter_provider = OpenRouterProvider()
