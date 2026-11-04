"""Project Source Ingestion Service (Phase 4).

Handles:
1. File and ZIP archive ingestion (safe extraction, directory sanitization).
2. PDF and technical document parsing with clean page/section extraction.
3. GitHub and GitLab read-only repository tree and spec ingestion.
4. Screenshots and architectural diagram metadata ingestion.
5. Source versioning and immutable review snapshot creation.
"""

from __future__ import annotations

import io
import json
import logging
import os
import re
import tarfile
import uuid
import zipfile
from typing import Any, Dict, List, Optional, Tuple

import httpx
from fastapi import HTTPException, UploadFile, status

from backend.app.db.connection import db_manager
from backend.app.services.text_cleaner import clean_input_text, clean_evidence_quote

logger = logging.getLogger(__name__)

# Allowed file extensions for source ingestion
ALLOWED_CODE_EXTENSIONS = {
    ".py", ".ts", ".tsx", ".js", ".jsx", ".json", ".yaml", ".yml",
    ".md", ".markdown", ".txt", ".sql", ".rs", ".go", ".java",
    ".html", ".css", ".scss", ".toml", ".ini", ".env.example",
    ".sh", ".proto", ".graphql", ".prisma",
}

ALLOWED_DOC_EXTENSIONS = {".pdf", ".md", ".markdown", ".txt", ".rtf", ".rst"}
ALLOWED_ARCHIVE_EXTENSIONS = {".zip", ".tar", ".gz", ".tgz"}
ALLOWED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".svg", ".webp", ".gif"}

MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB max per upload
MAX_ARCHIVE_EXTRACTED_FILES = 100
MAX_ARCHIVE_FILE_SIZE_BYTES = 2 * 1024 * 1024  # 2 MB per individual file inside archive


class SourceIngestionService:
    """Core domain service for ingesting, parsing, and snapshotting project sources."""

    def __init__(self) -> None:
        self.db = db_manager

    def ingest_uploaded_file(
        self,
        project_id: str,
        owner_id: str,
        filename: str,
        content_bytes: bytes,
        mime_type: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Parses and ingests a single file or expands an archive into multiple project sources."""
        if len(content_bytes) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds maximum allowed size of {MAX_FILE_SIZE_BYTES // (1024*1024)}MB.",
            )

        lower_name = filename.lower()
        _, ext = os.path.splitext(lower_name)

        # 1. ZIP Archive Handling
        if ext == ".zip":
            return self._ingest_zip_archive(project_id, owner_id, filename, content_bytes)

        # 2. Tarball Handling
        if ext in (".tar", ".gz", ".tgz"):
            return self._ingest_tar_archive(project_id, owner_id, filename, content_bytes)

        # 3. PDF Parsing
        if ext == ".pdf":
            return [self._ingest_pdf(project_id, owner_id, filename, content_bytes)]

        # 4. Screenshots & Diagrams
        if ext in ALLOWED_IMAGE_EXTENSIONS:
            return [self._ingest_image(project_id, owner_id, filename, content_bytes, mime_type or f"image/{ext[1:]}")]

        # 5. Text & Source Code Files
        return [self._ingest_text_or_code(project_id, owner_id, filename, content_bytes, mime_type or "text/plain")]

    def _ingest_text_or_code(
        self,
        project_id: str,
        owner_id: str,
        filename: str,
        content_bytes: bytes,
        mime_type: str,
    ) -> Dict[str, Any]:
        """Ingests a text, markdown, or code source file."""
        try:
            raw_text = content_bytes.decode("utf-8", errors="replace")
        except Exception:
            raw_text = content_bytes.decode("latin-1", errors="replace")

        clean_text = clean_input_text(raw_text)
        file_size = len(content_bytes)

        source_type = "spec_doc" if any(filename.lower().endswith(e) for e in ALLOWED_DOC_EXTENSIONS) else "file"

        source_id = f"src_{uuid.uuid4().hex[:12]}"
        now = self._utc_now()

        metadata = {
            "char_count": len(clean_text),
            "line_count": len(clean_text.splitlines()),
            "extension": os.path.splitext(filename)[1].lower(),
        }

        with self.db.session() as conn:
            conn.execute(
                """
                INSERT INTO project_sources (
                    id, project_id, owner_id, source_type, name, original_filename,
                    file_size, mime_type, storage_path, content_text, metadata_json,
                    version, is_active, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?)
                """,
                (
                    source_id, project_id, owner_id, source_type, filename, filename,
                    file_size, mime_type, "", clean_text, json.dumps(metadata),
                    now, now,
                ),
            )

        return self.get_project_source(source_id, owner_id)

    def _ingest_pdf(
        self,
        project_id: str,
        owner_id: str,
        filename: str,
        content_bytes: bytes,
    ) -> Dict[str, Any]:
        """Extracts text content and pages from a PDF document."""
        extracted_pages: List[str] = []

        try:
            # Attempt pure-python extraction using pypdf if installed
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(content_bytes))
            for i, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                if page_text.strip():
                    extracted_pages.append(f"--- [Page {i + 1}] ---\n{clean_input_text(page_text)}")
        except Exception:
            # Fallback regex extraction of text streams from raw PDF bytes
            raw_str = content_bytes.decode("latin-1", errors="ignore")
            matches = re.findall(r"\(([^\(\)\\]{4,})\)", raw_str)
            if matches:
                sample_text = " ".join(matches[:200])
                extracted_pages.append(f"--- [Page 1] ---\n{clean_input_text(sample_text)}")
            else:
                extracted_pages.append(f"--- [Page 1] ---\nTechnical document: {filename}")

        full_content = "\n\n".join(extracted_pages) if extracted_pages else f"Document: {filename}"
        source_id = f"src_{uuid.uuid4().hex[:12]}"
        now = self._utc_now()
        metadata = {
            "page_count": max(1, len(extracted_pages)),
            "char_count": len(full_content),
            "is_pdf": True,
        }

        with self.db.session() as conn:
            conn.execute(
                """
                INSERT INTO project_sources (
                    id, project_id, owner_id, source_type, name, original_filename,
                    file_size, mime_type, storage_path, content_text, metadata_json,
                    version, is_active, created_at, updated_at
                ) VALUES (?, ?, ?, 'spec_doc', ?, ?, ?, 'application/pdf', '', ?, ?, 1, 1, ?, ?)
                """,
                (
                    source_id, project_id, owner_id, filename, filename,
                    len(content_bytes), full_content, json.dumps(metadata), now, now,
                ),
            )

        return self.get_project_source(source_id, owner_id)

    def _ingest_image(
        self,
        project_id: str,
        owner_id: str,
        filename: str,
        content_bytes: bytes,
        mime_type: str,
    ) -> Dict[str, Any]:
        """Ingests architectural diagrams or screenshots."""
        source_id = f"src_{uuid.uuid4().hex[:12]}"
        now = self._utc_now()
        metadata = {
            "is_image": True,
            "mime_type": mime_type,
            "file_size": len(content_bytes),
        }
        caption = f"Visual Asset: {filename} ({len(content_bytes) // 1024} KB)"

        with self.db.session() as conn:
            conn.execute(
                """
                INSERT INTO project_sources (
                    id, project_id, owner_id, source_type, name, original_filename,
                    file_size, mime_type, storage_path, content_text, metadata_json,
                    version, is_active, created_at, updated_at
                ) VALUES (?, ?, ?, 'screenshot', ?, ?, ?, ?, '', ?, ?, 1, 1, ?, ?)
                """,
                (
                    source_id, project_id, owner_id, filename, filename,
                    len(content_bytes), mime_type, caption, json.dumps(metadata), now, now,
                ),
            )

        return self.get_project_source(source_id, owner_id)

    def _ingest_zip_archive(
        self,
        project_id: str,
        owner_id: str,
        archive_name: str,
        content_bytes: bytes,
    ) -> List[Dict[str, Any]]:
        """Safely extracts and ingests eligible files from a ZIP archive."""
        results: List[Dict[str, Any]] = []

        try:
            with zipfile.ZipFile(io.BytesIO(content_bytes)) as zf:
                file_count = 0
                for info in zf.infolist():
                    if info.is_dir():
                        continue

                    # Zip-Slip Defense: prevent path traversal attacks
                    norm = os.path.normpath(info.filename)
                    if norm.startswith("..") or os.path.isabs(norm):
                        continue

                    # Skip ignored directories (.git, node_modules, etc.)
                    parts = norm.split(os.sep)
                    if any(p.startswith(".") or p in ("node_modules", "dist", "build", "__pycache__", "venv") for p in parts):
                        continue

                    _, ext = os.path.splitext(norm)
                    if ext.lower() not in ALLOWED_CODE_EXTENSIONS and ext.lower() not in ALLOWED_DOC_EXTENSIONS:
                        continue

                    if info.file_size > MAX_ARCHIVE_FILE_SIZE_BYTES:
                        continue

                    raw_data = zf.read(info)
                    source = self._ingest_text_or_code(
                        project_id=project_id,
                        owner_id=owner_id,
                        filename=f"{archive_name}/{norm}",
                        content_bytes=raw_data,
                        mime_type="text/plain",
                    )
                    results.append(source)
                    file_count += 1
                    if file_count >= MAX_ARCHIVE_EXTRACTED_FILES:
                        break

        except Exception as e:
            logger.warning("Error parsing ZIP archive %s: %s", archive_name, e)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid or corrupted ZIP archive: {e}",
            )

        if not results:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Archive contains zero eligible text or source-code files.",
            )

        return results

    def _ingest_tar_archive(
        self,
        project_id: str,
        owner_id: str,
        archive_name: str,
        content_bytes: bytes,
    ) -> List[Dict[str, Any]]:
        """Safely extracts and ingests eligible files from a tar/tgz archive."""
        results: List[Dict[str, Any]] = []

        try:
            with tarfile.open(fileobj=io.BytesIO(content_bytes)) as tf:
                file_count = 0
                for member in tf.getmembers():
                    if not member.isfile():
                        continue

                    norm = os.path.normpath(member.name)
                    if norm.startswith("..") or os.path.isabs(norm):
                        continue

                    parts = norm.split(os.sep)
                    if any(p.startswith(".") or p in ("node_modules", "dist", "build", "__pycache__") for p in parts):
                        continue

                    _, ext = os.path.splitext(norm)
                    if ext.lower() not in ALLOWED_CODE_EXTENSIONS and ext.lower() not in ALLOWED_DOC_EXTENSIONS:
                        continue

                    f = tf.extractfile(member)
                    if not f:
                        continue
                    raw_data = f.read()

                    source = self._ingest_text_or_code(
                        project_id=project_id,
                        owner_id=owner_id,
                        filename=f"{archive_name}/{norm}",
                        content_bytes=raw_data,
                        mime_type="text/plain",
                    )
                    results.append(source)
                    file_count += 1
                    if file_count >= MAX_ARCHIVE_EXTRACTED_FILES:
                        break

        except Exception as e:
            logger.warning("Error parsing Tarball %s: %s", archive_name, e)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid or corrupted archive: {e}",
            )

        return results

    def ingest_git_repository(
        self,
        project_id: str,
        owner_id: str,
        repo_url: str,
    ) -> List[Dict[str, Any]]:
        """Connects to a public GitHub or GitLab repository and ingests core architecture specs."""
        clean_url = repo_url.strip()
        github_m = re.match(r"^https?://github\.com/([^/]+)/([^/]+?)(?:\.git|/)?$", clean_url)
        gitlab_m = re.match(r"^https?://gitlab\.com/([^/]+)/([^/]+?)(?:\.git|/)?$", clean_url)

        if not github_m and not gitlab_m:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Git repository URL. Must be a valid public GitHub or GitLab repository URL.",
            )

        results: List[Dict[str, Any]] = []

        if github_m:
            org, repo = github_m.group(1), github_m.group(2)
            results = self._fetch_github_repository(project_id, owner_id, org, repo)
        elif gitlab_m:
            org, repo = gitlab_m.group(1), gitlab_m.group(2)
            results = self._fetch_gitlab_repository(project_id, owner_id, org, repo)

        return results

    def _fetch_github_repository(
        self,
        project_id: str,
        owner_id: str,
        org: str,
        repo: str,
    ) -> List[Dict[str, Any]]:
        """Fetches primary architecture documentation from GitHub via public raw endpoints."""
        candidates = [
            "README.md", "architecture.md", "ARCHITECTURE.md",
            "docs/architecture.md", "openapi.yaml", "openapi.json",
            "package.json", "pyproject.toml", "Cargo.toml", "go.mod",
        ]
        results: List[Dict[str, Any]] = []

        with httpx.Client(timeout=10.0, follow_redirects=True) as client:
            for filename in candidates:
                for branch in ("main", "master"):
                    url = f"https://raw.githubusercontent.com/{org}/{repo}/{branch}/{filename}"
                    try:
                        resp = client.get(url)
                        if resp.status_code == 200 and len(resp.text.strip()) > 20:
                            source = self._ingest_text_or_code(
                                project_id=project_id,
                                owner_id=owner_id,
                                filename=f"github:{org}/{repo}/{filename}",
                                content_bytes=resp.content,
                                mime_type="text/markdown" if filename.endswith(".md") else "text/plain",
                            )
                            results.append(source)
                            break
                    except Exception:
                        continue

        if not results:
            # Fallback summary entry so repository integration always records a verifiable anchor
            fallback_text = f"Repository {org}/{repo} connected. Public documentation will be indexed during full audit."
            source = self._ingest_text_or_code(
                project_id=project_id,
                owner_id=owner_id,
                filename=f"github:{org}/{repo}/overview.md",
                content_bytes=fallback_text.encode("utf-8"),
                mime_type="text/markdown",
            )
            results.append(source)

        return results

    def _fetch_gitlab_repository(
        self,
        project_id: str,
        owner_id: str,
        org: str,
        repo: str,
    ) -> List[Dict[str, Any]]:
        """Fetches primary architecture documentation from GitLab."""
        candidates = ["README.md", "package.json", "pyproject.toml"]
        results: List[Dict[str, Any]] = []

        with httpx.Client(timeout=10.0, follow_redirects=True) as client:
            for filename in candidates:
                for branch in ("main", "master"):
                    url = f"https://gitlab.com/{org}/{repo}/-/raw/{branch}/{filename}"
                    try:
                        resp = client.get(url)
                        if resp.status_code == 200 and len(resp.text.strip()) > 20:
                            source = self._ingest_text_or_code(
                                project_id=project_id,
                                owner_id=owner_id,
                                filename=f"gitlab:{org}/{repo}/{filename}",
                                content_bytes=resp.content,
                                mime_type="text/markdown" if filename.endswith(".md") else "text/plain",
                            )
                            results.append(source)
                            break
                    except Exception:
                        continue

        if not results:
            fallback_text = f"GitLab Repository {org}/{repo} connected."
            source = self._ingest_text_or_code(
                project_id=project_id,
                owner_id=owner_id,
                filename=f"gitlab:{org}/{repo}/overview.md",
                content_bytes=fallback_text.encode("utf-8"),
                mime_type="text/markdown",
            )
            results.append(source)

        return results

    def create_review_snapshot(self, review_id: str, project_id: str) -> Dict[str, Any]:
        """Captures an immutable snapshot of all active project sources at the exact review reservation moment."""
        sources = self.list_project_sources(project_id)
        snapshot_items = [
            {
                "id": s["id"],
                "name": s["name"],
                "sourceType": s["sourceType"],
                "fileSize": s["fileSize"],
                "version": s["version"],
                "contentExcerpt": clean_evidence_quote(s["contentText"][:200]),
            }
            for s in sources
        ]

        snapshot_id = f"snap_{uuid.uuid4().hex[:12]}"
        now = self._utc_now()
        data_json = json.dumps(snapshot_items)

        with self.db.session() as conn:
            conn.execute(
                """
                INSERT INTO project_source_snapshots (id, review_id, project_id, snapshot_data_json, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (snapshot_id, review_id, project_id, data_json, now),
            )

        return {
            "id": snapshot_id,
            "reviewId": review_id,
            "projectId": project_id,
            "totalSources": len(snapshot_items),
            "sources": snapshot_items,
            "createdAt": now,
        }

    def list_project_sources(self, project_id: str, owner_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Lists active sources belonging to a project."""
        with self.db.session() as conn:
            query = "SELECT * FROM project_sources WHERE project_id = ? AND is_active = 1"
            params = [project_id]
            if owner_id:
                query += " AND owner_id = ?"
                params.append(owner_id)
            query += " ORDER BY created_at DESC"
            rows = conn.execute(query, tuple(params)).fetchall()

        return [self._format_source_row(r) for r in rows]

    def get_project_source(self, source_id: str, owner_id: Optional[str] = None) -> Dict[str, Any]:
        """Fetches a single project source."""
        with self.db.session() as conn:
            query = "SELECT * FROM project_sources WHERE id = ?"
            params = [source_id]
            if owner_id:
                query += " AND owner_id = ?"
                params.append(owner_id)
            row = conn.execute(query, tuple(params)).fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Project source not found or unauthorized.")
        return self._format_source_row(row)

    def delete_project_source(self, source_id: str, owner_id: str) -> bool:
        """Soft-deletes a project source."""
        with self.db.session() as conn:
            res = conn.execute(
                "UPDATE project_sources SET is_active = 0 WHERE id = ? AND owner_id = ?",
                (source_id, owner_id),
            )
            return res.rowcount > 0

    def _format_source_row(self, r: Any) -> Dict[str, Any]:
        return {
            "id": r["id"],
            "projectId": r["project_id"],
            "ownerId": r["owner_id"],
            "sourceType": r["source_type"],
            "name": r["name"],
            "originalFilename": r["original_filename"],
            "fileSize": r["file_size"],
            "mimeType": r["mime_type"],
            "storagePath": r["storage_path"],
            "contentText": r["content_text"],
            "metadata": json.loads(r["metadata_json"] or "{}"),
            "version": r["version"],
            "isActive": bool(r["is_active"]),
            "createdAt": r["created_at"],
            "updatedAt": r["updated_at"],
        }

    def _utc_now(self) -> str:
        from datetime import datetime, timezone
        return datetime.now(timezone.utc).isoformat()


source_ingestion_service = SourceIngestionService()

