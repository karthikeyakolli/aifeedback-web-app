"""Database connection and schema initialization for Product Research Intelligence.

Provides SQLite persistence matching the Supabase schema specification,
with foreign key enforcement, WAL mode, indexing, and seed data initialization.
"""

from __future__ import annotations

import contextlib
import os
import sqlite3
import uuid
from pathlib import Path
from typing import Generator

from backend.app.config import settings

import logging

logger = logging.getLogger(__name__)


def get_db_path() -> str:
    """Returns the configured database path."""
    db_url = settings.database_url
    if db_url.startswith("sqlite:///"):
        path_str = db_url.replace("sqlite:///", "")
        return path_str
    return "data/product_intelligence.db"


class DatabaseManager:
    """Manages database connections, schema initialization, and dual-mode routing.
    
    Architecture boundary:
    - Canonical Production Engine: Supabase PostgreSQL via DATABASE_URL.
    - Local / Test Engine: SQLite in WAL mode with enforced foreign keys.
    """

    def __init__(self, db_path: str | None = None) -> None:
        raw_url = settings.database_url
        if raw_url.startswith(("postgresql://", "postgres://")):
            self.engine_type = "postgresql"
            self.db_path = raw_url
        else:
            self.engine_type = "sqlite"
            self.db_path = db_path or get_db_path()

        # Production Guard: Alert if SQLite is inadvertently used in production
        if settings.environment.lower() == "production" and self.engine_type == "sqlite":
            logger.warning(
                "ARCHITECTURE ADVISORY: Production environment is running on SQLite fallback. "
                "Canonical production deployment requires Supabase PostgreSQL via DATABASE_URL."
            )

        self._is_memory = self.db_path == ":memory:"
        self._keepalive_conn: sqlite3.Connection | None = None

        if self.engine_type == "sqlite":
            if self._is_memory:
                self._uri = f"file:mem_{uuid.uuid4().hex}?mode=memory&cache=shared"
                self._keepalive_conn = sqlite3.connect(
                    self._uri, uri=True, timeout=30.0, check_same_thread=False
                )
                self._keepalive_conn.execute("PRAGMA foreign_keys = ON;")
            else:
                db_file = Path(self.db_path)
                db_file.parent.mkdir(parents=True, exist_ok=True)

            self.init_db()

    def get_connection(self) -> sqlite3.Connection:
        """Creates a connection with foreign keys and row factory enabled."""
        if self.engine_type != "sqlite":
            raise NotImplementedError(
                "Direct PostgreSQL driver (psycopg2/asyncpg) must be configured for non-SQLite production execution."
            )

        if self._is_memory:
            conn = sqlite3.connect(
                self._uri, uri=True, timeout=30.0, check_same_thread=False
            )
        else:
            conn = sqlite3.connect(
                self.db_path, timeout=30.0, check_same_thread=False
            )
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON;")
        if not self._is_memory:
            conn.execute("PRAGMA journal_mode = WAL;")
        return conn

    @contextlib.contextmanager
    def session(self) -> Generator[sqlite3.Connection, None, None]:
        """Context-managed database connection with automatic commit/rollback."""
        conn = self.get_connection()
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def init_db(self) -> None:
        """Executes initial schema definition."""
        with self.session() as conn:
            conn.executescript("""
            -- Internal Auth Credentials (for standalone & offline development)
            CREATE TABLE IF NOT EXISTS auth_users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                hashed_password TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            -- Profiles Table
            CREATE TABLE IF NOT EXISTS profiles (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                display_name TEXT NOT NULL,
                avatar_url TEXT,
                bio TEXT DEFAULT '',
                reputation_score INTEGER DEFAULT 0,
                is_moderator INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            -- Posts Table
            CREATE TABLE IF NOT EXISTS posts (
                id TEXT PRIMARY KEY,
                author_id TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                post_type TEXT NOT NULL,
                product_url TEXT,
                category TEXT NOT NULL,
                tags TEXT DEFAULT '[]',
                is_anonymous INTEGER DEFAULT 0,
                upvotes_count INTEGER DEFAULT 0,
                comments_count INTEGER DEFAULT 0,
                status TEXT DEFAULT 'published',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE
            );

            -- Comments Table
            CREATE TABLE IF NOT EXISTS comments (
                id TEXT PRIMARY KEY,
                post_id TEXT NOT NULL,
                parent_comment_id TEXT,
                author_id TEXT NOT NULL,
                content TEXT NOT NULL,
                is_anonymous INTEGER DEFAULT 0,
                upvotes_count INTEGER DEFAULT 0,
                is_helpful_flag INTEGER DEFAULT 0,
                status TEXT DEFAULT 'published',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE,
                FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE
            );

            -- Post Votes Table (Unique constraint prevents duplicate votes)
            CREATE TABLE IF NOT EXISTS post_votes (
                id TEXT PRIMARY KEY,
                post_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                vote_type INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                UNIQUE (post_id, user_id),
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
            );

            -- Comment Votes Table (Unique constraint prevents duplicate votes)
            CREATE TABLE IF NOT EXISTS comment_votes (
                id TEXT PRIMARY KEY,
                comment_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                vote_type INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                UNIQUE (comment_id, user_id),
                FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
            );

            -- Bookmarks Table
            CREATE TABLE IF NOT EXISTS bookmarks (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                post_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                UNIQUE (user_id, post_id),
                FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
            );

            -- Reports Table
            CREATE TABLE IF NOT EXISTS reports (
                id TEXT PRIMARY KEY,
                reporter_id TEXT NOT NULL,
                target_type TEXT NOT NULL,
                target_id TEXT NOT NULL,
                reason TEXT NOT NULL,
                description TEXT DEFAULT '',
                status TEXT DEFAULT 'pending',
                created_at TEXT NOT NULL,
                FOREIGN KEY (reporter_id) REFERENCES profiles(id) ON DELETE CASCADE
            );

            -- Analysis Runs Table (Phase 3 AI Persistence & Versioning)
            CREATE TABLE IF NOT EXISTS analysis_runs (
                id TEXT PRIMARY KEY,
                post_id TEXT NOT NULL,
                requested_by TEXT,
                status TEXT NOT NULL,
                provider TEXT NOT NULL,
                model TEXT NOT NULL,
                prompt_version TEXT NOT NULL,
                input_hash TEXT NOT NULL,
                total_comment_count INTEGER NOT NULL DEFAULT 0,
                analyzed_comment_count INTEGER NOT NULL DEFAULT 0,
                result_json TEXT NOT NULL,
                error_message TEXT,
                created_at TEXT NOT NULL,
                completed_at TEXT,
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                FOREIGN KEY (requested_by) REFERENCES profiles(id) ON DELETE SET NULL
            );

            -- Conversation Sessions Table (Phase 4 Interactive Research Assistant)
            CREATE TABLE IF NOT EXISTS conversation_sessions (
                id TEXT PRIMARY KEY,
                post_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                title TEXT NOT NULL DEFAULT 'Research Discussion',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
            );

            -- Conversation Messages Table (Phase 4 Research Chat Turns & Citations)
            CREATE TABLE IF NOT EXISTS conversation_messages (
                id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
                content TEXT NOT NULL,
                citations TEXT DEFAULT '[]',
                metadata TEXT DEFAULT '{}',
                created_at TEXT NOT NULL,
                FOREIGN KEY (session_id) REFERENCES conversation_sessions(id) ON DELETE CASCADE
            );

            -- Research Reports Table (Phase 5 Generated Reports, PRDs & Tickets)
            CREATE TABLE IF NOT EXISTS research_reports (
                id TEXT PRIMARY KEY,
                post_id TEXT NOT NULL,
                owner_id TEXT NOT NULL,
                report_type TEXT NOT NULL CHECK (
                    report_type IN (
                        'analytical_report',
                        'executive_summary',
                        'prd',
                        'engineering_ticket',
                        'ux_brief',
                        'improvement_roadmap',
                        'engineering_investigation'
                    )
                ),
                title TEXT NOT NULL,
                content_markdown TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'completed' CHECK (
                    status IN ('completed', 'draft', 'failed')
                ),
                source_analysis_id TEXT,
                version INTEGER NOT NULL DEFAULT 1,
                metadata TEXT DEFAULT '{}',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE,
                FOREIGN KEY (source_analysis_id) REFERENCES analysis_runs(id) ON DELETE SET NULL
            );

            -- Notifications Table (Phase 6 Social & System Activity)
            CREATE TABLE IF NOT EXISTS notifications (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                actor_id TEXT,
                type TEXT NOT NULL CHECK (type IN ('reply', 'comment', 'upvote', 'ai_ready', 'moderation', 'system')),
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                link_url TEXT NOT NULL,
                is_read INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
                FOREIGN KEY (actor_id) REFERENCES profiles(id) ON DELETE SET NULL
            );

            -- Project Creator Uploaded Documents Table (PDFs, Markdown Specs, Pitch Decks)
            CREATE TABLE IF NOT EXISTS post_documents (
                id TEXT PRIMARY KEY,
                post_id TEXT NOT NULL,
                owner_id TEXT NOT NULL,
                filename TEXT NOT NULL,
                file_type TEXT NOT NULL,
                file_size INTEGER NOT NULL,
                content_text TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE
            );

            -- Immutable Product Review Versions Table (Finalized AI Lab Full Product Reviews)
            CREATE TABLE IF NOT EXISTS product_reviews (
                id TEXT PRIMARY KEY,
                post_id TEXT NOT NULL,
                owner_id TEXT NOT NULL,
                version INTEGER NOT NULL DEFAULT 1,
                status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'processing', 'failed')),
                provider TEXT NOT NULL,
                model TEXT NOT NULL,
                source_snapshot TEXT NOT NULL,
                content_markdown TEXT NOT NULL,
                structured_output TEXT NOT NULL,
                citations TEXT DEFAULT '[]',
                deterministic_stats TEXT DEFAULT '{}',
                stages_completed TEXT DEFAULT '[]',
                error_message TEXT,
                created_at TEXT NOT NULL,
                completed_at TEXT,
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE
            );

            -- Projects Table (Phase 0 & 2 Foundation)
            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                tagline TEXT NOT NULL,
                description TEXT NOT NULL,
                category TEXT NOT NULL,
                repository_url TEXT,
                demo_url TEXT,
                status TEXT NOT NULL DEFAULT 'draft',
                is_public INTEGER NOT NULL DEFAULT 0,
                upvotes_count INTEGER NOT NULL DEFAULT 0,
                reviews_count INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
            );

            -- Project Attachments
            CREATE TABLE IF NOT EXISTS project_attachments (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                owner_id TEXT NOT NULL,
                filename TEXT NOT NULL,
                file_size INTEGER NOT NULL,
                mime_type TEXT NOT NULL,
                storage_path TEXT NOT NULL,
                content_excerpt TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE
            );

            -- AI Reviews
            CREATE TABLE IF NOT EXISTS ai_reviews (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                model_id TEXT NOT NULL,
                provider TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'queued',
                error_message TEXT,
                execution_duration_ms INTEGER,
                input_token_count INTEGER,
                output_token_count INTEGER,
                created_at TEXT NOT NULL,
                completed_at TEXT,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
            );

            -- Feedback Reports
            CREATE TABLE IF NOT EXISTS feedback_reports (
                id TEXT PRIMARY KEY,
                review_id TEXT NOT NULL UNIQUE,
                project_id TEXT NOT NULL,
                executive_summary TEXT NOT NULL,
                strengths_summary TEXT NOT NULL,
                total_findings_count INTEGER NOT NULL DEFAULT 0,
                blockers_count INTEGER NOT NULL DEFAULT 0,
                high_count INTEGER NOT NULL DEFAULT 0,
                medium_count INTEGER NOT NULL DEFAULT 0,
                low_count INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                FOREIGN KEY (review_id) REFERENCES ai_reviews(id) ON DELETE CASCADE,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            );

            -- Feedback Findings
            CREATE TABLE IF NOT EXISTS feedback_findings (
                id TEXT PRIMARY KEY,
                report_id TEXT NOT NULL,
                project_id TEXT NOT NULL,
                title TEXT NOT NULL,
                severity TEXT NOT NULL,
                category TEXT NOT NULL,
                observation TEXT NOT NULL,
                evidence_quote TEXT NOT NULL,
                recommendation TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'open',
                resolved_at TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (report_id) REFERENCES feedback_reports(id) ON DELETE CASCADE,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            );

            -- Project Upvotes (Phase 8 Public Space Community Scrutiny)
            CREATE TABLE IF NOT EXISTS project_upvotes (
                project_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                PRIMARY KEY (project_id, user_id),
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            );

            -- Query Performance Indexes
            CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status, created_at);
            CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
            CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
            CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id, parent_comment_id);
            CREATE INDEX IF NOT EXISTS idx_post_votes_post ON post_votes(post_id);
            CREATE INDEX IF NOT EXISTS idx_comment_votes_comment ON comment_votes(comment_id);
            CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
            CREATE INDEX IF NOT EXISTS idx_analysis_runs_post ON analysis_runs(post_id, created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_analysis_runs_hash ON analysis_runs(post_id, input_hash);
            CREATE INDEX IF NOT EXISTS idx_conv_sessions_user ON conversation_sessions(user_id, post_id, updated_at DESC);
            CREATE INDEX IF NOT EXISTS idx_conv_messages_session ON conversation_messages(session_id, created_at ASC);
            CREATE INDEX IF NOT EXISTS idx_research_reports_post ON research_reports(post_id, created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_research_reports_owner ON research_reports(owner_id, post_id);
            CREATE INDEX IF NOT EXISTS idx_research_reports_type ON research_reports(post_id, report_type);
            CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read, created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_post_documents_post ON post_documents(post_id, created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_product_reviews_post_ver ON product_reviews(post_id, version DESC);
            CREATE INDEX IF NOT EXISTS idx_product_reviews_owner ON product_reviews(owner_id, post_id);
            CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id, updated_at DESC);
            CREATE INDEX IF NOT EXISTS idx_projects_public ON projects(category, created_at DESC) WHERE is_public = 1;
            CREATE INDEX IF NOT EXISTS idx_feedback_findings_rep ON feedback_findings(report_id, severity);
            CREATE INDEX IF NOT EXISTS idx_feedback_findings_proj ON feedback_findings(project_id, status);
            """)

            # Upgrade conversation_sessions review_id column if not present
            cur = conn.cursor()
            conv_cols = [r[1] for r in cur.execute("PRAGMA table_info(conversation_sessions)").fetchall()]
            if "review_id" not in conv_cols:
                conn.execute("ALTER TABLE conversation_sessions ADD COLUMN review_id TEXT;")
            tbl_info = cur.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='research_reports'").fetchone()
            if tbl_info and tbl_info[0] and "improvement_roadmap" not in tbl_info[0]:
                conn.execute("PRAGMA foreign_keys = OFF;")
                conn.execute("""
                    CREATE TABLE research_reports_v2 (
                        id TEXT PRIMARY KEY,
                        post_id TEXT NOT NULL,
                        owner_id TEXT NOT NULL,
                        report_type TEXT NOT NULL CHECK (
                            report_type IN (
                                'analytical_report',
                                'executive_summary',
                                'prd',
                                'engineering_ticket',
                                'ux_brief',
                                'improvement_roadmap',
                                'engineering_investigation'
                            )
                        ),
                        title TEXT NOT NULL,
                        content_markdown TEXT NOT NULL,
                        status TEXT NOT NULL DEFAULT 'completed' CHECK (
                            status IN ('completed', 'draft', 'failed')
                        ),
                        source_analysis_id TEXT,
                        version INTEGER NOT NULL DEFAULT 1,
                        metadata TEXT DEFAULT '{}',
                        created_at TEXT NOT NULL,
                        updated_at TEXT NOT NULL,
                        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                        FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE,
                        FOREIGN KEY (source_analysis_id) REFERENCES analysis_runs(id) ON DELETE SET NULL
                    );
                """)
                conn.execute("INSERT INTO research_reports_v2 SELECT * FROM research_reports;")
                conn.execute("DROP TABLE research_reports;")
                conn.execute("ALTER TABLE research_reports_v2 RENAME TO research_reports;")
                conn.execute("PRAGMA foreign_keys = ON;")
                conn.execute("CREATE INDEX IF NOT EXISTS idx_research_reports_post ON research_reports(post_id, created_at DESC);")
                conn.execute("CREATE INDEX IF NOT EXISTS idx_research_reports_owner ON research_reports(owner_id, post_id);")
                conn.execute("CREATE INDEX IF NOT EXISTS idx_research_reports_type ON research_reports(post_id, report_type);")

            # Upgrade is_synthetic column on posts, comments, post_documents if not present
            post_cols = [r[1] for r in cur.execute("PRAGMA table_info(posts)").fetchall()]
            if "is_synthetic" not in post_cols:
                conn.execute("ALTER TABLE posts ADD COLUMN is_synthetic INTEGER DEFAULT 0;")

            comment_cols = [r[1] for r in cur.execute("PRAGMA table_info(comments)").fetchall()]
            if "is_synthetic" not in comment_cols:
                conn.execute("ALTER TABLE comments ADD COLUMN is_synthetic INTEGER DEFAULT 0;")

            doc_cols = [r[1] for r in cur.execute("PRAGMA table_info(post_documents)").fetchall()]
            if "is_synthetic" not in doc_cols:
                conn.execute("ALTER TABLE post_documents ADD COLUMN is_synthetic INTEGER DEFAULT 0;")

            # Upgrade creator profile fields if not present
            profile_cols = [r[1] for r in cur.execute("PRAGMA table_info(profiles)").fetchall()]
            if "github_url" not in profile_cols:
                conn.execute("ALTER TABLE profiles ADD COLUMN github_url TEXT;")
            if "website_url" not in profile_cols:
                conn.execute("ALTER TABLE profiles ADD COLUMN website_url TEXT;")
            if "skills" not in profile_cols:
                conn.execute("ALTER TABLE profiles ADD COLUMN skills TEXT DEFAULT '[]';")


# Global db manager instance
db_manager = DatabaseManager()
