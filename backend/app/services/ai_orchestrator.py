"""Unified AI Orchestration Engine.

Orchestrates multi-provider AI execution across:
1. Google Gemini (via google-genai SDK)
2. OpenRouter (strictly enforcing free-tier constraints and rate limits)
3. NVIDIA NIM / NVIDIA API Catalog
4. Groq API
5. Zero-dependency Deterministic Offline Fallback

Seamlessly integrates with the Phase 3 BYOK Encrypted Credential Vault (AES-256-GCM),
executes automatic cascade failover on 429/503 errors, and enforces universal
output sanitization guaranteeing pure human prose with ZERO raw symbol debris.
"""

from __future__ import annotations

import logging
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from backend.app.config import settings
from backend.app.db.connection import db_manager
from backend.app.schemas.ai import ResearchAnswerProposal
from backend.app.schemas.project import (
    StructuredProjectFeedbackProposal,
    RawProjectFindingProposal,
)
from backend.app.services.text_cleaner import (
    clean_input_text,
    clean_output_text,
    clean_evidence_quote,
    clean_list_items,
    sanitize_research_proposal,
)
from backend.app.services.vault_service import vault_service

logger = logging.getLogger(__name__)


class AIOrchestratorService:
    """Central AI orchestration engine providing unified routing, vault integration, and symbol-free output."""

    def __init__(self) -> None:
        self.default_provider_order = ["gemini", "openrouter", "nvidia", "groq", "deterministic"]

    def _resolve_api_key(self, provider: str, user_id: Optional[str] = None) -> Optional[str]:
        """Resolves an API key, prioritizing the user's encrypted BYOK vault before system settings."""
        if user_id:
            try:
                byok_key = vault_service.get_active_credential_for_provider(user_id, provider)
                if byok_key and "placeholder" not in byok_key.lower():
                    return byok_key
            except Exception as e:
                logger.warning("Vault lookup error for user %s and provider %s: %s", user_id, provider, e)

        # Fall back to global application settings
        if provider == "gemini":
            k = settings.gemini_api_key
        elif provider == "openrouter":
            k = settings.openrouter_api_key
        elif provider == "nvidia":
            k = settings.nvidia_api_key
        elif provider == "groq":
            k = settings.groq_api_key
        else:
            k = None

        if k and "placeholder" not in k.lower():
            return k
        return None

    def sanitize_feedback_proposal(
        self,
        proposal: StructuredProjectFeedbackProposal,
    ) -> StructuredProjectFeedbackProposal:
        """Enforces pristine, symbol-free formatting on all proposal fields."""
        proposal.executive_summary = clean_evidence_quote(proposal.executive_summary)
        proposal.strengths_summary = clean_evidence_quote(proposal.strengths_summary)

        cleaned_findings: List[RawProjectFindingProposal] = []
        for f in proposal.findings:
            cleaned_findings.append(
                RawProjectFindingProposal(
                    title=clean_evidence_quote(f.title),
                    severity=f.severity,
                    category=f.category,
                    observation=clean_evidence_quote(f.observation),
                    evidence_quote=clean_evidence_quote(f.evidence_quote),
                    recommendation=clean_evidence_quote(f.recommendation),
                )
            )
        proposal.findings = cleaned_findings
        return proposal

    def generate_project_feedback(
        self,
        project: Dict[str, Any],
        focus_areas: Optional[List[str]] = None,
        user_id: Optional[str] = None,
        preferred_provider: Optional[str] = None,
        review_id: Optional[str] = None,
    ) -> StructuredProjectFeedbackProposal:
        """Executes the AI provider cascade for technical project audits."""
        focus = focus_areas or []
        user_id = user_id or project.get("userId") or project.get("user_id") or "usr_anonymous"
        project_id = project.get("id")

        # Resolve policy-approved providers and prohibited fallbacks (P0-2)
        from backend.app.services.provider_policy_service import provider_policy_service
        from backend.app.services.budget_service import budget_service, BudgetExceededError

        providers_to_try, policy_meta = provider_policy_service.resolve_provider_sequence(
            user_id=user_id,
            project_id=project_id,
            task_type="review",
            requested_provider=preferred_provider,
        )

        reservation_token = None
        try:
            reservation_token = budget_service.check_and_reserve_budget(
                user_id=user_id,
                project_id=project_id,
                estimated_cost_usd=0.005,
                task_type="review",
            )
        except BudgetExceededError as b_err:
            logger.warning("AI Budget hard stop triggered for user %s: %s. Falling back to deterministic rule engine.", user_id, b_err.detail)
            proposal = self._generate_deterministic_proposal(project, focus)
            proposal.fallback_reason = f"Budget limit reached: {b_err.detail}"
            sanitized = self.sanitize_feedback_proposal(proposal)
            setattr(sanitized, "_usage", {"prompt_tokens": 0, "completion_tokens": 0, "provider": "deterministic"})
            return sanitized

        last_error = None
        call_start = time.time()

        for provider in providers_to_try:
            if provider == "deterministic":
                logger.info("Executing deterministic offline synthesis as final fallback.")
                proposal = self._generate_deterministic_proposal(project, focus)
                sanitized = self.sanitize_feedback_proposal(proposal)
                duration_ms = int((time.time() - call_start) * 1000)
                prompt_toks = max(200, len(project.get("description", "")) // 4 + 300)
                comp_toks = 450
                try:
                    usage_rec = self.record_token_usage(
                        user_id=user_id,
                        provider="deterministic",
                        model_id="offline-rule-engine-v1",
                        task_type="project_review",
                        prompt_tokens=prompt_toks,
                        completion_tokens=comp_toks,
                        duration_ms=duration_ms,
                        project_id=project_id,
                        review_id=review_id,
                        status="success",
                    )
                    budget_service.reconcile_reservation(user_id=user_id, reservation_token=reservation_token, actual_cost_usd=usage_rec.get("costUsd", 0.0), project_id=project_id)
                except Exception as log_err:
                    logger.warning("Failed to record token usage for deterministic run: %s", log_err)
                setattr(sanitized, "_usage", {"prompt_tokens": prompt_toks, "completion_tokens": comp_toks, "provider": "deterministic"})
                return sanitized

            api_key = self._resolve_api_key(provider, user_id)
            if not api_key:
                continue

            try:
                provider_start = time.time()
                logger.info("Attempting project feedback generation via provider '%s'...", provider)
                model_id = "unknown"
                if provider == "gemini":
                    model_id = getattr(settings, "gemini_model", "gemini-3.8-flash")
                    proposal = self._call_gemini(project, focus, api_key)
                elif provider == "openrouter":
                    model_id = getattr(settings, "openrouter_model", "meta-llama/llama-3.3-70b-instruct:free")
                    from backend.app.services.openrouter_service import OpenRouterProvider, openrouter_provider
                    if getattr(openrouter_provider, "generate_project_feedback", None) and getattr(openrouter_provider.generate_project_feedback, "__code__", None) != OpenRouterProvider.generate_project_feedback.__code__:
                        proposal = openrouter_provider.generate_project_feedback(project, focus)
                    else:
                        op = OpenRouterProvider(api_key=api_key, free_only=True)
                        proposal = op.generate_project_feedback(project, focus)
                elif provider == "nvidia":
                    model_id = getattr(settings, "nvidia_model", "meta/llama-3.1-70b-instruct")
                    from backend.app.services.nvidia_service import NvidiaNimProvider, nvidia_provider
                    if getattr(nvidia_provider, "generate_project_feedback", None) and getattr(nvidia_provider.generate_project_feedback, "__code__", None) != NvidiaNimProvider.generate_project_feedback.__code__:
                        proposal = nvidia_provider.generate_project_feedback(project, focus)
                    else:
                        np = NvidiaNimProvider(api_key=api_key)
                        proposal = np.generate_project_feedback(project, focus)
                elif provider == "groq":
                    model_id = getattr(settings, "groq_model", "llama-3.3-70b-versatile")
                    proposal = self._call_groq(project, focus, api_key)
                else:
                    continue

                if proposal and proposal.findings:
                    proposal.provider = provider
                    proposal.model = model_id
                    proposal.is_fallback = False
                    proposal.execution_mode = "multi_provider_llm"
                    duration_ms = int((time.time() - provider_start) * 1000)
                    prompt_toks = max(300, len(project.get("description", "")) // 4 + 400)
                    comp_toks = max(400, len(proposal.executive_summary) // 4 + sum(len(f.observation) // 4 for f in proposal.findings))
                    try:
                        usage_rec = self.record_token_usage(
                            user_id=user_id,
                            provider=provider,
                            model_id=model_id,
                            task_type="project_review",
                            prompt_tokens=prompt_toks,
                            completion_tokens=comp_toks,
                            duration_ms=duration_ms,
                            project_id=project_id,
                            review_id=review_id,
                            status="success",
                        )
                        budget_service.reconcile_reservation(user_id=user_id, reservation_token=reservation_token, actual_cost_usd=usage_rec.get("costUsd", 0.0), project_id=project_id)
                    except Exception as log_err:
                        logger.warning("Failed to record token usage for provider %s: %s", provider, log_err)
                    sanitized = self.sanitize_feedback_proposal(proposal)
                    setattr(sanitized, "_usage", {"prompt_tokens": prompt_toks, "completion_tokens": comp_toks, "provider": provider})
                    return sanitized

            except Exception as e:
                last_error = e
                logger.warning("Provider '%s' generation failed: %s. Cascading to next provider.", provider, e)
                continue

        # If all providers were exhausted or failed, guarantee offline synthesis
        logger.warning("All configured AI providers exhausted. Falling back to deterministic proposal.")
        proposal = self._generate_deterministic_proposal(project, focus)
        proposal.provider = "deterministic"
        proposal.model = "deterministic_offline"
        proposal.is_fallback = True
        proposal.fallback_reason = "All configured external AI providers were exhausted or failed; synthesized via offline deterministic rule engine."
        proposal.execution_mode = "offline_rule_engine"
        sanitized = self.sanitize_feedback_proposal(proposal)
        duration_ms = int((time.time() - call_start) * 1000)
        prompt_toks = 500
        comp_toks = 400
        try:
            usage_rec = self.record_token_usage(
                user_id=user_id,
                provider="deterministic",
                model_id="offline-rule-engine-v1",
                task_type="project_review",
                prompt_tokens=prompt_toks,
                completion_tokens=comp_toks,
                duration_ms=duration_ms,
                project_id=project_id,
                review_id=review_id,
                status="success",
            )
            budget_service.reconcile_reservation(user_id=user_id, reservation_token=reservation_token, actual_cost_usd=usage_rec.get("costUsd", 0.0), project_id=project_id)
        except Exception as log_err:
            logger.warning("Failed to record fallback token usage: %s", log_err)
        setattr(sanitized, "_usage", {"prompt_tokens": prompt_toks, "completion_tokens": comp_toks, "provider": "deterministic"})
        return sanitized

    def _call_gemini(
        self,
        project: Dict[str, Any],
        focus_areas: List[str],
        api_key: str,
    ) -> StructuredProjectFeedbackProposal:
        """Invokes Google Gemini using the official google-genai SDK."""
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        prompt = self._build_review_prompt(project, focus_areas)
        system_instruction = self._build_review_system_instruction()

        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            response_json_schema=StructuredProjectFeedbackProposal.model_json_schema(),
            temperature=0.2,
        )

        model_name = settings.gemini_model or "gemini-3.8-flash"
        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=config,
        )

        if not response.text:
            raise ValueError("Gemini returned empty response.")

        return StructuredProjectFeedbackProposal.model_validate_json(response.text)

    def _call_groq(
        self,
        project: Dict[str, Any],
        focus_areas: List[str],
        api_key: str,
    ) -> StructuredProjectFeedbackProposal:
        """Invokes Groq API with Llama-3.3-70B."""
        import httpx

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        body = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": self._build_review_system_instruction()},
                {"role": "user", "content": self._build_review_prompt(project, focus_areas)},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2,
        }

        with httpx.Client(timeout=30.0) as client:
            resp = client.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=body)
            if resp.status_code != 200:
                raise ValueError(f"Groq returned error {resp.status_code}: {resp.text}")
            content = resp.json()["choices"][0]["message"]["content"]
            return StructuredProjectFeedbackProposal.model_validate_json(content)

    def _build_review_system_instruction(self) -> str:
        return (
            "You are a Senior Principal Software Architect, Application Security Auditor, and UX Evaluation Specialist.\n"
            "Your objective: Conduct a rigorous, critical technical evaluation of the project submitted by a creator.\n\n"
            "EVALUATION CRITERIA:\n"
            "1. Architecture and Design Patterns: evaluate modularity, coupling, separation of concerns, and framework fitness.\n"
            "2. UX and Usability: evaluate onboarding friction, cognitive load, user feedback loops, and clarity.\n"
            "3. Performance and Scaling: evaluate latency bottlenecks, unbounded loops, state synchronization, and memory efficiency.\n"
            "4. Security and Data Protection: evaluate authentication, authorization, access control boundaries, and secrets leakage risks.\n"
            "5. Accessibility and Reliability: evaluate error recovery, network resilience, and fault tolerance.\n\n"
            "CRITICAL CONSTRAINTS:\n"
            "- ZERO FABRICATED CITATIONS: Every finding must include an evidence_quote citing exact text from the creator's description or specification.\n"
            "- ACTIONABLE RECOMMENDATIONS: Provide concrete, step-by-step engineering guidance to address each finding.\n"
            "- HONEST FINDINGS: Produce at least 2 distinct findings highlighting real risks or trade-offs. Classify severity accurately ('blocker', 'high', 'medium', 'low').\n"
            "- Output MUST strictly conform to the StructuredProjectFeedbackProposal JSON schema with pure human text without markdown symbols."
        )

    def _build_review_prompt(self, project: Dict[str, Any], focus_areas: List[str]) -> str:
        name = clean_evidence_quote(project.get("name", ""))
        tagline = clean_evidence_quote(project.get("tagline", ""))
        category = clean_evidence_quote(project.get("category", ""))
        description = clean_evidence_quote(project.get("description", ""))
        repo = project.get("repositoryUrl", "") or ""
        demo = project.get("demoUrl", "") or ""

        focus_str = f"Specific Focus Areas: {', '.join(focus_areas)}\n" if focus_areas else ""

        # Retrieve active design links and visual assets to ground prompt in multimodal specifications
        active_assets_str = ""
        with db_manager.session() as conn:
            proj_id = project.get("id")
            if proj_id:
                asset_rows = conn.execute(
                    "SELECT source_type, name, content_text FROM project_sources WHERE project_id = ? AND is_active = 1",
                    (proj_id,),
                ).fetchall()
                if asset_rows:
                    active_assets_str = "\nActive UI Designs, Specifications & Architecture Assets:\n"
                    for ar in asset_rows:
                        active_assets_str += f"- [{ar['source_type'].upper()}] {ar['name']}: {ar['content_text'][:350]}\n"

        return (
            f"<project_context>\n"
            f"Project Name: {name}\n"
            f"Category: {category}\n"
            f"Tagline: {tagline}\n"
            f"Repository URL: {repo or 'Not provided'}\n"
            f"Live Demo URL: {demo or 'Not provided'}\n"
            f"{focus_str}\n"
            f"Technical Specification & Overview:\n"
            f"{description}\n"
            f"{active_assets_str}"
            f"</project_context>\n\n"
            f"TASK: Analyze the project context above according to the 5 evaluation criteria. "
            f"Produce an executive summary, strengths summary, and a list of actionable findings with exact evidence quotes."
        )

    def _generate_deterministic_proposal(
        self,
        project: Dict[str, Any],
        focus_areas: List[str],
    ) -> StructuredProjectFeedbackProposal:
        """Produces a deterministic, valid structured evaluation grounded in actual project text."""
        name = clean_evidence_quote(project.get("name", "Project"))
        category = clean_evidence_quote(project.get("category", "developer-tools"))
        desc = project.get("description", "")
        desc_snippet = clean_evidence_quote(desc[:120].strip() or name)

        findings: List[RawProjectFindingProposal] = [
            RawProjectFindingProposal(
                title=f"Verify State Recovery and Fault Tolerance in {name}",
                severity="high",
                category="architecture",
                observation=(
                    f"The project specification for {name} demonstrates clear intent, but lacks explicit details "
                    f"regarding data persistence recovery strategies during abrupt node termination or client network partitions."
                ),
                evidence_quote=desc_snippet,
                recommendation=(
                    "Implement transactional write-ahead logging or snapshotting to ensure zero data corruption "
                    "on unexpected system restarts."
                ),
            ),
            RawProjectFindingProposal(
                title="Establish Bounded Resource and Memory Throttling",
                severity="medium",
                category="performance",
                observation=(
                    f"In high-concurrency environments, unbounded operations in the {category} domain risk "
                    f"memory exhaustion or thread starvation."
                ),
                evidence_quote=desc_snippet,
                recommendation=(
                    "Introduce a leaky-bucket or token-bucket rate limiter with fixed worker pool bounds to gracefully throttle incoming load."
                ),
            ),
            RawProjectFindingProposal(
                title="Enforce Cryptographic Authorization and Audience Claim Verification",
                severity="medium",
                category="security",
                observation=(
                    "Client-supplied identity fields must never be trusted without cryptographic validation of JWT claims and tenant boundaries."
                ),
                evidence_quote=name,
                recommendation=(
                    "Validate the audience, issuer, and expiration claims on every incoming Bearer token before dispatching to business logic."
                ),
            ),
        ]

        # Inspect active sources to ground findings in design system (Figma/Canva) and visual layouts (screenshots/diagrams)
        with db_manager.session() as conn:
            proj_id = project.get("id")
            if proj_id:
                design_row = conn.execute(
                    "SELECT content_text FROM project_sources WHERE project_id = ? AND is_active = 1 AND source_type = 'design_link' LIMIT 1",
                    (proj_id,),
                ).fetchone()
                if design_row:
                    d_quote = clean_evidence_quote(design_row["content_text"][:120].strip())
                    findings.append(
                        RawProjectFindingProposal(
                            title="Validate Design System Color Contrast and Responsive Grid Hierarchy",
                            severity="medium",
                            category="accessibility",
                            observation="Design specifications indicate responsive layout grid tokens. Verify that typographic color contrast meets WCAG 2.2 AA (4.5:1 ratio) across dark and light themes.",
                            evidence_quote=d_quote,
                            recommendation="Enforce design token contrast verification in Figma/Canva component library prior to production release.",
                        )
                    )

                vis_row = conn.execute(
                    "SELECT content_text FROM project_sources WHERE project_id = ? AND is_active = 1 AND source_type IN ('screenshot', 'diagram') LIMIT 1",
                    (proj_id,),
                ).fetchone()
                if vis_row:
                    v_quote = clean_evidence_quote(vis_row["content_text"][:120].strip())
                    findings.append(
                        RawProjectFindingProposal(
                            title="Audit Visual Architecture Diagram Component Boundaries",
                            severity="low",
                            category="architecture",
                            observation="Visual diagram and screenshot assets define system topology. Ensure interactive component boundaries maintain isolated failure domains.",
                            evidence_quote=v_quote,
                            recommendation="Decouple visual component state from backend streaming channels using isolated React error boundaries.",
                        )
                    )

        return StructuredProjectFeedbackProposal(
            executive_summary=(
                f"Comprehensive technical audit of {name}. The project addresses core requirements in the {category} space "
                f"with a well-defined product vision. Key architectural and operational considerations have been identified across "
                f"system reliability, resource bounds, and security boundaries."
            ),
            strengths_summary=(
                f"{name} provides a clear value proposition with targeted category alignment in {category}. "
                f"The core concepts demonstrate strong understanding of developer workflows and domain requirements."
            ),
            findings=findings,
            provider="deterministic",
            model="deterministic_offline",
            is_fallback=True,
            fallback_reason="Synthesized via deterministic offline rule engine grounded in project specifications.",
            execution_mode="offline_rule_engine",
        )

    def record_usage(
        self,
        user_id: str,
        provider: str,
        model_id: str,
        task_type: str,
        prompt_tokens: int = 0,
        completion_tokens: int = 0,
        duration_ms: int = 0,
        project_id: Optional[str] = None,
        review_id: Optional[str] = None,
        status: str = "success",
    ) -> Dict[str, Any]:
        """Records an execution ledger entry with estimated cost in USD."""
        cost_rates = {
            "gemini": 0.00015,
            "openrouter": 0.0000,
            "nvidia": 0.0002,
            "groq": 0.0001,
            "deterministic": 0.0,
        }
        rate = cost_rates.get(provider.lower(), 0.0001)
        cost_usd = round(((prompt_tokens + completion_tokens) / 1000.0) * rate, 6)

        ledger_id = f"usg_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc).isoformat()

        with db_manager.session() as conn:
            conn.execute(
                """
                INSERT INTO ai_usage_ledger (
                    id, user_id, project_id, review_id, provider, model_id,
                    task_type, prompt_tokens, completion_tokens, estimated_cost_usd,
                    duration_ms, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    ledger_id, user_id, project_id, review_id, provider, model_id,
                    task_type, prompt_tokens, completion_tokens, cost_usd,
                    duration_ms, status, now
                ),
            )
        return {"id": ledger_id, "costUsd": cost_usd, "recordedAt": now}

    record_token_usage = record_usage

    def get_project_usage_summary(self, project_id: str) -> Dict[str, Any]:
        """Calculates total token usage and cost for a project."""
        with db_manager.session() as conn:
            row = conn.execute(
                """
                SELECT 
                    count(*) as total_calls,
                    sum(prompt_tokens) as total_prompt,
                    sum(completion_tokens) as total_completion,
                    sum(estimated_cost_usd) as total_cost,
                    sum(duration_ms) as total_duration
                FROM ai_usage_ledger
                WHERE project_id = ?
                """,
                (project_id,),
            ).fetchone()

        return {
            "projectId": project_id,
            "totalCalls": row["total_calls"] or 0,
            "totalTokens": (row["total_prompt"] or 0) + (row["total_completion"] or 0),
            "totalCostUsd": round(row["total_cost"] or 0.0, 4),
            "averageLatencyMs": int((row["total_duration"] or 0) / max(1, row["total_calls"] or 1)),
        }

    def get_project_ai_config(self, project_id: str) -> Dict[str, Any]:
        """Retrieves configured provider preferences for a project."""
        with db_manager.session() as conn:
            rows = conn.execute(
                "SELECT * FROM project_provider_configs WHERE project_id = ?",
                (project_id,),
            ).fetchall()

        configs = {}
        for r in rows:
            configs[r["task_type"]] = {
                "primaryProvider": r["primary_provider"],
                "fallbackProvider": r["fallback_provider"],
                "modelOverride": r["model_override"],
                "temperature": r["temperature"],
                "maxTokens": r["max_tokens"],
            }
        return configs

    def set_project_ai_config(
        self,
        project_id: str,
        user_id: str,
        task_type: str,
        primary_provider: str,
        fallback_provider: Optional[str] = None,
        model_override: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Sets or updates provider configuration for a project task."""
        now = datetime.now(timezone.utc).isoformat()
        cfg_id = f"cfg_{uuid.uuid4().hex[:12]}"

        with db_manager.session() as conn:
            conn.execute(
                """
                INSERT INTO project_provider_configs (
                    id, user_id, project_id, task_type, primary_provider,
                    fallback_provider, model_override, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(project_id, task_type) DO UPDATE SET
                    primary_provider = excluded.primary_provider,
                    fallback_provider = excluded.fallback_provider,
                    model_override = excluded.model_override,
                    updated_at = excluded.updated_at
                """,
                (
                    cfg_id, user_id, project_id, task_type, primary_provider,
                    fallback_provider, model_override, now, now
                ),
            )
        return {"projectId": project_id, "taskType": task_type, "primaryProvider": primary_provider}


ai_orchestrator = AIOrchestratorService()
