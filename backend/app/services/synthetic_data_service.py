"""Synthetic Data Management Service for Phase 5.

Provides isolated, idempotent generation, preview, reset, deletion, and export
of synthetic product discussions, internal documents with page delimiters,
and diverse community feedback.
Ensures real user data is never modified or contaminated.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import logging

from backend.app.db.connection import db_manager

logger = logging.getLogger(__name__)


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


# Stable Identifiers for Synthetic Demonstration Data
SYNTH_POST_ID = "post_synth_reflectflow_01"
SYNTH_OWNER_ID = "usr_sarah_chen"
SYNTH_DOC_PRD_ID = "doc_synth_prd_01"
SYNTH_DOC_ARCH_ID = "doc_synth_arch_02"


SYNTH_POST_DATA = {
    "id": SYNTH_POST_ID,
    "author_id": SYNTH_OWNER_ID,
    "title": "ReflectFlow: Distributed Offline-First Workspaces with CRDT Synchronization",
    "description": (
        "ReflectFlow delivers real-time document collaboration with local-first persistence "
        "via SQLite WASM and CRDT state vectors. Seeking critical community review on offline sync "
        "conflict resolution, mobile memory profile, and developer ergonomics."
    ),
    "post_type": "product_review",
    "product_url": "https://reflectflow.dev",
    "category": "Developer Tools",
    "tags": json.dumps(["offline-first", "crdt", "sqlite", "sync", "developer-tools", "synthetic-demo"]),
    "is_anonymous": 0,
    "is_synthetic": 1,
    "upvotes_count": 48,
    "comments_count": 6,
    "status": "published",
}

SYNTH_DOCUMENTS_DATA = [
    {
        "id": SYNTH_DOC_PRD_ID,
        "post_id": SYNTH_POST_ID,
        "owner_id": SYNTH_OWNER_ID,
        "filename": "reflectflow_prd_v1.md",
        "file_type": "text/markdown",
        "file_size": 2840,
        "is_synthetic": 1,
        "content_text": """--- Page 1: Product Requirements & Sync Protocol ---
# ReflectFlow Product Requirements Document (PRD) v1.0

## 1. Executive Overview & Sync Goals
ReflectFlow is designed to eliminate cloud vendor lock-in by providing instant local read/writes with zero round-trip latency. All mutation events are serialized into CRDT (Conflict-free Replicated Data Type) operations using Yjs state vectors.

## 2. Synchronization Architecture
- **Local Store**: Embedded SQLite database operating in WAL mode.
- **Peer Mesh**: WebRTC data channels for low-latency peer-to-peer broadcast.
- **Conflict Policy**: Deterministic Last-Write-Wins (LWW) element set for scalar attributes, and causal graph merge for text nodes. No manual conflict modal should ever block the user.

--- Page 2: Performance Constraints & Resource Budgets ---
## 3. Resource Budgets
- Maximum idle memory on mobile clients: 45MB.
- Initial sync handshake latency: < 150ms over 4G LTE.
- Indexed database footprint: maximum 2.5x of raw document content.

## 4. Key Improvements & Roadmap
- Phase 1: Real-time multi-user cursor & presence indicators.
- Phase 2: Webhook integrations for Linear and GitHub issues.
- Phase 3: Hardware-accelerated local vector embedding for offline semantic search.
""",
    },
    {
        "id": SYNTH_DOC_ARCH_ID,
        "post_id": SYNTH_POST_ID,
        "owner_id": SYNTH_OWNER_ID,
        "filename": "reflectflow_architecture_spec.txt",
        "file_type": "text/plain",
        "file_size": 2420,
        "is_synthetic": 1,
        "content_text": """--- Page 1: Subsystem Architecture ---
[Architecture Specification: ReflectFlow Engine]

Component 1: WASM SQLite Storage Engine
The storage subsystem compiles SQLite 3.45 to WebAssembly with OPFS (Origin Private File System) persistence. On Safari iOS, OPFS is known to trigger thread contention when sync batches exceed 500 records.

Component 2: CRDT Message Pipeline
Messages are partitioned by WorkspaceID. Each client maintains a vector clock. When reconciling peer states, delta vectors are compressed using zstandard.

--- Page 2: Known Technical Risks & Engineering Caveats ---
Known Architectural Pitfall:
In memory-constrained mobile environments (especially mobile Safari and low-end Android devices), loading large CRDT history vectors into JavaScript heap causes GC pauses exceeding 120ms. The background indexer can cause browser tabs to exceed memory quotas if uncompacted tombstones are retained longer than 14 days.
""",
    },
]

SYNTH_COMMENTS_DATA = [
    {
        "id": "comment_synth_01_positive",
        "post_id": SYNTH_POST_ID,
        "author_id": "usr_dev_dan",
        "content": "The offline-first speed is truly unmatched. Opening 500-page worktrees feels instantaneous compared to Notion or Confluence. The local SQLite caching is buttery smooth.",
        "is_anonymous": 0,
        "is_synthetic": 1,
        "upvotes_count": 14,
        "is_helpful_flag": 1,
    },
    {
        "id": "comment_synth_02_complaint",
        "post_id": SYNTH_POST_ID,
        "author_id": "usr_sarah_chen",
        "content": "Critical friction on iOS Safari: whenever two peers edit a large table simultaneously, the client shows a modal saying sync conflict occurred and rolls back my local draft. The PRD claimed automatic CRDT merge without user intervention, but this conflict modal disrupts my workflow constantly.",
        "is_anonymous": 1,
        "is_synthetic": 1,
        "upvotes_count": 28,
        "is_helpful_flag": 1,
    },
    {
        "id": "comment_synth_03_usability",
        "post_id": SYNTH_POST_ID,
        "author_id": "usr_dev_dan",
        "content": "Keyboard navigation in the task list is unintuitive. Pressing Cmd+Z doesn't undo the last task indentation; it undoes the entire text block, causing accidental data loss.",
        "is_anonymous": 0,
        "is_synthetic": 1,
        "upvotes_count": 11,
        "is_helpful_flag": 0,
    },
    {
        "id": "comment_synth_04_feature_req1",
        "post_id": SYNTH_POST_ID,
        "author_id": "usr_sarah_chen",
        "content": "We love the tool in our engineering team, but we desperately need live multi-user presence indicators so we can see which teammate is actively reviewing the spec.",
        "is_anonymous": 1,
        "is_synthetic": 1,
        "upvotes_count": 22,
        "is_helpful_flag": 1,
    },
    {
        "id": "comment_synth_05_feature_req2",
        "post_id": SYNTH_POST_ID,
        "author_id": "usr_dev_dan",
        "content": "Can you please add webhook triggers or two-way sync for Linear and GitHub issues? Currently we have to manually copy action items into our sprint board.",
        "is_anonymous": 0,
        "is_synthetic": 1,
        "upvotes_count": 19,
        "is_helpful_flag": 0,
    },
    {
        "id": "comment_synth_06_technical",
        "post_id": SYNTH_POST_ID,
        "author_id": "usr_sarah_chen",
        "content": "We profiled ReflectFlow on mobile devices and observed the JavaScript heap ballooning to 160MB after 30 minutes of continuous typing. The SQLite WASM indexer appears to retain tombstone records indefinitely without compaction.",
        "is_anonymous": 1,
        "is_synthetic": 1,
        "upvotes_count": 35,
        "is_helpful_flag": 1,
    },
]


class SyntheticDataManager:
    """Manages lifecycle of synthetic demonstration and benchmark fixtures."""

    @classmethod
    def get_stats(cls) -> Dict[str, Any]:
        """Calculates current synthetic records count."""
        with db_manager.session() as conn:
            post_cnt = conn.execute(
                "SELECT count(*) as c FROM posts WHERE is_synthetic = 1 OR id LIKE 'post_synth_%'"
            ).fetchone()["c"]
            comment_cnt = conn.execute(
                "SELECT count(*) as c FROM comments WHERE is_synthetic = 1 OR id LIKE 'comment_synth_%'"
            ).fetchone()["c"]
            doc_cnt = conn.execute(
                "SELECT count(*) as c FROM post_documents WHERE is_synthetic = 1 OR id LIKE 'doc_synth_%'"
            ).fetchone()["c"]

            posts = conn.execute(
                "SELECT id, title, category, comments_count, upvotes_count, created_at FROM posts WHERE is_synthetic = 1 OR id LIKE 'post_synth_%'"
            ).fetchall()

            return {
                "is_seeded": post_cnt > 0,
                "post_count": post_cnt,
                "comment_count": comment_cnt,
                "document_count": doc_cnt,
                "synthetic_posts": [dict(p) for p in posts],
            }

    @classmethod
    def seed_data(cls) -> Dict[str, Any]:
        """Idempotently inserts or updates the synthetic test dataset."""
        now = utc_now()
        with db_manager.session() as conn:
            # 1. Ensure synthetic author and commenter exist
            for uid, email, uname, dname in [
                (SYNTH_OWNER_ID, "sarah.chen@example.com", "sarahc", "Sarah Chen"),
                ("usr_dev_dan", "dan@example.com", "devdan", "Daniel Thorne"),
            ]:
                conn.execute(
                    "INSERT OR REPLACE INTO auth_users (id, email, hashed_password, created_at) VALUES (?, ?, ?, ?)",
                    (uid, email, "dummy_hash", now),
                )
                conn.execute(
                    """INSERT OR REPLACE INTO profiles (id, username, display_name, bio, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?)""",
                    (uid, uname, dname, "Synthetic Fixture User", now, now),
                )

            # 2. Upsert synthetic post
            post_exists = conn.execute("SELECT id FROM posts WHERE id = ?", (SYNTH_POST_ID,)).fetchone()
            if post_exists:
                conn.execute(
                    """UPDATE posts SET 
                        title = ?, description = ?, post_type = ?, product_url = ?,
                        category = ?, tags = ?, is_anonymous = 0, is_synthetic = 1,
                        upvotes_count = ?, comments_count = ?, status = 'published', updated_at = ?
                    WHERE id = ?""",
                    (
                        SYNTH_POST_DATA["title"],
                        SYNTH_POST_DATA["description"],
                        SYNTH_POST_DATA["post_type"],
                        SYNTH_POST_DATA["product_url"],
                        SYNTH_POST_DATA["category"],
                        SYNTH_POST_DATA["tags"],
                        SYNTH_POST_DATA["upvotes_count"],
                        SYNTH_POST_DATA["comments_count"],
                        now,
                        SYNTH_POST_ID,
                    ),
                )
            else:
                conn.execute(
                    """INSERT INTO posts (
                        id, author_id, title, description, post_type, product_url,
                        category, tags, is_anonymous, is_synthetic, upvotes_count, comments_count,
                        status, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)""",
                    (
                        SYNTH_POST_DATA["id"],
                        SYNTH_POST_DATA["author_id"],
                        SYNTH_POST_DATA["title"],
                        SYNTH_POST_DATA["description"],
                        SYNTH_POST_DATA["post_type"],
                        SYNTH_POST_DATA["product_url"],
                        SYNTH_POST_DATA["category"],
                        SYNTH_POST_DATA["tags"],
                        SYNTH_POST_DATA["is_anonymous"],
                        SYNTH_POST_DATA["upvotes_count"],
                        SYNTH_POST_DATA["comments_count"],
                        SYNTH_POST_DATA["status"],
                        now,
                        now,
                    ),
                )

            # 3. Upsert documents
            for doc in SYNTH_DOCUMENTS_DATA:
                doc_exists = conn.execute("SELECT id FROM post_documents WHERE id = ?", (doc["id"],)).fetchone()
                if doc_exists:
                    conn.execute(
                        """UPDATE post_documents SET 
                            filename = ?, file_type = ?, file_size = ?, content_text = ?, is_synthetic = 1
                        WHERE id = ?""",
                        (doc["filename"], doc["file_type"], doc["file_size"], doc["content_text"], doc["id"]),
                    )
                else:
                    conn.execute(
                        """INSERT INTO post_documents (
                            id, post_id, owner_id, filename, file_type, file_size, content_text, created_at, is_synthetic
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)""",
                        (
                            doc["id"],
                            doc["post_id"],
                            doc["owner_id"],
                            doc["filename"],
                            doc["file_type"],
                            doc["file_size"],
                            doc["content_text"],
                            now,
                        ),
                    )

            # 4. Upsert comments
            for c in SYNTH_COMMENTS_DATA:
                c_exists = conn.execute("SELECT id FROM comments WHERE id = ?", (c["id"],)).fetchone()
                if c_exists:
                    conn.execute(
                        """UPDATE comments SET 
                            content = ?, is_anonymous = ?, is_synthetic = 1,
                            upvotes_count = ?, is_helpful_flag = ?, updated_at = ?
                        WHERE id = ?""",
                        (c["content"], c["is_anonymous"], c["upvotes_count"], c["is_helpful_flag"], now, c["id"]),
                    )
                else:
                    conn.execute(
                        """INSERT INTO comments (
                            id, post_id, parent_comment_id, author_id, content,
                            is_anonymous, is_synthetic, upvotes_count, is_helpful_flag,
                            status, created_at, updated_at
                        ) VALUES (?, ?, NULL, ?, ?, ?, 1, ?, ?, 'published', ?, ?)""",
                        (
                            c["id"],
                            c["post_id"],
                            c["author_id"],
                            c["content"],
                            c["is_anonymous"],
                            c["upvotes_count"],
                            c["is_helpful_flag"],
                            now,
                            now,
                        ),
                    )

        logger.info("Synthetic demo dataset seeded cleanly.")
        return cls.get_stats()

    @classmethod
    def delete_data(cls) -> Dict[str, Any]:
        """Safely removes only synthetic records, preserving all user posts and comments."""
        with db_manager.session() as conn:
            conn.execute("DELETE FROM comments WHERE is_synthetic = 1 OR id LIKE 'comment_synth_%'")
            conn.execute("DELETE FROM post_documents WHERE is_synthetic = 1 OR id LIKE 'doc_synth_%'")
            conn.execute("DELETE FROM posts WHERE is_synthetic = 1 OR id LIKE 'post_synth_%'")
        logger.info("Synthetic demo dataset deleted cleanly.")
        return cls.get_stats()

    @classmethod
    def reset_data(cls) -> Dict[str, Any]:
        """Deletes and reseeds the synthetic fixtures to pristine state."""
        cls.delete_data()
        return cls.seed_data()

    @classmethod
    def export_fixtures(cls) -> Dict[str, Any]:
        """Exports the synthetic test fixtures as JSON."""
        return {
            "version": "1.0",
            "exported_at": utc_now(),
            "description": "Isolated synthetic benchmark fixtures for Phase 5 AI Testing Lab",
            "post": SYNTH_POST_DATA,
            "documents": SYNTH_DOCUMENTS_DATA,
            "comments": SYNTH_COMMENTS_DATA,
        }
