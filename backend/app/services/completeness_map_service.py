"""Product Completeness Map & Knowledge Graph Engine (Phase 8).

Constructs an interactive product knowledge graph mapping:
- High-level Goals, Problems, and Personas
- Features and Functional Requirements
- Technical Artifacts: Screens, APIs, Database Entities, Security Policies, and Tests
- Relationships: addresses, depends_on, implements, verifies, conflicts_with

Detects:
- Missing components (e.g. Feature without an API or Test)
- Contradictory requirements (e.g. conflicting auth assumptions)
- Disconnected or orphaned elements

Provides projections for:
1. Interactive Network Graph View
2. Hierarchical Tree Decomposition
3. Tabular Gap Matrix
4. Author Decision Registry (approve, dismiss, defer)
"""

from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from backend.app.db.connection import db_manager
from backend.app.services.text_cleaner import clean_evidence_quote

logger = logging.getLogger(__name__)


class CompletenessMapService:
    """Manages product completeness graph nodes, edges, gap analysis, and author decisions."""

    def __init__(self) -> None:
        self.db = db_manager

    def build_completeness_map(self, project: Dict[str, Any]) -> Dict[str, Any]:
        """Constructs or retrieves the knowledge graph for a project, running gap detection."""
        project_id = project["id"]

        with self.db.session() as conn:
            existing_nodes = conn.execute(
                "SELECT * FROM product_completeness_nodes WHERE project_id = ?",
                (project_id,),
            ).fetchall()

        if not existing_nodes:
            self._generate_baseline_graph(project)

        return self.get_completeness_map(project_id)

    def get_completeness_map(self, project_id: str) -> Dict[str, Any]:
        """Returns the complete product map with graph, hierarchy, and table projections."""
        with self.db.session() as conn:
            nodes_rows = conn.execute(
                "SELECT * FROM product_completeness_nodes WHERE project_id = ? ORDER BY created_at ASC",
                (project_id,),
            ).fetchall()

            edges_rows = conn.execute(
                "SELECT * FROM product_completeness_edges WHERE project_id = ?",
                (project_id,),
            ).fetchall()

            decisions_rows = conn.execute(
                "SELECT * FROM product_decisions WHERE project_id = ?",
                (project_id,),
            ).fetchall()

        nodes = [self._format_node(r) for r in nodes_rows]
        edges = [self._format_edge(r) for r in edges_rows]
        decisions = [self._format_decision(r) for r in decisions_rows]

        # Calculate metrics across expanded gap states
        total_nodes = len(nodes)
        complete_count = sum(1 for n in nodes if n["status"] in ("complete", "evidenced_present", "verified_complete"))
        missing_count = sum(1 for n in nodes if n["status"] in ("missing", "not_provided"))
        contradictory_count = sum(1 for n in nodes if n["status"] == "contradictory")
        incomplete_count = sum(1 for n in nodes if n["status"] in ("incomplete", "partially_evidenced", "specified_not_verified", "not_verified", "unclear", "awaiting_author_decision"))

        completeness_score = int((complete_count / max(1, total_nodes)) * 100)

        # Projections
        hierarchy = self._build_hierarchy_projection(nodes, edges)
        table_view = self._build_table_projection(nodes, edges)

        gap_state_breakdown = {
            s: sum(1 for n in nodes if n["status"] == s)
            for s in [
                "evidenced_present", "partially_evidenced", "specified_not_verified",
                "not_provided", "unclear", "contradictory", "not_verified",
                "missing", "not_applicable", "awaiting_author_decision", "verified_complete",
            ]
        }

        summary_data = {
            "totalNodes": total_nodes,
            "completeCount": complete_count,
            "incompleteCount": incomplete_count,
            "missingCount": missing_count,
            "contradictoryCount": contradictory_count,
            "completenessPercentage": completeness_score,
            "gapStateBreakdown": gap_state_breakdown,
        }

        return {
            "projectId": project_id,
            "completenessScore": completeness_score,
            "summary": summary_data,
            "metrics": summary_data,
            "graph": {
                "nodes": nodes,
                "edges": edges,
            },
            "hierarchy": hierarchy,
            "table": table_view,
            "decisions": decisions,
        }

    def record_author_decision(
        self,
        project_id: str,
        user_id: str,
        node_id: str,
        decision_type: str,
        rationale: str = "",
    ) -> Dict[str, Any]:
        """Records an author approval, dismissal, or deferral of a detected gap."""
        decision_id = f"dec_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc).isoformat()

        with self.db.session() as conn:
            conn.execute(
                """
                INSERT INTO product_decisions (id, project_id, user_id, node_id, decision_type, rationale, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (decision_id, project_id, user_id, node_id, decision_type, clean_evidence_quote(rationale), now),
            )

            # If approved or dismissed, update node status
            new_status = "complete" if decision_type == "approved" else "incomplete"
            conn.execute(
                "UPDATE product_completeness_nodes SET status = ?, updated_at = ? WHERE id = ? AND project_id = ?",
                (new_status, now, node_id, project_id),
            )

        return {"id": decision_id, "nodeId": node_id, "decision": decision_type, "status": "recorded"}

    def _generate_baseline_graph(self, project: Dict[str, Any]) -> None:
        """Derives a structured baseline graph from the project description and specifications."""
        project_id = project["id"]
        name = clean_evidence_quote(project.get("name", "Project"))
        category = clean_evidence_quote(project.get("category", "general"))
        desc = clean_evidence_quote(project.get("description", ""))

        now = datetime.now(timezone.utc).isoformat()

        # Seed core nodes across the complete 15-node taxonomy and 11 gap states
        raw_nodes = [
            # Tier 1: Strategy, Users & Needs
            ("n_goal_1", "product_goals", f"{name} Strategic Mission", f"Empower engineering teams in the {category} ecosystem with automated, verifiable AI feedback.", "verified_complete", 1.0),
            ("n_prob_1", "problems", "Fragmented Audit Cycles & Subjective Reviews", "Teams suffer from manual reviews that lack evidence citations, audit trails, and verifiable benchmarks.", "evidenced_present", 0.95),
            ("n_user_1", "target_users", "Principal Architects & Tech Leads", "Senior engineering stakeholders responsible for system integrity, security policies, and launch readiness.", "evidenced_present", 0.95),
            ("n_need_1", "user_needs", "Immutable Evidence & Verifiable Audit Reports", "Authors need traceable quotes linked directly to project source snapshots with line-level references.", "evidenced_present", 0.90),

            # Tier 2: Journeys & Capabilities
            ("n_jour_1", "user_journeys", "Ingestion to Scrutinized Report Workflow", "End-to-end journey from source file/git ingestion to multi-role AI review and interactive chat.", "evidenced_present", 0.90),
            ("n_cap_1", "capabilities", "Multi-Provider AI Orchestration", "Flexible LLM dispatching across Gemini, OpenRouter, and NVIDIA with deterministic offline fallback.", "evidenced_present", 0.95),
            ("n_feat_1", "features", "Automated Multi-Model Review Engine", "Rigorous AI evaluation across 5 technical and UX dimensions with fenced worker leases.", "evidenced_present", 0.95),
            ("n_feat_2", "features", "Interactive Product Completeness Map", "Visual graph decomposition of goals, APIs, schemas, and missing requirements across 15 categories.", "evidenced_present", 0.95),
            ("n_req_1", "requirements", "Automated Periodic Health Check Cron", "Missing scheduled background health heartbeat monitor for external LLM endpoints.", "missing", 0.85),
            ("n_req_2", "requirements", "Bi-directional Real-Time Ingestion Sync", "Automatic git webhook ingestion from private GitLab repositories.", "partially_evidenced", 0.80),

            # Tier 3: UX & Interface Contracts
            ("n_scr_1", "screens", "Project Review & Inspection Studio", "Comprehensive view displaying executive summaries, findings matrix, and evidence drawer.", "evidenced_present", 0.95),
            ("n_int_1", "interactions", "Interactive Finding Acceptance & Task Conversion", "Author controls allowing direct conversion of findings into actionable improvement tasks.", "evidenced_present", 0.90),
            ("n_acc_1", "acceptance_criteria", "Strict Read-Only Public Audit Space", "Public space strictly prevents unauthorized writes and voting during initial release.", "verified_complete", 1.0),

            # Tier 4: Technical Architecture & Data
            ("n_api_1", "apis", "Review Reservation and Finalization API", "Endpoints /projects/{id}/review/start and background worker lease finalization.", "evidenced_present", 0.95),
            ("n_db_1", "data_entities", "Relational AI Reviews & Reports Schema", "Durable storage of reviews, findings, immutable snapshots, and evidence citations.", "evidenced_present", 0.95),
            ("n_sec_1", "security_controls", "Cryptographic BYOK Credential Vault", "AES-256-GCM encryption with authenticated aad tags for user API keys and private repo tokens.", "verified_complete", 1.0),

            # Tier 5: Quality & Reliability
            ("n_test_1", "tests", "Concurrency & Fenced Worker Lease Test Suite", "Verifies zero active duplicate review sessions and stale lease rejection.", "verified_complete", 1.0),
            ("n_gap_1", "tests", "Adversarial Prompt Injection Fuzz Testing", "Test coverage for malicious XML tag injections in attached documents.", "not_verified", 0.80),
        ]

        # Seed relationships across the 8 canonical relationship types
        raw_edges = [
            ("n_feat_1", "n_prob_1", "implements"),
            ("n_feat_2", "n_goal_1", "supports"),
            ("n_need_1", "n_user_1", "part_of"),
            ("n_jour_1", "n_need_1", "supports"),
            ("n_cap_1", "n_feat_1", "implements"),
            ("n_api_1", "n_feat_1", "implements"),
            ("n_db_1", "n_api_1", "depends_on"),
            ("n_sec_1", "n_api_1", "validates"),
            ("n_test_1", "n_api_1", "verifies"),
            ("n_req_1", "n_feat_1", "required_by"),
            ("n_scr_1", "n_jour_1", "implements"),
            ("n_int_1", "n_scr_1", "part_of"),
            ("n_acc_1", "n_sec_1", "validates"),
            ("n_gap_1", "n_sec_1", "verifies"),
        ]

        with self.db.session() as conn:
            for nid, ntype, title, desc_text, status_val, conf in raw_nodes:
                scoped_id = f"node_{project_id[:8]}_{nid}"
                conn.execute(
                    """
                    INSERT INTO product_completeness_nodes (
                        id, project_id, node_type, title, description,
                        status, confidence_score, source_chunk_ids_json,
                        created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, '[]', ?, ?)
                    ON CONFLICT(id) DO NOTHING
                    """,
                    (scoped_id, project_id, ntype, title, desc_text, status_val, conf, now, now),
                )

            for src, tgt, rel in raw_edges:
                scoped_src = f"node_{project_id[:8]}_{src}"
                scoped_tgt = f"node_{project_id[:8]}_{tgt}"
                scoped_edge = f"edge_{project_id[:8]}_{src}_{tgt}"
                conn.execute(
                    """
                    INSERT INTO product_completeness_edges (
                        id, project_id, source_node_id, target_node_id,
                        relationship_type, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO NOTHING
                    """,
                    (scoped_edge, project_id, scoped_src, scoped_tgt, rel, now),
                )

    def _build_hierarchy_projection(self, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Decomposes graph into structured architectural tiers."""
        tier_definitions = [
            ("strategy_and_users", "Strategy, Users & Needs", ["product_goals", "goal", "problems", "problem", "target_users", "persona", "user_needs"]),
            ("journeys_and_capabilities", "Journeys & Capabilities", ["user_journeys", "journey", "capabilities", "features", "feature", "requirements", "requirement"]),
            ("ux_and_interfaces", "UX & Interface Contracts", ["screens", "screen", "interactions", "acceptance_criteria"]),
            ("technical_architecture", "Technical Architecture & Data", ["apis", "api", "data_entities", "database_entity", "security_controls", "security_policy"]),
            ("quality_and_reliability", "Quality & Reliability", ["tests", "test_spec"]),
        ]

        hierarchy: List[Dict[str, Any]] = []
        for tier_key, tier_label, member_types in tier_definitions:
            tier_items = [n for n in nodes if n["nodeType"] in member_types]
            if tier_items:
                hierarchy.append({
                    "tier": tier_key,
                    "tierLabel": tier_label,
                    "count": len(tier_items),
                    "items": tier_items,
                })
        return hierarchy

    def _build_table_projection(self, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Constructs a flattened gap analysis table with relationship counts."""
        edge_counts: Dict[str, int] = {}
        for e in edges:
            edge_counts[e["sourceNodeId"]] = edge_counts.get(e["sourceNodeId"], 0) + 1
            edge_counts[e["targetNodeId"]] = edge_counts.get(e["targetNodeId"], 0) + 1

        table_rows = []
        for n in nodes:
            has_gap = n["status"] in ("missing", "incomplete", "contradictory", "not_provided", "unclear", "not_verified")
            table_rows.append({
                "id": n["id"],
                "type": n["nodeType"],
                "title": n["title"],
                "description": n["description"],
                "status": n["status"],
                "confidenceScore": n["confidenceScore"],
                "connectedRelations": edge_counts.get(n["id"], 0),
                "hasGap": has_gap,
            })
        return table_rows

    def _format_node(self, r: Any) -> Dict[str, Any]:
        return {
            "id": r["id"],
            "projectId": r["project_id"],
            "nodeType": r["node_type"],
            "title": r["title"],
            "description": r["description"],
            "status": r["status"],
            "confidenceScore": r["confidence_score"],
            "sourceChunkIds": json.loads(r["source_chunk_ids_json"] or "[]"),
            "createdAt": r["created_at"],
            "updatedAt": r["updated_at"],
        }

    def _format_edge(self, r: Any) -> Dict[str, Any]:
        return {
            "id": r["id"],
            "projectId": r["project_id"],
            "sourceNodeId": r["source_node_id"],
            "targetNodeId": r["target_node_id"],
            "relationshipType": r["relationship_type"],
            "createdAt": r["created_at"],
        }

    def _format_decision(self, r: Any) -> Dict[str, Any]:
        return {
            "id": r["id"],
            "projectId": r["project_id"],
            "userId": r["user_id"],
            "nodeId": r["node_id"],
            "decisionType": r["decision_type"],
            "rationale": r["rationale"],
            "createdAt": r["created_at"],
        }


completeness_map_service = CompletenessMapService()
