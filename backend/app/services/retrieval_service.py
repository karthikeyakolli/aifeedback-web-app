"""Hybrid Discussion Retrieval Engine (RAG) for Product Research Intelligence.

Provides scoped, deterministic keyword and semantic retrieval across:
1. Active post details (title, description, category, tags).
2. Published eligible community comments and replies.
3. Most recent validated Phase 3 analysis findings (themes, disagreements, recommendations).

Supports conversational query resolution (e.g., resolving pronoun/follow-up references
from recent chat turns) while strictly bounding evidence to the target post.
"""

from __future__ import annotations

import math
import re
from collections import Counter
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Set, Tuple

from backend.app.services.text_cleaner import clean_input_text, clean_evidence_quote

# Common English stopwords for query token filtering
STOPWORDS: Set[str] = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are",
    "arent", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both",
    "but", "by", "cant", "cannot", "could", "couldnt", "did", "didnt", "do", "does", "doesnt",
    "doing", "dont", "down", "during", "each", "few", "for", "from", "further", "had", "hadnt",
    "has", "hasnt", "have", "havent", "having", "he", "hed", "hell", "hes", "her", "here",
    "heres", "hers", "herself", "him", "himself", "his", "how", "hows", "i", "id", "ill", "im",
    "ive", "if", "in", "into", "is", "isnt", "it", "its", "itself", "lets", "me", "more", "most",
    "mustnt", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or",
    "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shant", "she",
    "shed", "shell", "shes", "should", "shouldnt", "so", "some", "such", "than", "that", "thats",
    "the", "their", "theirs", "them", "themselves", "then", "there", "theres", "these", "they",
    "theyd", "theyll", "theyre", "theyve", "this", "those", "through", "to", "too", "under",
    "until", "up", "very", "was", "wasnt", "we", "wed", "well", "were", "weve", "werent", "what",
    "whats", "when", "whens", "where", "wheres", "which", "while", "who", "whos", "whom", "why",
    "whys", "with", "wont", "would", "wouldnt", "you", "youd", "youll", "youre", "youve", "your",
    "yours", "yourself", "yourselves", "tell", "show", "give", "explain", "mention", "think",
}


def tokenize_text(text: str) -> List[str]:
    """Extracts lowercase alphabetic and alphanumeric tokens."""
    return re.findall(r"\b[a-zA-Z0-9_-]{2,}\b", text.lower())


def extract_keywords(text: str) -> List[str]:
    """Tokenizes text and strips standard English stopwords."""
    tokens = tokenize_text(text)
    return [t for t in tokens if t not in STOPWORDS]


@dataclass
class RetrievedComment:
    """A scored community comment candidate or attached document chunk."""
    comment_id: str
    content: str
    author_display: str
    is_anonymous: bool
    score: float
    matched_terms: List[str]
    created_at: str
    source_type: str = "comment"
    filename: Optional[str] = None
    page_number: Optional[int] = None
    section: Optional[str] = None


@dataclass
class RetrievedThemeMatch:
    """A scored Phase 3 analysis theme match."""
    theme_id: str
    theme_name: str
    category: str
    summary: str
    supporting_comment_ids: List[str]
    score: float


@dataclass
class RetrievalResult:
    """Comprehensive scoped evidence bundle passed to the research assistant."""
    query: str
    expanded_query: str
    post_id: str
    post_title: str
    post_description: str
    post_category: str
    retrieved_comments: List[RetrievedComment]
    matching_themes: List[RetrievedThemeMatch]
    total_comments_in_thread: int
    has_sufficient_evidence: bool
    limitation_note: Optional[str] = None


class DiscussionRetrievalService:
    """Scoped hybrid retrieval engine tailored to community feedback research."""

    def __init__(self, min_score_threshold: float = 0.08) -> None:
        self.min_score_threshold = min_score_threshold

    def resolve_conversational_query(
        self,
        current_question: str,
        recent_messages: Optional[List[Dict[str, Any]]] = None,
    ) -> str:
        """Expands a follow-up query by resolving references from recent context.

        E.g. if previous assistant message discussed 'Google Calendar integration',
        and user asks 'Which of those are high severity?', query incorporates
        salient keywords from recent messages.
        """
        if not recent_messages:
            return current_question.strip()

        # Check if question contains anaphoric pronouns or follow-up markers
        follow_up_markers = {"those", "these", "that", "them", "second", "first", "third", "which", "why", "who"}
        q_tokens = set(tokenize_text(current_question))

        if not q_tokens.intersection(follow_up_markers):
            return current_question.strip()

        # Extract recent context terms from the last 2 turns
        context_words: List[str] = []
        for msg in recent_messages[-2:]:
            content = msg.get("content", "")
            # Grab top keywords
            kws = extract_keywords(content)
            context_words.extend(kws[:8])

        if context_words:
            # Combine current query with relevant context terms
            unique_context = list(dict.fromkeys(context_words))
            return f"{current_question.strip()} {' '.join(unique_context[:6])}"

        return current_question.strip()

    def _compute_bm25_score(
        self,
        query_terms: List[str],
        doc_tokens: List[str],
        avg_doc_len: float,
        idf_weights: Dict[str, float],
        k1: float = 1.2,
        b: float = 0.75,
    ) -> Tuple[float, List[str]]:
        """Computes BM25 relevance score for a document given query terms."""
        if not doc_tokens:
            return 0.0, []

        doc_len = len(doc_tokens)
        term_freqs = Counter(doc_tokens)
        score = 0.0
        matched = []

        for q in query_terms:
            if q in term_freqs:
                matched.append(q)
                tf = term_freqs[q]
                idf = idf_weights.get(q, 1.0)
                numerator = tf * (k1 + 1.0)
                denominator = tf + k1 * (1.0 - b + b * (doc_len / (avg_doc_len or 1.0)))
                score += idf * (numerator / denominator)

        # Bonus for exact phrase or bigram matches
        doc_text = " ".join(doc_tokens)
        for i in range(len(query_terms) - 1):
            bigram = f"{query_terms[i]} {query_terms[i+1]}"
            if bigram in doc_text:
                score += 1.5

        return score, matched

    def retrieve_evidence(
        self,
        post: Dict[str, Any],
        flat_comments: List[Dict[str, Any]],
        analysis_run: Optional[Dict[str, Any]],
        query: str,
        recent_messages: Optional[List[Dict[str, Any]]] = None,
        top_k: int = 6,
        included_doc_ids: Optional[List[str]] = None,
        include_community: bool = True,
    ) -> RetrievalResult:
        """Retrieves and ranks relevant comments and themes for a research query."""
        expanded_query = self.resolve_conversational_query(query, recent_messages)
        query_terms = extract_keywords(expanded_query)

        # Build corpus of eligible comments
        docs: List[Dict[str, Any]] = []
        if include_community:
            for c in flat_comments:
                if c.get("status") in ("moderated", "hidden", "flagged"):
                    continue
                text = clean_evidence_quote(c.get("content", ""))
                tokens = extract_keywords(text)
                docs.append({
                    "id": c["id"],
                    "content": text,
                    "tokens": tokens,
                    "raw_comment": c,
                    "source_type": "comment",
                    "filename": None,
                    "page_number": None,
                    "section": None,
                })

        # Also index creator-attached project documentation (PDFs, Markdown Specs, Architecture Docs)
        try:
            from backend.app.db.repository import community_repo
            attached_docs = community_repo.get_post_documents_text(post["id"])
            if included_doc_ids is not None:
                attached_docs = [d for d in attached_docs if d["id"] in included_doc_ids]

            for adoc in attached_docs:
                text_content = adoc.get("contentText", "")
                raw_paragraphs = [p.strip() for p in text_content.split("\n\n") if p.strip()]
                current_page: Optional[int] = None
                current_section: Optional[str] = None
                chunk_counter = 0

                for p_text in raw_paragraphs:
                    # Parse genuine PDF page marker if present
                    page_m = re.search(r"^---\s*\[Page\s+(\d+)\]\s*---", p_text)
                    if page_m:
                        current_page = int(page_m.group(1))
                        p_text = re.sub(r"^---\s*\[Page\s+(\d+)\]\s*---\s*", "", p_text).strip()

                    # Parse Markdown section heading if present
                    sec_m = re.search(r"^#{1,4}\s+(.+)", p_text)
                    if sec_m:
                        current_section = clean_evidence_quote(sec_m.group(1).strip())

                    c_clean = clean_evidence_quote(p_text)
                    if len(c_clean) < 15:
                        continue

                    chunk_counter += 1
                    chunk_id = f"{adoc['id']}_p{chunk_counter}"
                    docs.append({
                        "id": chunk_id,
                        "content": c_clean,
                        "tokens": extract_keywords(c_clean),
                        "raw_comment": {
                            "id": chunk_id,
                            "content": c_clean,
                            "author": {"displayName": f"Doc: {adoc['filename']}", "username": "document"},
                            "isAnonymous": False,
                            "createdAt": "",
                            "sourceType": "document",
                            "filename": adoc["filename"],
                            "pageNumber": current_page,
                            "section": current_section,
                        },
                        "source_type": "document",
                        "filename": adoc["filename"],
                        "page_number": current_page,
                        "section": current_section,
                    })
        except Exception:
            pass

        total_docs = len(docs)
        if total_docs == 0:
            return RetrievalResult(
                query=query,
                expanded_query=expanded_query,
                post_id=post["id"],
                post_title=post.get("title", ""),
                post_description=post.get("description", ""),
                post_category=post.get("category", "General"),
                retrieved_comments=[],
                matching_themes=[],
                total_comments_in_thread=0,
                has_sufficient_evidence=False,
                limitation_note="Discussion contains zero community comments. No evidence is available.",
            )

        # Calculate IDF weights across discussion comments
        avg_doc_len = sum(len(d["tokens"]) for d in docs) / max(1, total_docs)
        df: Counter = Counter()
        for d in docs:
            df.update(set(d["tokens"]))

        idf_weights: Dict[str, float] = {}
        for term, freq in df.items():
            # Standard smoothed BM25 IDF formula
            idf_weights[term] = math.log(1.0 + (total_docs - freq + 0.5) / (freq + 0.5))

        # Score all comments
        scored_comments: List[RetrievedComment] = []
        for d in docs:
            score, matched = self._compute_bm25_score(
                query_terms=query_terms,
                doc_tokens=d["tokens"],
                avg_doc_len=avg_doc_len,
                idf_weights=idf_weights,
            )

            raw = d["raw_comment"]
            # Author display with document attribution or anonymous privacy
            if raw.get("sourceType") == "document" or d.get("source_type") == "document":
                author_display = f"Doc: {d.get('filename', 'Project Document')}"
            elif raw.get("isAnonymous") or raw.get("is_anonymous"):
                author_display = "Anonymous Contributor"
            else:
                author_obj = raw.get("author", {})
                author_display = (
                    author_obj.get("displayName")
                    or author_obj.get("username")
                    or "Contributor"
                )

            scored_comments.append(
                RetrievedComment(
                    comment_id=d["id"],
                    content=d["content"],
                    author_display=author_display,
                    is_anonymous=bool(raw.get("isAnonymous") or raw.get("is_anonymous")),
                    score=round(score, 4),
                    matched_terms=matched,
                    created_at=raw.get("createdAt") or raw.get("created_at") or "",
                    source_type=d.get("source_type", "comment"),
                    filename=d.get("filename"),
                    page_number=d.get("page_number"),
                    section=d.get("section"),
                )
            )

        # Sort by score descending
        scored_comments.sort(key=lambda x: x.score, reverse=True)

        # Filter by threshold unless user query is asking for broad overview
        is_broad_overview = any(
            w in query.lower()
            for w in ("summary", "overview", "all", "what are", "common", "themes", "recap")
        )

        filtered_comments = [
            c for c in scored_comments if c.score >= self.min_score_threshold
        ]

        # If broad overview and no high-BM25 matches, include top comments as baseline context
        if not filtered_comments and is_broad_overview and scored_comments:
            filtered_comments = scored_comments[:top_k]

        selected_comments = filtered_comments[:top_k]

        # Score matching Phase 3 themes if an analysis run exists
        matching_themes: List[RetrievedThemeMatch] = []
        if analysis_run and "themes" in analysis_run:
            for t in analysis_run["themes"]:
                theme_name = t.get("themeName") or t.get("theme_name") or ""
                summary = t.get("summary") or ""
                category = t.get("category") or "general"
                theme_tokens = extract_keywords(f"{theme_name} {summary}")
                theme_score, _ = self._compute_bm25_score(
                    query_terms=query_terms,
                    doc_tokens=theme_tokens,
                    avg_doc_len=len(theme_tokens),
                    idf_weights=idf_weights,
                )

                if theme_score > 0.05 or is_broad_overview:
                    matching_themes.append(
                        RetrievedThemeMatch(
                            theme_id=t.get("id", ""),
                            theme_name=theme_name,
                            category=category,
                            summary=summary,
                            supporting_comment_ids=t.get("supportingCommentIds") or t.get("supporting_comment_ids") or [],
                            score=round(theme_score, 4),
                        )
                    )

            matching_themes.sort(key=lambda x: x.score, reverse=True)

        has_evidence = len(selected_comments) > 0 or len(matching_themes) > 0

        limitation_note = None
        if not has_evidence:
            limitation_note = (
                f"No comments in this discussion match the topic '{query}'. "
                f"The assistant must explicitly acknowledge that this specific topic "
                f"was not reported by community reviewers."
            )

        return RetrievalResult(
            query=query,
            expanded_query=expanded_query,
            post_id=post["id"],
            post_title=post.get("title", ""),
            post_description=post.get("description", ""),
            post_category=post.get("category", "General"),
            retrieved_comments=selected_comments,
            matching_themes=matching_themes[:4],
            total_comments_in_thread=total_docs,
            has_sufficient_evidence=has_evidence,
            limitation_note=limitation_note,
        )


# Global retrieval engine instance
retrieval_service = DiscussionRetrievalService()


def retrieve_evidence(
    post: Dict[str, Any],
    comments: List[Dict[str, Any]],
    analysis_findings: Optional[Any] = None,
    conversation_turns: Optional[List[Dict[str, Any]]] = None,
    question: str = "",
    top_k: int = 6,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Module-level convenience wrapper for DiscussionRetrievalService.retrieve_evidence."""
    query = question or kwargs.get("query", "")
    analysis_run = None
    if isinstance(analysis_findings, dict):
        analysis_run = analysis_findings
    elif isinstance(analysis_findings, list):
        analysis_run = {"themes": analysis_findings}

    recent_messages = conversation_turns or kwargs.get("recent_messages")

    res = retrieval_service.retrieve_evidence(
        post=post,
        flat_comments=comments,
        analysis_run=analysis_run,
        query=query,
        recent_messages=recent_messages,
        top_k=top_k,
        included_doc_ids=kwargs.get("included_doc_ids"),
        include_community=kwargs.get("include_community", True),
    )

    # Format comments as simple dictionaries for the LLM prompt, validation, and user display
    retrieved_dict_comments = [
        {
            "id": rc.comment_id,
            "content": clean_evidence_quote(rc.content),
            "snippet": clean_evidence_quote(rc.content[:160]) + ("..." if len(rc.content) > 160 else ""),
            "score": rc.score,
            "relevance_percentage": min(100, max(1, int(rc.score * 100))) if rc.score > 0 else 0,
            "author_display": clean_evidence_quote(rc.author_display),
            "clean_author": clean_evidence_quote(rc.author_display),
            "is_anonymous": rc.is_anonymous,
            "matched_terms": rc.matched_terms,
            "source_type": rc.source_type,
            "sourceType": rc.source_type,
            "filename": rc.filename,
            "page_number": rc.page_number,
            "pageNumber": rc.page_number,
            "section": clean_evidence_quote(rc.section) if rc.section else None,
        }
        for rc in res.retrieved_comments
    ]

    matching_theme_dicts = [
        {
            "theme_id": tm.theme_id,
            "theme_name": tm.theme_name,
            "themeName": tm.theme_name,
            "category": tm.category,
            "summary": tm.summary,
            "supporting_comment_ids": tm.supporting_comment_ids,
            "score": tm.score,
        }
        for tm in res.matching_themes
    ]

    return {
        "query": res.query,
        "resolved_query": res.expanded_query,
        "expanded_query": res.expanded_query,
        "post_id": res.post_id,
        "retrieved_comments": retrieved_dict_comments,
        "matching_themes": matching_theme_dicts,
        "total_comments": res.total_comments_in_thread,
        "has_sufficient_evidence": res.has_sufficient_evidence,
        "limitation_note": res.limitation_note,
        "raw_result": res,
    }

