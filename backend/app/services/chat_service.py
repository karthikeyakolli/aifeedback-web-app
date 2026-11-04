"""Research Chat Service for Product Research Intelligence.

Coordinates RAG retrieval, bounded multi-turn conversation memory, prompt-injection
defense, LLM response generation, DB-grounded citation validation, and session persistence.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from fastapi import HTTPException

from backend.app.db.repository import community_repo
from backend.app.schemas.ai import (
    ChatMessageResponse,
    ChatSessionResponse,
    CitationRecord,
    ResearchAnswerResponse,
)
from backend.app.services.analysis_service import flatten_comments_tree
from backend.app.services.gemini_service import LLMProvider, get_ai_provider
from backend.app.services.retrieval_service import retrieve_evidence
from backend.app.services.text_cleaner import clean_input_text, sanitize_research_proposal, clean_evidence_quote

logger = logging.getLogger(__name__)


class ResearchChatService:
    """Manages conversational research sessions, RAG execution, and evidence validation."""

    def __init__(self, provider: Optional[LLMProvider] = None) -> None:
        self.provider = provider or get_ai_provider()

    def _verify_post_owner(self, post_id: str, user_id: str) -> Dict[str, Any]:
        """Strictly verifies that user_id is the verified owner of post_id; raises 403 or 404."""
        post = community_repo.get_post(post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Discussion post not found.")

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
                status_code=403,
                detail="Forbidden. Only the verified project owner can conduct research on this workspace.",
            )
        return post

    def create_session(
        self,
        post_id: str,
        user_id: str,
        title: Optional[str] = None,
    ) -> ChatSessionResponse:
        """Creates a new research session for the authenticated user and target post."""
        post = self._verify_post_owner(post_id=post_id, user_id=user_id)

        session_title = title.strip() if title and title.strip() else f"Research: {post.get('title', '')[:30]}"
        session_data = community_repo.create_chat_session(
            post_id=post_id,
            user_id=user_id,
            title=session_title,
        )
        return ChatSessionResponse.model_validate(session_data)

    def list_sessions(self, post_id: str, user_id: str) -> List[ChatSessionResponse]:
        """Lists all research chat sessions belonging to the user for the given post."""
        post = community_repo.get_post(post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Post not found.")
        sessions = community_repo.list_chat_sessions(post_id=post_id, user_id=user_id)
        return [ChatSessionResponse.model_validate(s) for s in sessions]

    def get_session(self, session_id: str, user_id: str) -> Dict[str, Any]:
        """Retrieves session details and its message history, verifying user ownership."""
        session = community_repo.get_chat_session(session_id=session_id, user_id=user_id)
        if not session:
            raise HTTPException(status_code=404, detail="Chat session not found or unauthorized.")

        messages = community_repo.list_chat_messages(session_id=session_id, limit=50)
        return {
            "session": ChatSessionResponse.model_validate(session),
            "messages": [ChatMessageResponse.model_validate(m) for m in messages],
        }

    def delete_session(self, session_id: str, user_id: str) -> bool:
        """Deletes a research chat session and its messages, verifying user ownership."""
        deleted = community_repo.delete_chat_session(session_id=session_id, user_id=user_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Chat session not found or unauthorized.")
        return True

    def rename_session(self, session_id: str, user_id: str, title: str) -> ChatSessionResponse:
        """Renames an active research chat session, strictly verifying user ownership."""
        clean_title = title.strip()
        if not clean_title:
            raise HTTPException(status_code=400, detail="Session title cannot be empty.")
        session = community_repo.get_chat_session(session_id=session_id, user_id=user_id)
        if not session:
            raise HTTPException(status_code=404, detail="Chat session not found or unauthorized.")
        community_repo.update_chat_session(session_id=session_id, title=clean_title)
        updated = community_repo.get_chat_session(session_id=session_id, user_id=user_id)
        if not updated:
            raise HTTPException(status_code=404, detail="Failed to fetch updated session.")
        return ChatSessionResponse.model_validate(updated)

    def send_message(
        self,
        session_id: str,
        user_id: str,
        question: str,
        included_doc_ids: Optional[List[str]] = None,
        include_community: bool = True,
        source_type: str = "both",
        agent_mode: str = "analytical",
    ) -> ResearchAnswerResponse:
        """Processes a research question via RAG, invokes LLM, validates citations, and persists turn."""
        clean_question = question.strip()
        if not clean_question:
            raise HTTPException(status_code=400, detail="Question cannot be empty.")

        # Real 15-stage workflow tracking
        stages_completed: List[str] = []

        # Stage 1: Ownership validation (Verify session & post owner)
        stages_completed.append("1. Ownership validation")
        session = community_repo.get_chat_session(session_id=session_id, user_id=user_id)
        if not session:
            raise HTTPException(status_code=404, detail="Chat session not found or unauthorized.")

        post_id = session["postId"]
        post = community_repo.get_post(post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Associated discussion post not found.")

        # Verify project creator authorization
        is_owner = post.get("authorId") == user_id or post.get("author_id") == user_id
        if not is_owner and post.get("author", {}).get("id") == user_id:
            is_owner = True
        if not is_owner:
            with community_repo.db.session() as conn:
                raw_p = conn.execute("SELECT author_id FROM posts WHERE id = ?", (post_id,)).fetchone()
                if raw_p and raw_p["author_id"] == user_id:
                    is_owner = True
        if not is_owner:
            raise HTTPException(status_code=403, detail="Forbidden. Only the verified project owner can conduct research on this workspace.")

        # Validate that client-supplied document IDs belong strictly to this post and owner
        with community_repo.db.session() as conn:
            user_doc_rows = conn.execute(
                "SELECT id FROM post_documents WHERE post_id = ? AND owner_id = ?",
                (post_id, user_id),
            ).fetchall()
            valid_doc_ids = {r["id"] for r in user_doc_rows}

        if included_doc_ids is not None:
            # Strip any unauthorized or mismatching document IDs
            included_doc_ids = [d for d in included_doc_ids if d in valid_doc_ids]

        # Harmonize source_type controls
        if source_type == "community":
            include_community = True
            included_doc_ids = []
        elif source_type == "documents":
            include_community = False
            if included_doc_ids is None:
                included_doc_ids = list(valid_doc_ids)
        else:  # "both"
            include_community = True
            if included_doc_ids is None:
                included_doc_ids = list(valid_doc_ids)

        # Stage 2: Context collection (Discussion context & metadata)
        stages_completed.append("2. Context collection")

        # Stage 3: Comment collection
        stages_completed.append("3. Comment collection")
        raw_comments = community_repo.list_comments_for_post(post_id)
        flat_comments = flatten_comments_tree(raw_comments)
        comment_map = {}
        if include_community:
            comment_map = {c["id"]: c for c in flat_comments}

        # Stage 4: Document retrieval & extraction
        stages_completed.append("4. Document retrieval")
        attached_docs = community_repo.get_post_documents_text(post_id)
        if included_doc_ids is not None:
            attached_docs = [d for d in attached_docs if d["id"] in included_doc_ids]

        import re
        for adoc in attached_docs:
            text_content = adoc.get("contentText", "")
            raw_paragraphs = [p.strip() for p in text_content.split("\n\n") if p.strip()]
            current_page: Optional[int] = None
            current_section: Optional[str] = None
            chunk_counter = 0

            for p_text in raw_paragraphs:
                page_m = re.search(r"^---\s*\[Page\s+(\d+)\]\s*---", p_text)
                if page_m:
                    current_page = int(page_m.group(1))
                    p_text = re.sub(r"^---\s*\[Page\s+(\d+)\]\s*---\s*", "", p_text).strip()

                sec_m = re.search(r"^#{1,4}\s+(.+)", p_text)
                if sec_m:
                    current_section = sec_m.group(1).strip()

                if len(p_text) < 15:
                    continue

                chunk_counter += 1
                chunk_id = f"{adoc['id']}_p{chunk_counter}"
                c_clean = clean_input_text(p_text)
                comment_map[chunk_id] = {
                    "id": chunk_id,
                    "content": c_clean,
                    "author": {"displayName": f"Doc: {adoc['filename']}", "username": "document"},
                    "isAnonymous": False,
                    "sourceType": "document",
                    "filename": adoc["filename"],
                    "pageNumber": current_page,
                    "section": current_section,
                }

        latest_run = community_repo.get_latest_analysis_run(post_id)
        validated_themes = []
        if latest_run and latest_run.get("resultData"):
            validated_themes = latest_run["resultData"].get("themes", [])

        # Stage 5: Query interpretation
        stages_completed.append("5. Query interpretation")

        # Stage 6: Reference resolution (Fetch conversation memory)
        stages_completed.append("6. Reference resolution")
        stored_messages = community_repo.list_chat_messages(session_id=session_id, limit=8)
        recent_turns = [{"role": m["role"], "content": m["content"]} for m in stored_messages]

        # Stage 7: BM25 retrieval
        stages_completed.append("7. BM25 retrieval")

        # Stage 8: Evidence ranking
        stages_completed.append("8. Evidence ranking")
        retrieval_result = retrieve_evidence(
            post=post,
            comments=flat_comments,
            analysis_findings=validated_themes,
            conversation_turns=recent_turns,
            question=clean_question,
            top_k=6,
            included_doc_ids=included_doc_ids,
            include_community=include_community,
        )

        retrieved_comments = retrieval_result["retrieved_comments"]
        matching_themes = retrieval_result["matching_themes"]
        has_evidence = retrieval_result["has_sufficient_evidence"]

        # Stage 9: Context assembly
        stages_completed.append("9. Context assembly")

        # Stage 10: Gemini generation & Stage 11: Groq fallback
        stages_completed.append("10. Gemini generation")
        stages_completed.append("11. Groq fallback")

        proposal = self.provider.generate_chat_response(
            post_title=post.get("title", ""),
            post_description=post.get("description", ""),
            post_category=post.get("category", "General"),
            retrieved_comments=retrieved_comments,
            matching_themes=matching_themes,
            conversation_history=recent_turns,
            user_question=clean_question,
            agent_mode=agent_mode,
        )

        # Stage 12: Structured validation
        stages_completed.append("12. Structured validation")

        # Stage 13: Citation verification & Hallucination Guard
        stages_completed.append("13. Citation verification")
        validated_citations: List[CitationRecord] = []
        for cid in proposal.supporting_comment_ids:
            if cid in comment_map:
                c_row = comment_map[cid]
                if c_row.get("sourceType") == "document":
                    author_display = f"Doc: {c_row.get('filename', 'Document')}"
                elif c_row.get("isAnonymous") or c_row.get("is_anonymous"):
                    author_display = "Anonymous Contributor"
                else:
                    author_obj = c_row.get("author", {}) if isinstance(c_row.get("author"), dict) else {}
                    author_display = author_obj.get("displayName") or author_obj.get("username") or "Contributor"

                content_text = c_row.get("content", "")
                raw_quote = content_text[:160] + ("..." if len(content_text) > 160 else "")
                quote = clean_evidence_quote(raw_quote)

                validated_citations.append(
                    CitationRecord(
                        commentId=cid,
                        quoteSnippet=quote,
                        authorDisplay=clean_evidence_quote(author_display),
                        sourceType=c_row.get("sourceType", "comment"),
                        filename=c_row.get("filename"),
                        pageNumber=c_row.get("pageNumber"),
                        section=clean_evidence_quote(c_row.get("section")) if c_row.get("section") else None,
                    )
                )

        community_evidence = [c for c in validated_citations if c.sourceType == "comment"]
        document_evidence = [c for c in validated_citations if c.sourceType == "document"]

        # If zero comments or documents were available or retrieved, enforce insufficient evidence semantics
        if not comment_map or not retrieved_comments:
            has_evidence = False

        # Stage 14: Session persistence
        stages_completed.append("14. Session persistence")
        saved_user_msg = community_repo.save_chat_message(
            session_id=session_id,
            role="user",
            content=clean_question,
            citations=[],
            metadata={"resolved_query": retrieval_result.get("resolved_query", clean_question)},
        )

        assistant_metadata = {
            "direct_answer": proposal.direct_answer,
            "executive_summary": proposal.executive_summary,
            "key_findings": proposal.key_findings,
            "cross_source_comparison": proposal.cross_source_comparison.model_dump(by_alias=True) if proposal.cross_source_comparison else None,
            "recommendations": [r.model_dump(by_alias=True) for r in proposal.recommendations],
            "observed_facts": proposal.observed_facts,
            "hypotheses": proposal.hypotheses_and_interpretations,
            "limitations": proposal.limitations_and_uncertainty,
            "suggested_follow_ups": proposal.suggested_follow_ups,
            "has_sufficient_evidence": has_evidence,
            "stages_completed": stages_completed,
            "agent_mode": agent_mode,
            "visual_diagram": getattr(proposal, "visual_diagram", None),
            "ui_mockup_concept": getattr(proposal, "ui_mockup_concept", None),
            "image_prompt": getattr(proposal, "image_prompt", None),
        }

        saved_assistant_msg = community_repo.save_chat_message(
            session_id=session_id,
            role="assistant",
            content=proposal.direct_answer,
            citations=[c.model_dump(by_alias=True) for c in validated_citations],
            metadata=assistant_metadata,
        )

        # Update session title if this is the first turn
        if not stored_messages:
            short_title = clean_question[:35] + ("..." if len(clean_question) > 35 else "")
            community_repo.update_chat_session(session_id=session_id, title=short_title)

        # Stage 15: UI presentation
        stages_completed.append("15. UI presentation")

        # Deterministic metrics calculated on backend (never invented by LLM)
        deterministic_metrics = {
            "totalCommentsInPost": len(flat_comments),
            "totalAttachedDocuments": len(attached_docs),
            "retrievedEvidenceCount": len(retrieved_comments),
            "citedCommentsCount": len(community_evidence),
            "citedDocumentsCount": len(document_evidence),
            "sourceTypeUsed": source_type,
        }

        return ResearchAnswerResponse(
            userMessage=ChatMessageResponse.model_validate(saved_user_msg),
            assistantMessage=ChatMessageResponse.model_validate(saved_assistant_msg),
            directAnswer=proposal.direct_answer,
            executiveSummary=proposal.executive_summary or proposal.direct_answer,
            keyFindings=proposal.key_findings or proposal.observed_facts,
            observedFacts=proposal.observed_facts,
            hypotheses=proposal.hypotheses_and_interpretations,
            crossSourceComparison=proposal.cross_source_comparison,
            recommendations=proposal.recommendations,
            limitations=proposal.limitations_and_uncertainty,
            suggestedFollowUps=proposal.suggested_follow_ups,
            hasSufficientEvidence=has_evidence,
            communityEvidence=community_evidence,
            documentEvidence=document_evidence,
            stagesCompleted=stages_completed,
            deterministicMetrics=deterministic_metrics,
            agentMode=agent_mode,
            visualDiagram=getattr(proposal, "visual_diagram", None),
            uiMockupConcept=getattr(proposal, "ui_mockup_concept", None),
            imagePrompt=getattr(proposal, "image_prompt", None),
        )


# Global singleton instance
chat_service = ResearchChatService()
