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

def get_db_path() -> str:
    """Returns the configured database path."""
    db_url = settings.database_url
    if db_url.startswith("sqlite:///"):
        path_str = db_url.replace("sqlite:///", "")
        return path_str
    return "data/product_intelligence.db"


class DatabaseManager:
    """Manages SQLite connections and schema initialization."""

    def __init__(self, db_path: str | None = None) -> None:
        self.db_path = db_path or get_db_path()
        self._is_memory = self.db_path == ":memory:"
        self._keepalive_conn: sqlite3.Connection | None = None

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

            -- Query Performance Indexes
            CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status, created_at);
            CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
            CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
            CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id, parent_comment_id);
            CREATE INDEX IF NOT EXISTS idx_post_votes_post ON post_votes(post_id);
            CREATE INDEX IF NOT EXISTS idx_comment_votes_comment ON comment_votes(comment_id);
            CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
            """)


# Global db manager instance
db_manager = DatabaseManager()
