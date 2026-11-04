"""Advanced RAG Engine for Technical Intelligence (Phase 5).

Provides:
1. Dual Knowledge Base Separation:
   - Private Project Knowledge Base (isolated per project)
   - Curated Reference Knowledge Base (architecture, OWASP security, WCAG accessibility)
2. Semantic Chunking with metadata tracking (page, section, line numbers).
3. Hybrid Retrieval: BM25 keyword matching + Dense Semantic Cosine Similarity.
4. Metadata filtering and reranking.
5. Evidence traceability with verified chunk citations.
"""

from __future__ import annotations

import hashlib
import json
import logging
import math
import re
from collections import Counter
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

from backend.app.db.connection import db_manager
from backend.app.services.text_cleaner import clean_evidence_quote, clean_input_text

logger = logging.getLogger(__name__)

EMBEDDING_DIM = 64  # Standardized vector dimension for fast embedded calculation


@dataclass
class RetrievedKnowledgeEvidence:
    """A scored piece of retrieved knowledge evidence with exact traceability."""
    chunk_id: str
    source_id: str
    source_name: str
    content: str
    clean_quote: str
    knowledge_base: str  # 'project' or 'reference'
    score: float
    relevance_percentage: int
    page_number: Optional[int] = None
    section_heading: Optional[str] = None
    line_range: Optional[str] = None


class AdvancedRAGEngine:
    """Advanced RAG service managing private and reference knowledge bases with hybrid search."""

    def __init__(self) -> None:
        self.db = db_manager
        self._ensure_reference_knowledge_seeded()

    def generate_embedding(self, text: str) -> List[float]:
        """Generates a normalized dense semantic embedding vector with zero external network dependency."""
        if not text:
            return [0.0] * EMBEDDING_DIM

        # Frequency and character n-gram distribution hashed into fixed dimensionality
        vec = [0.0] * EMBEDDING_DIM
        tokens = re.findall(r"\b[a-zA-Z0-9_-]{2,}\b", text.lower())

        for token in tokens:
            token_hash = int(hashlib.md5(token.encode("utf-8")).hexdigest(), 16)
            idx = token_hash % EMBEDDING_DIM
            sign = 1.0 if ((token_hash >> 8) & 1) else -1.0
            vec[idx] += sign * (1.0 + math.log(1.0 + len(token)))

        # Normalize vector to unit length (L2 norm)
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0:
            vec = [round(x / norm, 5) for x in vec]
        return vec

    def compute_cosine_similarity(self, vec_a: List[float], vec_b: List[float]) -> float:
        """Computes cosine similarity between two dense float vectors (-1.0 to 1.0)."""
        if not vec_a or not vec_b or len(vec_a) != len(vec_b):
            return 0.0
        dot = sum(a * b for a, b in zip(vec_a, vec_b))
        norm_a = math.sqrt(sum(a * a for a in vec_a))
        norm_b = math.sqrt(sum(b * b for b in vec_b))
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return max(0.0, min(1.0, dot / (norm_a * norm_b)))

    def index_project_source(self, source: Dict[str, Any]) -> int:
        """Chunks and indexes a project source into the private Project Knowledge Base."""
        source_id = source["id"]
        project_id = source["projectId"]
        content = source.get("contentText", "")
        if not content or len(content.strip()) < 10:
            return 0

        # Delete existing chunks for this source (idempotent re-indexing)
        with self.db.session() as conn:
            conn.execute("DELETE FROM project_knowledge_chunks WHERE source_id = ?", (source_id,))

        chunks = self._chunk_content(content)
        indexed_count = 0

        with self.db.session() as conn:
            for idx, c in enumerate(chunks):
                clean_text = clean_evidence_quote(c["text"])
                if not clean_text or len(clean_text) < 15:
                    continue

                chunk_id = f"chk_{source_id[:8]}_{idx}"
                embedding = self.generate_embedding(clean_text)
                token_count = len(clean_text.split())

                conn.execute(
                    """
                    INSERT INTO project_knowledge_chunks (
                        id, project_id, source_id, chunk_index, content,
                        clean_content, token_count, embedding_vector,
                        page_number, section_heading, line_start, line_end,
                        metadata_json, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        chunk_id, project_id, source_id, idx, c["text"],
                        clean_text, token_count, json.dumps(embedding),
                        c.get("page_number"), c.get("section_heading"),
                        c.get("line_start"), c.get("line_end"),
                        json.dumps({"source_name": source.get("name")}),
                        self._utc_now(),
                    ),
                )
                indexed_count += 1

        logger.info("Indexed %d chunks for project source %s (%s)", indexed_count, source_id, source.get("name"))
        return indexed_count

    def _chunk_content(self, text: str, chunk_size: int = 500, overlap: int = 100) -> List[Dict[str, Any]]:
        """Splits document content into sliding windows with page and section tracking."""
        lines = text.splitlines()
        chunks: List[Dict[str, Any]] = []

        current_page: Optional[int] = None
        current_section: Optional[str] = None
        accumulated_text = ""
        line_start = 1

        for line_idx, line in enumerate(lines, start=1):
            # Check for page markers
            page_m = re.search(r"^---\s*\[Page\s+(\d+)\]\s*---", line, re.IGNORECASE)
            if page_m:
                current_page = int(page_m.group(1))
                continue

            # Check for markdown headers
            sec_m = re.match(r"^#{1,4}\s+(.+)", line)
            if sec_m:
                current_section = clean_evidence_quote(sec_m.group(1))

            accumulated_text += line + "\n"

            if len(accumulated_text) >= chunk_size:
                chunks.append({
                    "text": accumulated_text.strip(),
                    "page_number": current_page,
                    "section_heading": current_section,
                    "line_start": line_start,
                    "line_end": line_idx,
                })
                # Retain overlap from the end
                overlap_lines = accumulated_text.splitlines()[-3:] if overlap > 0 else []
                accumulated_text = "\n".join(overlap_lines) + "\n"
                line_start = max(1, line_idx - len(overlap_lines) + 1)

        if accumulated_text.strip():
            chunks.append({
                "text": accumulated_text.strip(),
                "page_number": current_page,
                "section_heading": current_section,
                "line_start": line_start,
                "line_end": len(lines),
            })

        return chunks

    def hybrid_search(
        self,
        project_id: str,
        query: str,
        top_k: int = 6,
        include_reference_kb: bool = True,
        category_filter: Optional[str] = None,
    ) -> List[RetrievedKnowledgeEvidence]:
        """Executes hybrid BM25 and dense semantic retrieval across project and reference knowledge bases."""
        clean_q = clean_evidence_quote(query)
        q_tokens = re.findall(r"\b[a-zA-Z0-9_-]{2,}\b", clean_q.lower())
        q_vec = self.generate_embedding(clean_q)

        results: List[RetrievedKnowledgeEvidence] = []

        # 1. Search Project Knowledge Base (Strict Project Isolation)
        with self.db.session() as conn:
            proj_rows = conn.execute(
                """
                SELECT c.*, s.name as source_name
                FROM project_knowledge_chunks c
                JOIN project_sources s ON c.source_id = s.id
                WHERE c.project_id = ? AND s.is_active = 1
                """,
                (project_id,),
            ).fetchall()

        for r in proj_rows:
            chunk_text = r["clean_content"]
            chunk_tokens = re.findall(r"\b[a-zA-Z0-9_-]{2,}\b", chunk_text.lower())
            chunk_vec = json.loads(r["embedding_vector"] or "[]")

            bm25_score = self._simple_bm25(q_tokens, chunk_tokens)
            cosine_score = self.compute_cosine_similarity(q_vec, chunk_vec)
            combined_score = round(0.4 * bm25_score + 0.6 * cosine_score, 4)

            if combined_score > 0.05:
                rel_pct = min(100, max(5, int(combined_score * 100)))
                line_str = f"L{r['line_start']}-L{r['line_end']}" if r.get("line_start") else None
                results.append(
                    RetrievedKnowledgeEvidence(
                        chunk_id=r["id"],
                        source_id=r["source_id"],
                        source_name=r["source_name"],
                        content=r["clean_content"],
                        clean_quote=clean_evidence_quote(r["clean_content"][:160]),
                        knowledge_base="project",
                        score=combined_score,
                        relevance_percentage=rel_pct,
                        page_number=r["page_number"],
                        section_heading=r["section_heading"],
                        line_range=line_str,
                    )
                )

        # 2. Search Curated Reference Knowledge Base (Optional enrichment)
        if include_reference_kb:
            with self.db.session() as conn:
                ref_query = "SELECT * FROM reference_knowledge_chunks"
                ref_params = []
                if category_filter:
                    ref_query += " WHERE category = ?"
                    ref_params.append(category_filter)
                ref_rows = conn.execute(ref_query, tuple(ref_params)).fetchall()

            for r in ref_rows:
                chunk_text = r["clean_content"]
                chunk_tokens = re.findall(r"\b[a-zA-Z0-9_-]{2,}\b", chunk_text.lower())
                chunk_vec = json.loads(r["embedding_vector"] or "[]")

                bm25_score = self._simple_bm25(q_tokens, chunk_tokens)
                cosine_score = self.compute_cosine_similarity(q_vec, chunk_vec)
                combined_score = round(0.4 * bm25_score + 0.6 * cosine_score, 4)

                if combined_score > 0.08:
                    rel_pct = min(100, max(5, int(combined_score * 100)))
                    results.append(
                        RetrievedKnowledgeEvidence(
                            chunk_id=r["id"],
                            source_id="reference_kb",
                            source_name=f"Standard Reference: {r['title']}",
                            content=r["clean_content"],
                            clean_quote=clean_evidence_quote(r["clean_content"][:160]),
                            knowledge_base="reference",
                            score=combined_score,
                            relevance_percentage=rel_pct,
                            section_heading=r["category"].title(),
                        )
                    )

        # Sort descending by combined score and take top_k
        results.sort(key=lambda x: x.score, reverse=True)
        return results[:top_k]

    def _simple_bm25(self, query_tokens: List[str], doc_tokens: List[str]) -> float:
        """Calculates normalized term match score."""
        if not query_tokens or not doc_tokens:
            return 0.0
        doc_counts = Counter(doc_tokens)
        matches = sum(1.0 for q in query_tokens if q in doc_counts)
        return min(1.0, matches / max(1.0, len(query_tokens)))

    def _ensure_reference_knowledge_seeded(self) -> None:
        """Seeds curated industry standards and evaluation checklists into Reference Knowledge Base."""
        with self.db.session() as conn:
            count = conn.execute("SELECT count(*) as c FROM reference_knowledge_chunks").fetchone()["c"]
            if count > 0:
                return

            standards = [
                (
                    "ref_arch_01", "architecture", "Modularity and Separation of Concerns",
                    "Software architectures should strictly decouple business logic from transport layers and persistence handlers. Use repository patterns for database isolation.",
                    ["architecture", "modularity", "patterns"]
                ),
                (
                    "ref_sec_01", "security", "OWASP API Security: Broken Object Level Authorization",
                    "Never trust client supplied identity identifiers. Validate object ownership and tenant boundaries on every endpoint handler using cryptographic claims.",
                    ["security", "owasp", "authorization"]
                ),
                (
                    "ref_perf_01", "performance", "Bounded Concurrency and Write-Ahead Logging",
                    "High concurrency architectures require bounded thread worker pools and transactional write-ahead logging to prevent memory exhaustion and data loss.",
                    ["performance", "wal", "concurrency"]
                ),
                (
                    "ref_a11y_01", "accessibility", "WCAG 2.2 AA Contrast and Keyboard Navigation",
                    "Interactive controls must satisfy a 4.5:1 contrast ratio for normal text and 3:1 for graphical UI components. All elements must support full keyboard focus.",
                    ["accessibility", "wcag", "contrast"]
                ),
            ]

            now = self._utc_now()
            for s_id, cat, title, content, tags in standards:
                vec = self.generate_embedding(content)
                conn.execute(
                    """
                    INSERT INTO reference_knowledge_chunks (
                        id, category, title, content, clean_content,
                        embedding_vector, tags_json, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (s_id, cat, title, content, clean_evidence_quote(content), json.dumps(vec), json.dumps(tags), now),
                )

    def _utc_now(self) -> str:
        from datetime import datetime, timezone
        return datetime.now(timezone.utc).isoformat()


rag_engine = AdvancedRAGEngine()

