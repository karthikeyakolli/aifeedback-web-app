"""NVIDIA NIM LLM Provider Adapter for Project Feedback & Product Research.

Provides OpenAI-compatible high-performance AI inference via NVIDIA NIM infrastructure
(https://integrate.api.nvidia.com/v1/chat/completions).
"""

from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Optional

import httpx

from backend.app.config import settings
from backend.app.schemas.ai import GeminiAnalysisOutput
from backend.app.schemas.project import StructuredProjectFeedbackProposal
from backend.app.services.text_cleaner import clean_input_text

logger = logging.getLogger(__name__)


class NvidiaNimProvider:
    """NVIDIA NIM API adapter."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout_seconds: Optional[int] = None,
    ) -> None:
        self.api_key = api_key or settings.nvidia_api_key
        self.model_name = model_name or settings.nvidia_model or "nvidia/llama-3.1-nemotron-70b-instruct"
        self.base_url = (base_url or settings.nvidia_base_url or "https://integrate.api.nvidia.com/v1").rstrip("/")
        self.timeout_seconds = timeout_seconds or settings.ai_timeout_seconds

    @property
    def is_configured(self) -> bool:
        """Returns True if a valid NVIDIA API key is present."""
        return bool(self.api_key and "placeholder" not in self.api_key.lower())

    def _get_headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def _call_nvidia_json(self, system_instruction: str, user_prompt: str) -> Dict[str, Any]:
        """Invokes NVIDIA NIM chat completion with JSON parsing."""
        if not self.is_configured:
            from backend.app.services.gemini_service import GeminiConfigurationError
            raise GeminiConfigurationError("NVIDIA_API_KEY is not configured in settings.")

        endpoint = f"{self.base_url}/chat/completions"
        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.2,
        }

        with httpx.Client(timeout=float(self.timeout_seconds)) as client:
            resp = client.post(endpoint, headers=self._get_headers(), json=payload)

        if resp.status_code != 200:
            raise RuntimeError(f"NVIDIA NIM call failed ({resp.status_code}): {resp.text[:200]}")

        data = resp.json()
        choices = data.get("choices", [])
        if not choices:
            raise ValueError("NVIDIA NIM returned empty choices.")

        content_str = choices[0]["message"]["content"]
        # Handle potential markdown code fencing in LLM response
        content_clean = content_str.strip()
        if content_clean.startswith("```json"):
            content_clean = content_clean[len("```json"):].strip()
        elif content_clean.startswith("```"):
            content_clean = content_clean[len("```"):].strip()
        if content_clean.endswith("```"):
            content_clean = content_clean[:-len("```")].strip()

        return json.loads(content_clean)

    def generate_project_feedback(
        self,
        project: Dict[str, Any],
        focus_areas: List[str],
    ) -> StructuredProjectFeedbackProposal:
        """Generates project feedback via NVIDIA NIM."""
        name = clean_input_text(project.get("name", ""))
        tagline = clean_input_text(project.get("tagline", ""))
        category = clean_input_text(project.get("category", ""))
        description = clean_input_text(project.get("description", ""))
        repo = clean_input_text(project.get("repositoryUrl", "") or "")
        demo = clean_input_text(project.get("demoUrl", "") or "")
        focus_str = f"Specific Focus Areas: {', '.join(focus_areas)}\n" if focus_areas else ""

        system_instruction = (
            "You are a Senior Principal Software Architect and Security Auditor. "
            "Critically analyze the project context and output strictly valid JSON matching schema: "
            "executive_summary (string), strengths_summary (string), and findings (list of objects with "
            "title, severity, category, observation, evidence_quote, recommendation)."
        )

        user_prompt = (
            f"Project: {name}\nCategory: {category}\nTagline: {tagline}\n"
            f"Repo: {repo}\nDemo: {demo}\n{focus_str}\n"
            f"Specification:\n{description}"
        )

        json_data = self._call_nvidia_json(system_instruction, user_prompt)
        return StructuredProjectFeedbackProposal.model_validate(json_data)


nvidia_provider = NvidiaNimProvider()

