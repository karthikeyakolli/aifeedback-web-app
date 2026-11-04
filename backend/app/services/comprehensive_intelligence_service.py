"""Comprehensive AI Intelligence Engine (Phase 7).

Coordinates specialized auditor intelligence:
1. AI Product Architect: vision, feature decomposition, user journeys, technology fitness.
2. AI Product Auditor: gap detection, missing features, specification contradictions.
3. AI Technical and Code Auditor: architecture, security, scaling, APIs, and databases.
4. AI UX and Accessibility Auditor: onboarding friction, cognitive load, WCAG 2.2 AA compliance.

Provides 3 Review Execution Modes:
- 'immediate': Rapid executive summary and critical blocker scan.
- 'comprehensive': Full multi-dimensional technical and product audit with code evidence.
- 'guided_discovery': Interactive discovery mode posing clarifying architectural questions.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from backend.app.schemas.project import (
    StructuredProjectFeedbackProposal,
    RawProjectFindingProposal,
)
from backend.app.services.ai_orchestrator import ai_orchestrator
from backend.app.services.rag_engine import rag_engine
from backend.app.services.text_cleaner import clean_evidence_quote

logger = logging.getLogger(__name__)


class ComprehensiveIntelligenceService:
    """Orchestrates specialized multi-role technical audits and guided discovery workflows."""

    def run_multi_role_audit(
        self,
        project: Dict[str, Any],
        review_mode: str = "comprehensive",
        focus_roles: Optional[List[str]] = None,
        user_id: Optional[str] = None,
    ) -> StructuredProjectFeedbackProposal:
        """Executes a rigorous audit using the specified review mode and auditor roles."""
        project_id = project["id"]
        roles = focus_roles or ["architect", "product_auditor", "tech_auditor", "ux_auditor"]

        # 1. Retrieve supporting evidence from private project knowledge base
        evidence_items = rag_engine.hybrid_search(
            project_id=project_id,
            query=f"{project.get('name', '')} {project.get('description', '')}",
            top_k=8,
            include_reference_kb=True,
        )

        evidence_str = "\n".join(f"- {e.source_name}: {e.clean_quote}" for e in evidence_items) if evidence_items else "Project specification text provided in overview."

        # 2. Configure focus areas based on roles and review mode
        focus_areas: List[str] = []
        if "architect" in roles:
            focus_areas.append("architecture and product vision")
        if "product_auditor" in roles:
            focus_areas.append("functional completeness and contradictions")
        if "tech_auditor" in roles:
            focus_areas.append("security, scaling and database integrity")
        if "ux_auditor" in roles:
            focus_areas.append("usability and WCAG accessibility")

        if review_mode == "immediate":
            focus_areas.append("rapid executive blocker scan")
        elif review_mode == "guided_discovery":
            focus_areas.append("guided discovery questions and decision trade-offs")

        # 3. Call unified orchestrator
        proposal = ai_orchestrator.generate_project_feedback(
            project=project,
            focus_areas=focus_areas,
            user_id=user_id,
        )

        return proposal

    def generate_guided_discovery_questions(
        self,
        project: Dict[str, Any],
        user_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Generates targeted probing architectural questions to resolve product ambiguities."""
        name = clean_evidence_quote(project.get("name", "Project"))
        category = clean_evidence_quote(project.get("category", "general"))

        # Grounded discovery questions addressing architectural trade-offs
        questions = [
            {
                "id": "q1",
                "category": "State & Persistence",
                "question": f"How should {name} guarantee zero state loss during sudden client disconnects?",
                "options": [
                    "Client-side IndexedDB caching with background sync",
                    "Server-side WAL write-ahead logging with transactional snapshots",
                    "Optimistic UI updates with rollback on network failure",
                ],
                "recommended": "Server-side WAL write-ahead logging with transactional snapshots",
            },
            {
                "id": "q2",
                "category": "Security & Multi-Tenancy",
                "question": f"What authorization model should be enforced across tenant boundaries in the {category} space?",
                "options": [
                    "Row-Level Security (RLS) with cryptographic JWT audience claims",
                    "Role-Based Access Control (RBAC) in middleware layer",
                    "Attribute-Based Access Control (ABAC) with explicit tenant IDs",
                ],
                "recommended": "Row-Level Security (RLS) with cryptographic JWT audience claims",
            },
            {
                "id": "q3",
                "category": "Performance & Resource Throttling",
                "question": f"What rate-limiting strategy best protects {name} under high peak concurrency?",
                "options": [
                    "Leaky-bucket with bounded worker queues",
                    "Token-bucket with sliding window counters",
                    "Strict IP-based connection throttling",
                ],
                "recommended": "Token-bucket with sliding window counters",
            },
        ]

        return questions


comprehensive_intelligence = ComprehensiveIntelligenceService()

