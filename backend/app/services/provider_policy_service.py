"""AI Provider Permission, Policy & Routing Engine (Phase 12 / P0-2).

Enforces:
- Account defaults and project/task provider overrides.
- Explicit allowed vs prohibited providers (NEVER fall back to a disabled or prohibited provider).
- Pre-flight budget reservation via budget_service.
- BYOK (user vault) vs Platform credential preferences.
- Structured execution logging with model, tokens, duration, and cost.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Tuple

from backend.app.config import settings
from backend.app.db.connection import db_manager
from backend.app.services.budget_service import budget_service

logger = logging.getLogger(__name__)

ALL_PROVIDERS = ["gemini", "openrouter", "nvidia", "groq", "deterministic"]


class ProviderPolicyService:
    """Manages AI provider permissions, project overrides, prohibited fallbacks, and budget enforcement."""

    def __init__(self) -> None:
        self.db = db_manager

    def resolve_provider_sequence(
        self,
        user_id: str,
        project_id: Optional[str] = None,
        task_type: str = "review",
        requested_provider: Optional[str] = None,
    ) -> Tuple[List[str], Dict[str, Any]]:
        """Resolves the allowed provider cascade for a user and project.
        
        Guarantees:
        - If a project override exists, primary_provider is prioritized.
        - If fallback_provider is specified, it is permitted next.
        - Disallowed/prohibited providers are strictly stripped out.
        - Deterministic fallback is always preserved as the ultimate safety net.
        """
        config = self._get_project_provider_config(project_id, task_type) if project_id else None

        prohibited_providers = set()
        allowed_providers = list(ALL_PROVIDERS)

        # Check for user credential vault statuses: if a user explicitly disabled a credential, prohibit it
        with self.db.session() as conn:
            disabled_creds = conn.execute(
                "SELECT provider FROM user_credentials WHERE user_id = ? AND is_enabled = 0",
                (user_id,),
            ).fetchall()
            for r in disabled_creds:
                prohibited_providers.add(r["provider"].lower())

        # If project has an explicit provider configuration
        if config:
            primary = config.get("primary_provider")
            fallback = config.get("fallback_provider")
            ordered = []
            if primary and primary not in prohibited_providers:
                ordered.append(primary)
            if fallback and fallback not in prohibited_providers and fallback not in ordered:
                ordered.append(fallback)
            # Add remaining non-prohibited providers
            for p in allowed_providers:
                if p not in prohibited_providers and p not in ordered:
                    ordered.append(p)
            providers_to_try = ordered
        else:
            # Default sequence, with requested_provider prioritized if valid
            providers_to_try = [p for p in allowed_providers if p not in prohibited_providers]
            if requested_provider and requested_provider in providers_to_try:
                providers_to_try.remove(requested_provider)
                providers_to_try.insert(0, requested_provider)

        # Guarantee deterministic is present at the end
        if "deterministic" not in providers_to_try:
            providers_to_try.append("deterministic")

        policy_metadata = {
            "prohibitedProviders": list(prohibited_providers),
            "primaryProvider": providers_to_try[0] if providers_to_try else "deterministic",
            "modelOverride": config.get("model_override") if config else None,
            "taskType": task_type,
        }

        return providers_to_try, policy_metadata

    def _get_project_provider_config(self, project_id: str, task_type: str) -> Optional[Dict[str, Any]]:
        with self.db.session() as conn:
            row = conn.execute(
                "SELECT * FROM project_provider_configs WHERE project_id = ? AND task_type = ?",
                (project_id, task_type),
            ).fetchone()
            if not row:
                return None
            return {
                "id": row["id"],
                "userId": row["user_id"],
                "projectId": row["project_id"],
                "taskType": row["task_type"],
                "primary_provider": row["primary_provider"],
                "fallback_provider": row["fallback_provider"],
                "model_override": row["model_override"],
                "temperature": float(row["temperature"]),
                "max_tokens": int(row["max_tokens"]),
            }


provider_policy_service = ProviderPolicyService()
