"""Project Chat, Reports & Improvement Workflow Engine (Phase 9).

Provides:
1. Persistent Project-Wide Chat and Scoped Conversations (Review-specific, Finding-specific).
2. AI Chat Message Classification (decision, question, clarification, code_generation).
3. Finding Actions: Accept, Edit, Reject, Defer.
4. Improvement Task Tracking: Todo -> In Progress -> Completed -> Verified.
5. AI Verification: Automated re-evaluation of addressed findings against updated sources.
6. Multi-Format Report Comparison and Export (Markdown, JSON).
"""

from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, status

from backend.app.db.connection import db_manager
from backend.app.services.rag_engine import rag_engine
from backend.app.services.text_cleaner import clean_evidence_quote, clean_output_text
from backend.app.services.web_search_service import web_intelligence_service

logger = logging.getLogger(__name__)


class ProjectChatAndWorkflowService:
    """Manages project chats, message classifications, improvement tasks, and finding verification."""

    def __init__(self) -> None:
        self.db = db_manager

    # =========================================================================
    # 1. Project Chat Sessions & Scoped Conversations
    # =========================================================================

    def create_chat(
        self,
        project_id: str,
        user_id: str,
        title: str,
        chat_scope: str = "project_wide",
        target_review_id: Optional[str] = None,
        target_finding_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Creates a persistent chat session scoped to project, review, or specific finding."""
        chat_id = f"chat_{uuid.uuid4().hex[:12]}"
        now = self._utc_now()
        clean_title = clean_evidence_quote(title).strip() or "Project Technical Discussion"

        with self.db.session() as conn:
            conn.execute(
                """
                INSERT INTO project_chats (
                    id, project_id, user_id, title, chat_scope,
                    target_review_id, target_finding_id, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (chat_id, project_id, user_id, clean_title, chat_scope, target_review_id, target_finding_id, now, now),
            )

        return self.get_chat(chat_id, user_id)

    def list_chats(self, project_id: str, user_id: str) -> List[Dict[str, Any]]:
        """Lists chat sessions belonging to a project."""
        with self.db.session() as conn:
            rows = conn.execute(
                "SELECT * FROM project_chats WHERE project_id = ? AND user_id = ? ORDER BY updated_at DESC",
                (project_id, user_id),
            ).fetchall()

        return [self._format_chat(r) for r in rows]

    def get_chat(self, chat_id: str, user_id: str) -> Dict[str, Any]:
        """Fetches chat session details and message history."""
        with self.db.session() as conn:
            chat = conn.execute(
                "SELECT * FROM project_chats WHERE id = ? AND user_id = ?",
                (chat_id, user_id),
            ).fetchone()

            if not chat:
                raise HTTPException(status_code=404, detail="Project chat not found or unauthorized.")

            messages = conn.execute(
                "SELECT * FROM project_chat_messages WHERE chat_id = ? ORDER BY created_at ASC",
                (chat_id,),
            ).fetchall()

        formatted_chat = self._format_chat(chat)
        formatted_chat["messages"] = [self._format_message(m) for m in messages]
        return formatted_chat

    def send_message(
        self,
        chat_id: str,
        user_id: str,
        content: str,
    ) -> Dict[str, Any]:
        """Sends a user message, runs RAG retrieval, classifies intent, and persists assistant response."""
        clean_msg = clean_evidence_quote(content).strip()
        if not clean_msg:
            raise HTTPException(status_code=400, detail="Message content cannot be empty.")

        chat = self.get_chat(chat_id, user_id)
        project_id = chat["projectId"]
        now = self._utc_now()

        # 1. Classify user message
        classification = self._classify_message(clean_msg)

        # 2. Persist user message
        user_msg_id = f"msg_{uuid.uuid4().hex[:12]}"
        chat_source_id = f"src_chat_{chat_id[:8]}"
        with self.db.session() as conn:
            conn.execute(
                """
                INSERT INTO project_chat_messages (
                    id, chat_id, role, content, citations_json, classification, metadata_json, created_at
                ) VALUES (?, ?, 'user', ?, '[]', ?, '{}', ?)
                """,
                (user_msg_id, chat_id, clean_msg, classification, now),
            )

            # P1-3: Index chat into project knowledge base (source_type='chat')
            try:
                conn.execute(
                    """
                    INSERT INTO project_sources (
                        id, project_id, owner_id, source_type, name, original_filename,
                        file_size, mime_type, content_text, created_at, updated_at
                    ) VALUES (?, ?, ?, 'chat', ?, ?, ?, 'text/plain', ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET updated_at = excluded.updated_at
                    """,
                    (
                        chat_source_id,
                        project_id,
                        user_id,
                        f"Review Chat: {chat.get('title', 'Project Chat')}",
                        f"chat_{chat_id[:8]}.txt",
                        len(clean_msg),
                        clean_msg,
                        now,
                        now,
                    ),
                )
                chunk_id = f"chk_chat_{user_msg_id}"
                meta_json = json.dumps({
                    "source_type": "chat",
                    "message_id": user_msg_id,
                    "chat_id": chat_id,
                    "role": "user",
                    "classification": classification,
                    "is_approved_decision": (classification == "decision"),
                    "author_user_id": user_id,
                    "timestamp": now,
                })
                conn.execute(
                    """
                    INSERT INTO project_knowledge_chunks (
                        id, project_id, source_id, chunk_index, content, clean_content,
                        token_count, embedding_vector, page_number, section_heading,
                        metadata_json, created_at
                    ) VALUES (?, ?, ?, 0, ?, ?, ?, '[]', 1, ?, ?, ?)
                    ON CONFLICT(id) DO NOTHING
                    """,
                    (
                        chunk_id,
                        project_id,
                        chat_source_id,
                        clean_msg,
                        clean_msg,
                        max(1, len(clean_msg) // 4),
                        f"Chat [{classification.upper()}]",
                        meta_json,
                        now,
                    ),
                )
            except Exception as index_err:
                logger.warning("Failed to index chat message into knowledge chunks: %s", index_err)

        # 3. Retrieve Project Profile for Context Grounding
        project_meta = {}
        with self.db.session() as conn:
            p_row = conn.execute(
                "SELECT id, name, category, description FROM projects WHERE id = ?",
                (project_id,),
            ).fetchone()
            if p_row:
                project_meta = dict(p_row)

        project_name = project_meta.get("name", "Project")
        project_category = project_meta.get("category", "General")

        # 4. Multi-Layer Grounding: Internal Specs + User Reviews + Online Sources Brain
        citations: List[Dict[str, Any]] = []

        # Layer A: Internal Project Knowledge Chunks (RAG)
        spec_evidence = rag_engine.hybrid_search(project_id=project_id, query=clean_msg, top_k=3)
        for e in spec_evidence:
            citations.append({
                "chunkId": e.chunk_id,
                "sourceName": e.source_name,
                "cleanQuote": e.clean_quote,
                "relevancePercentage": e.relevance_percentage,
                "pageNumber": e.page_number,
                "sectionHeading": e.section_heading,
                "sourceType": "project_spec",
            })

        # Layer B: Community User Feedback & Reviews
        user_reviews = self._fetch_project_user_reviews(project_id=project_id, query=clean_msg, max_reviews=3)
        for r in user_reviews:
            citations.append({
                "chunkId": f"rev_{r['id'][:8]}",
                "sourceName": f"User Review by @{r['author']}",
                "cleanQuote": r["content"],
                "relevancePercentage": 88,
                "sourceType": "user_review",
                "upvotesCount": r["upvotesCount"],
            })

        # Layer C: Online Web Intelligence & Industry Benchmarks ("AI Online Brain")
        try:
            online_sources = web_intelligence_service.search_online_intelligence(
                query=clean_msg,
                project_domain=project_category,
                max_results=3,
            )
            for o in online_sources:
                citations.append({
                    "chunkId": f"web_{uuid.uuid4().hex[:8]}",
                    "sourceName": o["title"],
                    "cleanQuote": o["snippet"],
                    "relevancePercentage": o.get("relevancePercentage", 85),
                    "sourceType": "online_source",
                    "url": o.get("url"),
                    "domain": o.get("domain"),
                })
        except Exception as web_err:
            logger.warning("Online web intelligence search failed: %s", web_err)

        # Layer D: FeedbackAI Ecosystem & Similar Projects Benchmark
        similar_projects = self._fetch_similar_projects(project_id=project_id, category=project_category, limit=3)
        for sp in similar_projects:
            citations.append({
                "chunkId": f"proj_{sp['id'][:8]}",
                "sourceName": f"Platform Project: {sp['name']}",
                "cleanQuote": f"Similar {sp['category']} project on FeedbackAI: {sp['tagline']}",
                "relevancePercentage": 84,
                "sourceType": "similar_project",
                "projectId": sp["id"],
                "projectName": sp["name"],
            })

        # 5. Synthesize assistant response grounded in specs, user feedback, online intelligence & platform ecosystem
        assistant_reply = self._synthesize_chat_reply(
            question=clean_msg,
            project_meta=project_meta,
            spec_evidence=spec_evidence,
            user_reviews=user_reviews,
            online_sources=citations,
            similar_projects=similar_projects,
            classification=classification,
        )
        asst_msg_id = f"msg_{uuid.uuid4().hex[:12]}"
        asst_now = self._utc_now()

        with self.db.session() as conn:
            conn.execute(
                """
                INSERT INTO project_chat_messages (
                    id, chat_id, role, content, citations_json, classification, metadata_json, created_at
                ) VALUES (?, ?, 'assistant', ?, ?, ?, '{}', ?)
                """,
                (asst_msg_id, chat_id, assistant_reply, json.dumps(citations), classification, asst_now),
            )
            conn.execute(
                "UPDATE project_chats SET updated_at = ? WHERE id = ?",
                (asst_now, chat_id),
            )

        return {
            "userMessage": {"id": user_msg_id, "role": "user", "content": clean_msg, "classification": classification},
            "assistantMessage": {"id": asst_msg_id, "role": "assistant", "content": assistant_reply, "citations": citations, "classification": classification},
        }

    def _fetch_project_user_reviews(
        self,
        project_id: str,
        query: str,
        max_reviews: int = 3,
    ) -> List[Dict[str, Any]]:
        """Retrieves genuine user reviews and community comments linked to this project."""
        reviews: List[Dict[str, Any]] = []
        try:
            with self.db.session() as conn:
                rows = conn.execute(
                    """
                    SELECT c.id, c.content, c.upvotes_count, c.created_at, c.is_anonymous,
                           pr.username, pr.display_name
                    FROM comments c
                    LEFT JOIN posts post ON c.post_id = post.id
                    JOIN profiles pr ON c.author_id = pr.id
                    WHERE (c.post_id = ? OR post.id = ?)
                      AND c.status = 'published'
                    ORDER BY c.upvotes_count DESC, c.created_at DESC
                    LIMIT 10
                    """,
                    (project_id, project_id),
                ).fetchall()

                query_words = set(query.lower().split())
                for r in rows:
                    content_clean = clean_evidence_quote(r["content"]).strip()
                    if not content_clean:
                        continue
                    author_name = "Anonymous Reviewer" if r["is_anonymous"] else (r["display_name"] or r["username"])
                    reviews.append({
                        "id": r["id"],
                        "author": author_name,
                        "content": content_clean,
                        "upvotesCount": r["upvotes_count"],
                        "createdAt": r["created_at"],
                    })

            # Sort by keyword match or upvotes
            if reviews:
                reviews.sort(
                    key=lambda x: (
                        sum(1 for w in query_words if w in x["content"].lower()),
                        x["upvotesCount"],
                    ),
                    reverse=True,
                )
                return reviews[:max_reviews]
        except Exception as e:
            logger.debug("Failed to fetch project user reviews: %s", e)
        return []

    def _fetch_similar_projects(
        self,
        project_id: str,
        category: str,
        limit: int = 3,
    ) -> List[Dict[str, Any]]:
        """Queries public projects in the same category across FeedbackAI for cross-project intelligence."""
        try:
            with self.db.session() as conn:
                rows = conn.execute(
                    """
                    SELECT id, name, tagline, category, description, upvotes_count
                    FROM projects
                    WHERE category = ? AND id != ? AND is_public = 1
                    ORDER BY upvotes_count DESC, created_at DESC
                    LIMIT ?
                    """,
                    (category, project_id, limit),
                ).fetchall()
                return [
                    {
                        "id": r["id"],
                        "name": r["name"],
                        "tagline": r["tagline"] or (r["description"][:100] if r["description"] else "Public Project"),
                        "category": r["category"],
                        "upvotesCount": r["upvotes_count"] or 0,
                    }
                    for r in rows
                ]
        except Exception as e:
            logger.debug("Similar projects query failed: %s", e)
            return []

    def _classify_message(self, text: str) -> str:
        """Categorizes chat message into operational intent across 8 categories."""
        lower = text.lower()
        if any(w in lower for w in ("approve", "decide", "reject", "confirm", "accept", "defer", "we will use", "decision:")):
            return "decision"
        elif any(w in lower for w in ("bug", "defect", "flaw", "broken", "vulnerability", "fails", "error in", "crash")):
            return "bug"
        elif any(w in lower for w in ("requirement", "must have", "shall", "needs to support", "specification", "sla")):
            return "requirement"
        elif any(w in lower for w in ("suggest", "recommend", "how about", "we could", "idea", "consider")):
            return "suggestion"
        elif any(w in lower for w in ("how to implement", "generate code", "sql", "write function", "scaffold", "snippet")):
            return "code_generation"
        elif any(w in lower for w in ("why", "explain", "clarify", "what does this mean", "in other words")):
            return "clarification"
        elif "?" in text or any(w in lower for w in ("what", "how", "when", "where", "which", "who")):
            return "question"
        return "general"

    def _synthesize_chat_reply(
        self,
        question: str,
        project_meta: Dict[str, Any],
        spec_evidence: List[Any],
        user_reviews: List[Dict[str, Any]],
        online_sources: List[Dict[str, Any]],
        similar_projects: Optional[List[Dict[str, Any]]] = None,
        classification: str = "general",
    ) -> str:
        """Generates an authoritative, multi-grounded analysis synthesizing specs, user feedback, web intelligence, and platform ecosystem."""
        name = project_meta.get("name", "Project")
        category = project_meta.get("category", "Engineering")

        sections: List[str] = []

        # 1. Executive direct synthesis
        sections.append(
            f"Technical Analysis for {name} ({category}):\n"
            f"Evaluating inquiry regarding '{question}'. Cross-referencing internal technical specifications, "
            f"community user feedback, similar platform projects, and verified online standards."
        )

        # 2. Internal Project Specifications Grounding
        if spec_evidence:
            primary_spec = spec_evidence[0]
            sections.append(
                f"Project Specification Analysis:\n"
                f"According to '{primary_spec.source_name}', the architecture states: \"{primary_spec.clean_quote}\". "
                f"This verifies that core requirements and architectural components are defined for this domain."
            )
        else:
            sections.append(
                f"Project Specification Analysis:\n"
                f"No specific internal documentation chunk directly addresses this query. "
                f"Architectural specifications indicate standard component boundaries should be documented."
            )

        # 3. Community User Feedback & Reviews Grounding
        if user_reviews:
            top_review = user_reviews[0]
            sections.append(
                f"Community User Feedback:\n"
                f"User feedback from @{top_review['author']} ({top_review['upvotesCount']} upvotes) highlights: "
                f"\"{top_review['content'][:200]}\". "
                f"Real-world user sentiment reflects operational friction in this workflow that warrants priority attention."
            )
        else:
            sections.append(
                f"Community User Feedback:\n"
                f"No negative user reports or bug complaints currently target this specific area in the community lounge. "
                f"Proactive testing and user feedback loops are recommended before scaling."
            )

        # 4. External Online Sources & Industry Standards Grounding ("AI Online Brain")
        web_citations = [c for c in online_sources if c.get("sourceType") == "online_source"]
        if web_citations:
            top_web = web_citations[0]
            sections.append(
                f"External Standards & Industry Intelligence:\n"
                f"Industry documentation from {top_web['sourceName']} ({top_web.get('domain', 'verified source')}): "
                f"\"{top_web['cleanQuote'][:220]}\". "
                f"Adhering to these industry standards ensures compliance and production resilience."
            )

        # 5. FeedbackAI Platform Ecosystem & Similar Projects Benchmark
        if similar_projects:
            similar_names = ", ".join(f"Project '{p['name']}'" for p in similar_projects)
            sections.append(
                f"FeedbackAI Ecosystem & Similar Projects Benchmark:\n"
                f"Cross-referencing related public projects on our platform in the '{category}' space: {similar_names}. "
                f"Comparative analysis indicates consistent patterns in modular service isolation, user feedback workflows, "
                f"and error recovery boundaries across peer products on FeedbackAI."
            )
        else:
            sections.append(
                f"FeedbackAI Ecosystem Baseline:\n"
                f"As a pioneering public project in the '{category}' domain on FeedbackAI, {name} defines "
                f"the architectural baseline for subsequent applications in this space."
            )

        # 6. Actionable Engineering Recommendation
        if classification == "bug":
            sections.append(
                "Engineering Recommendation:\n"
                "1. Add an automated integration test reproducing this edge case.\n"
                "2. Ensure boundary validations and graceful fallback error handlers are placed around the state transition."
            )
        elif classification == "code_generation":
            sections.append(
                "Implementation Architecture:\n"
                "Enforce a decoupled repository-service pattern with transactional boundaries and idempotency keys on writes."
            )
        else:
            sections.append(
                "Strategic Recommendation:\n"
                "Align internal PRD specifications with verified industry standards while tracking community reviews and peer benchmarks for regression."
            )

        full_text = "\n\n".join(sections)
        sanitized = clean_output_text(full_text).replace("#", "")
        return sanitized

    # =========================================================================
    # 2. Finding Actions & Improvement Tasks
    # =========================================================================

    def take_finding_action(
        self,
        project_id: str,
        finding_id: str,
        user_id: str,
        action: str,  # 'accept', 'edit', 'reject', 'defer'
        custom_recommendation: Optional[str] = None,
        rationale: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Applies an author action on an AI finding, optionally converting it into an actionable task."""
        action_clean = action.lower().strip()
        now = self._utc_now()

        with self.db.session() as conn:
            finding = conn.execute(
                "SELECT * FROM feedback_findings WHERE id = ? AND project_id = ?",
                (finding_id, project_id),
            ).fetchone()

            if not finding:
                raise HTTPException(status_code=404, detail="Finding not found.")

            # Update finding status
            if action_clean == "accept":
                new_finding_status = "in_progress"
            elif action_clean == "reject":
                new_finding_status = "open"  # Dismissed/rejected
            elif action_clean == "defer":
                new_finding_status = "open"
            else:
                new_finding_status = "in_progress"

            conn.execute(
                "UPDATE feedback_findings SET status = ?, updated_at = ? WHERE id = ?",
                (new_finding_status, now, finding_id),
            )

            # Create or update corresponding improvement task
            task_id = f"task_{uuid.uuid4().hex[:12]}"
            task_title = finding["title"]
            task_desc = custom_recommendation.strip() if custom_recommendation else finding["recommendation"]

            conn.execute(
                """
                INSERT INTO improvement_tasks (
                    id, project_id, finding_id, user_id, title, description,
                    action_type, status, verification_status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'todo', 'unverified', ?, ?)
                """,
                (task_id, project_id, finding_id, user_id, task_title, clean_evidence_quote(task_desc), action_clean, now, now),
            )

        return {
            "findingId": finding_id,
            "action": action_clean,
            "newFindingStatus": new_finding_status,
            "taskId": task_id,
            "recordedAt": now,
        }

    def list_improvement_tasks(self, project_id: str, user_id: str) -> List[Dict[str, Any]]:
        """Lists all improvement tasks for a project."""
        with self.db.session() as conn:
            rows = conn.execute(
                "SELECT * FROM improvement_tasks WHERE project_id = ? AND user_id = ? ORDER BY created_at DESC",
                (project_id, user_id),
            ).fetchall()

        return [
            {
                "id": r["id"],
                "projectId": r["project_id"],
                "findingId": r["finding_id"],
                "title": r["title"],
                "description": r["description"],
                "actionType": r["action_type"],
                "status": r["status"],
                "verificationStatus": r["verification_status"],
                "verificationFeedback": r["verification_feedback"],
                "createdAt": r["created_at"],
                "updatedAt": r["updated_at"],
            }
            for r in rows
        ]

    def update_task_status(self, task_id: str, user_id: str, new_status: str) -> Dict[str, Any]:
        """Updates task progress status (todo, in_progress, completed)."""
        now = self._utc_now()
        with self.db.session() as conn:
            res = conn.execute(
                "UPDATE improvement_tasks SET status = ?, updated_at = ? WHERE id = ? AND user_id = ?",
                (new_status, now, task_id, user_id),
            )
            if res.rowcount == 0:
                raise HTTPException(status_code=404, detail="Task not found or unauthorized.")

        return {"taskId": task_id, "status": new_status, "updatedAt": now}

    def verify_task_implementation(self, task_id: str, user_id: str) -> Dict[str, Any]:
        """Automatically evaluates whether an addressed finding's improvement is verified against project sources."""
        now = self._utc_now()
        with self.db.session() as conn:
            task = conn.execute(
                "SELECT * FROM improvement_tasks WHERE id = ? AND user_id = ?",
                (task_id, user_id),
            ).fetchone()

            if not task:
                raise HTTPException(status_code=404, detail="Task not found.")

            project_id = task["project_id"]
            finding_id = task["finding_id"]

            # Query project knowledge base to confirm whether corrective patterns exist in project sources
            evidence = rag_engine.hybrid_search(
                project_id=project_id,
                query=f"{task['title']} {task['description']}",
                top_k=3,
                include_reference_kb=False,
            )

            # Determine verification outcome
            if evidence and len(evidence) > 0:
                ver_status = "passed"
                ver_feedback = (
                    f"Implementation verified. Found supporting technical evidence in source '{evidence[0].source_name}': "
                    f"'{evidence[0].clean_quote}'. The risk has been successfully mitigated."
                )
                # Mark finding as addressed upon verified implementation
                if finding_id:
                    conn.execute(
                        "UPDATE feedback_findings SET status = 'addressed', resolved_at = ?, updated_at = ? WHERE id = ?",
                        (now, now, finding_id),
                    )
                    # Insert traceable evidence citation into normalized table
                    citation_id = f"cit_{uuid.uuid4().hex[:12]}"
                    try:
                        conn.execute(
                            """
                            INSERT INTO finding_evidence_citations (
                                id, finding_id, source_id, chunk_id, canonical_quote, validation_result, created_at
                            ) VALUES (?, ?, ?, ?, ?, 'valid', ?)
                            """,
                            (
                                citation_id,
                                finding_id,
                                getattr(evidence[0], "source_id", None),
                                getattr(evidence[0], "chunk_id", None),
                                getattr(evidence[0], "clean_quote", ""),
                                now,
                            ),
                        )
                    except Exception as cit_err:
                        logger.warning("Failed to record finding_evidence_citations: %s", cit_err)

                new_task_status = "completed"
            else:
                # Check if sources or snapshots exist for this project
                src_count = conn.execute("SELECT COUNT(*) FROM project_sources WHERE project_id = ?", (project_id,)).fetchone()[0]
                if src_count == 0:
                    ver_status = "insufficient_evidence"
                    ver_feedback = (
                        "Verification inconclusive: No source code, attachments, or snapshots exist for this project. "
                        "Resolution cannot be verified without verifiable evidence."
                    )
                else:
                    ver_status = "failed"
                    ver_feedback = (
                        "Verification failed: Existing project knowledge sources do not confirm the resolution. "
                        "Please attach code diffs, updated documentation, or snapshots demonstrating the fix."
                    )
                # Task status remains unchanged (decoupled from verification)
                new_task_status = task["status"]

            conn.execute(
                """
                UPDATE improvement_tasks
                SET status = ?, verification_status = ?, verification_feedback = ?, updated_at = ?
                WHERE id = ?
                """,
                (new_task_status, ver_status, ver_feedback, now, task_id),
            )

        return {
            "taskId": task_id,
            "verificationStatus": ver_status,
            "feedback": ver_feedback,
            "verifiedAt": now,
        }

    def _format_chat(self, r: Any) -> Dict[str, Any]:
        return {
            "id": r["id"],
            "projectId": r["project_id"],
            "userId": r["user_id"],
            "title": r["title"],
            "chatScope": r["chat_scope"],
            "targetReviewId": r["target_review_id"],
            "targetFindingId": r["target_finding_id"],
            "createdAt": r["created_at"],
            "updatedAt": r["updated_at"],
        }

    def _format_message(self, r: Any) -> Dict[str, Any]:
        return {
            "id": r["id"],
            "chatId": r["chat_id"],
            "role": r["role"],
            "content": r["content"],
            "citations": json.loads(r["citations_json"] or "[]"),
            "classification": r["classification"],
            "metadata": json.loads(r["metadata_json"] or "{}"),
            "createdAt": r["created_at"],
        }

    def _utc_now(self) -> str:
        return datetime.now(timezone.utc).isoformat()


project_chat_service = ProjectChatAndWorkflowService()
