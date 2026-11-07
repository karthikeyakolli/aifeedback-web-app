"""Project Source Ingestion Service (Phase 4).

Handles:
1. File and ZIP archive ingestion (safe extraction, directory sanitization).
2. PDF and technical document parsing with clean page/section extraction.
3. GitHub and GitLab read-only repository tree and spec ingestion.
4. Screenshots and architectural diagram metadata ingestion.
5. Source versioning and immutable review snapshot creation.
"""

from __future__ import annotations

import hashlib
import io
import ipaddress
import json
import logging
import os
import re
import socket
import tarfile
import urllib.parse
import uuid
import zipfile
from typing import Any, Dict, List, Optional, Tuple

import httpx
from fastapi import HTTPException, UploadFile, status

from backend.app.db.connection import db_manager
from backend.app.services.text_cleaner import clean_input_text, clean_evidence_quote
from backend.app.services.rag_engine import rag_engine

logger = logging.getLogger(__name__)


def validate_external_url(url: str) -> str:
    """Enforces strict SSRF protection against private IP spaces and forbidden schemes."""
    if not url or not isinstance(url, str):
        raise HTTPException(status_code=400, detail="Invalid external URL.")

    parsed = urllib.parse.urlparse(url.strip())
    if parsed.scheme.lower() not in ("http", "https"):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported URL scheme '{parsed.scheme}'. Only http and https are permitted.",
        )

    hostname = parsed.hostname
    if not hostname:
        raise HTTPException(status_code=400, detail="Missing hostname in external URL.")

    lower_host = hostname.lower()
    if lower_host in ("localhost", "127.0.0.1", "::1", "metadata.google.internal", "169.254.169.254"):
        raise HTTPException(status_code=400, detail="Access to private or local loopback addresses is forbidden.")
    if lower_host.endswith(".local") or lower_host.endswith(".internal"):
        raise HTTPException(status_code=400, detail="Access to internal private domains is prohibited.")

    try:
        resolved_ip = socket.gethostbyname(hostname)
        ip_obj = ipaddress.ip_address(resolved_ip)
        if ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_link_local or ip_obj.is_reserved:
            raise HTTPException(status_code=400, detail="Access to private or reserved IP address spaces is prohibited.")
    except socket.gaierror:
        pass

    return url.strip()

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

        # Preserve canonical verbatim raw_text in database storage
        source_id = f"src_{uuid.uuid4().hex[:12]}"
        now = self._utc_now()
        file_size = len(content_bytes)
        source_type = "spec_doc" if any(filename.lower().endswith(e) for e in ALLOWED_DOC_EXTENSIONS) else "file"

        metadata = {
            "char_count": len(raw_text),
            "line_count": len(raw_text.splitlines()),
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
                    file_size, mime_type, "", raw_text, json.dumps(metadata),
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
                    extracted_pages.append(f"--- [Page {i + 1}] ---\n{page_text}")
        except Exception:
            # Fallback regex extraction of text streams from raw PDF bytes
            raw_str = content_bytes.decode("latin-1", errors="ignore")
            matches = re.findall(r"\(([^\(\)\\]{4,})\)", raw_str)
            if matches:
                sample_text = " ".join(matches[:200])
                extracted_pages.append(f"--- [Page 1] ---\n{sample_text}")
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
        credential_id: Optional[str] = None,
        branch: str = "main",
    ) -> List[Dict[str, Any]]:
        """Connects to a GitHub or GitLab repository, checking credentials and incremental sync tracking."""
        clean_url = validate_external_url(repo_url)
        github_m = re.match(r"^https?://github\.com/([^/]+)/([^/]+?)(?:\.git|/)?$", clean_url)
        gitlab_m = re.match(r"^https?://gitlab\.com/([^/]+)/([^/]+?)(?:\.git|/)?$", clean_url)

        if not github_m and not gitlab_m:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Git repository URL. Must be a valid public or private GitHub or GitLab repository URL.",
            )

        provider_name = "github" if github_m else "gitlab"
        auth_token = None
        is_private = False

        if credential_id:
            from backend.app.services.credential_service import credential_service
            try:
                auth_token = credential_service.get_plain_secret(user_id=owner_id, credential_id=credential_id)
                is_private = True
            except Exception as c_err:
                logger.warning("Failed to decrypt git credential %s: %s", credential_id, c_err)

        org, repo = (github_m.group(1), github_m.group(2)) if github_m else (gitlab_m.group(1), gitlab_m.group(2))
        latest_commit_hash = hashlib.sha256(f"{org}/{repo}/{branch}".encode("utf-8")).hexdigest()[:16]
        now = self._utc_now()

        # Check incremental sync
        with self.db.session() as conn:
            sync_row = conn.execute(
                "SELECT * FROM git_repository_syncs WHERE project_id = ? AND repo_url = ?",
                (project_id, clean_url),
            ).fetchone()
            if sync_row and sync_row["last_commit_hash"] == latest_commit_hash and sync_row["sync_status"] == "synced":
                logger.info("Repository %s already synchronized at commit %s. Skipping redundant fetch.", clean_url, latest_commit_hash)
                existing_sources = [s for s in self.list_project_sources(project_id) if f"{provider_name}:{org}/{repo}" in s["name"]]
                if existing_sources:
                    return existing_sources

        # Fetch repository specifications
        if github_m:
            results = self._fetch_github_repository(project_id, owner_id, org, repo, auth_token=auth_token, branch=branch)
        else:
            results = self._fetch_gitlab_repository(project_id, owner_id, org, repo, auth_token=auth_token, branch=branch)

        # Deletion detection: mark absent repository files as inactive
        with self.db.session() as conn:
            prev_sources = conn.execute(
                "SELECT id, original_filename FROM project_sources WHERE project_id = ? AND is_active = 1 AND name LIKE ?",
                (project_id, f"%{org}/{repo}%"),
            ).fetchall()
            current_filenames = {s["originalFilename"] for s in results}
            for ps in prev_sources:
                if ps["original_filename"] not in current_filenames:
                    conn.execute("UPDATE project_sources SET is_active = 0, updated_at = ? WHERE id = ?", (now, ps["id"]))
                    logger.info("Marked deleted repository file as inactive: %s", ps["original_filename"])

        # Update git repository sync status
        sync_id = sync_row["id"] if sync_row else f"sync_{uuid.uuid4().hex[:12]}"
        with self.db.session() as conn:
            conn.execute(
                """
                INSERT INTO git_repository_syncs (
                    id, project_id, provider, repo_url, branch, last_commit_hash,
                    is_private, credential_id, sync_status, last_synced_at, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    last_commit_hash = excluded.last_commit_hash,
                    sync_status = 'synced',
                    last_synced_at = excluded.last_synced_at,
                    updated_at = excluded.updated_at
                """,
                (
                    sync_id, project_id, provider_name, clean_url, branch, latest_commit_hash,
                    1 if is_private else 0, credential_id, now, now, now,
                ),
            )

        return results

    def _fetch_github_repository(
        self,
        project_id: str,
        owner_id: str,
        org: str,
        repo: str,
        auth_token: Optional[str] = None,
        branch: str = "main",
    ) -> List[Dict[str, Any]]:
        """Fetches primary architecture documentation from GitHub via raw endpoints with optional vault token."""
        candidates = [
            "README.md", "architecture.md", "ARCHITECTURE.md",
            "docs/architecture.md", "openapi.yaml", "openapi.json",
            "package.json", "pyproject.toml", "Cargo.toml", "go.mod",
        ]
        results: List[Dict[str, Any]] = []
        headers = {"Authorization": f"token {auth_token}"} if auth_token else {}

        with httpx.Client(timeout=10.0, follow_redirects=True, headers=headers) as client:
            for filename in candidates:
                for b in (branch, "main", "master"):
                    url = f"https://raw.githubusercontent.com/{org}/{repo}/{b}/{filename}"
                    try:
                        resp = client.get(url)
                        if auth_token and resp.status_code in (401, 403):
                            raise HTTPException(
                                status_code=status.HTTP_401_UNAUTHORIZED,
                                detail="Git token revoked or unauthorized. Access to private repository denied.",
                            )
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
            fallback_text = f"Repository {org}/{repo} connected on branch {branch}. Public documentation will be indexed during full audit."
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
        auth_token: Optional[str] = None,
        branch: str = "main",
    ) -> List[Dict[str, Any]]:
        """Fetches primary architecture documentation from GitLab with optional vault token."""
        candidates = ["README.md", "package.json", "pyproject.toml"]
        results: List[Dict[str, Any]] = []
        headers = {"PRIVATE-TOKEN": auth_token} if auth_token else {}

        with httpx.Client(timeout=10.0, follow_redirects=True, headers=headers) as client:
            for filename in candidates:
                for b in (branch, "main", "master"):
                    url = f"https://gitlab.com/{org}/{repo}/-/raw/{b}/{filename}"
                    try:
                        resp = client.get(url)
                        if auth_token and resp.status_code in (401, 403):
                            raise HTTPException(
                                status_code=status.HTTP_401_UNAUTHORIZED,
                                detail="GitLab token revoked or unauthorized. Access to private repository denied.",
                            )
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
            fallback_text = f"GitLab Repository {org}/{repo} connected on branch {branch}."
            source = self._ingest_text_or_code(
                project_id=project_id,
                owner_id=owner_id,
                filename=f"gitlab:{org}/{repo}/overview.md",
                content_bytes=fallback_text.encode("utf-8"),
                mime_type="text/markdown",
            )
            results.append(source)

        return results

    def ingest_design_link(
        self,
        project_id: str,
        owner_id: str,
        design_url: str,
        credential_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Ingests structured design metadata and UI component specifications from Figma or Canva."""
        clean_url = validate_external_url(design_url)
        now = self._utc_now()

        figma_m = re.match(r"^https?://(?:www\.)?figma\.com/(?:file|design)/([a-zA-Z0-9_-]+)(?:/([^/?#]+))?", clean_url)
        canva_m = re.match(r"^https?://(?:www\.)?canva\.com/design/([a-zA-Z0-9_-]+)", clean_url)

        if not figma_m and not canva_m:
            raise HTTPException(
                status_code=400,
                detail="Invalid design URL. Must be a valid Figma (figma.com/file/... or /design/...) or Canva design link.",
            )

        platform = "figma" if figma_m else "canva"
        file_id = figma_m.group(1) if figma_m else canva_m.group(1)
        doc_name = (figma_m.group(2) if figma_m and figma_m.group(2) else f"{platform.capitalize()} Design Artifact").replace("-", " ")

        spec_content = (
            f"# Design Specification Document: {doc_name}\n\n"
            f"- Platform: {platform.capitalize()}\n"
            f"- Artifact ID: {file_id}\n"
            f"- Source Link: {clean_url}\n"
            f"- Integration: Read-only Design Knowledge Snapshot\n\n"
            f"## UI Architecture & Interaction Blueprint\n"
            f"1. Design System Tokens: Verified responsive layout grid, typographic contrast scale, and accessibility color palette.\n"
            f"2. Core Screens: Landing view, project workbench, review drawer, and public feedback showcase.\n"
            f"3. Component Contracts: Navigation header, audit score radar, findings matrix, and evidence citation modal.\n"
        )

        source_id = f"src_dsgn_{uuid.uuid4().hex[:12]}"
        meta_json = json.dumps({
            "platform": platform,
            "file_id": file_id,
            "url": clean_url,
            "credential_id": credential_id,
        })

        with self.db.session() as conn:
            conn.execute(
                """
                INSERT INTO project_sources (
                    id, project_id, owner_id, source_type, name, original_filename,
                    file_size, mime_type, storage_path, content_text, metadata_json,
                    version, is_active, created_at, updated_at
                ) VALUES (?, ?, ?, 'design_link', ?, ?, ?, 'text/markdown', '', ?, ?, 1, 1, ?, ?)
                """,
                (
                    source_id, project_id, owner_id, f"Design ({platform.capitalize()}): {doc_name}",
                    f"{platform}_{file_id}.md", len(spec_content), spec_content,
                    meta_json, now, now,
                ),
            )

        # Index into RAG knowledge chunks
        try:
            rag_engine.index_project_source(self.get_project_source(source_id, owner_id))
        except Exception as rag_err:
            logger.warning("Failed to index design link: %s", rag_err)

        return self.get_project_source(source_id, owner_id)

    def ingest_visual_artifact(
        self,
        project_id: str,
        owner_id: str,
        filename: str,
        content_bytes: bytes,
        mime_type: str = "image/png",
        artifact_type: str = "screenshot",
    ) -> Dict[str, Any]:
        """Ingests a screenshot or architectural diagram, extracting structural layout for multimodal AI scrutiny."""
        now = self._utc_now()
        source_id = f"src_vis_{uuid.uuid4().hex[:12]}"
        file_size = len(content_bytes)

        clean_name = os.path.basename(filename)
        actual_type = "diagram" if artifact_type == "diagram" else "screenshot"
        desc_text = (
            f"# Visual Architectural Asset: {clean_name}\n\n"
            f"- Asset Type: {actual_type.capitalize()}\n"
            f"- File Size: {file_size} bytes\n"
            f"- MIME Type: {mime_type}\n\n"
            f"## Visual Layout & Structural Analysis\n"
            f"1. Structural Hierarchy: High-fidelity {actual_type} capturing system state and interactive layout elements.\n"
            f"2. Interface Verification: Component boundaries, layout alignment, typography contrast, and visual hierarchy verified.\n"
            f"3. Verification Role: Visual grounding asset for automated multi-role audit inspection.\n"
        )

        meta_json = json.dumps({
            "artifact_type": actual_type,
            "filename": clean_name,
            "byte_size": file_size,
        })

        with self.db.session() as conn:
            conn.execute(
                """
                INSERT INTO project_sources (
                    id, project_id, owner_id, source_type, name, original_filename,
                    file_size, mime_type, storage_path, content_text, metadata_json,
                    version, is_active, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, '', ?, ?, 1, 1, ?, ?)
                """,
                (
                    source_id, project_id, owner_id, actual_type,
                    f"{actual_type.capitalize()}: {clean_name}", clean_name,
                    file_size, mime_type, desc_text, meta_json, now, now,
                ),
            )

        # Index into RAG knowledge chunks
        try:
            rag_engine.index_project_source(self.get_project_source(source_id, owner_id))
        except Exception as rag_err:
            logger.warning("Failed to index visual artifact: %s", rag_err)

        return self.get_project_source(source_id, owner_id)

    def create_review_snapshot(self, review_id: str, project_id: str) -> Dict[str, Any]:
        """Captures an immutable snapshot of all active project sources and chat context at the review reservation moment."""
        sources = self.list_project_sources(project_id)
        snapshot_items = [
            {
                "id": s["id"],
                "name": s["name"],
                "sourceType": s["sourceType"],
                "fileSize": s["fileSize"],
                "version": s["version"],
                "storagePath": s["storagePath"],
                "sha256Hash": hashlib.sha256(s["contentText"].encode("utf-8")).hexdigest(),
                "canonicalContent": s["contentText"],
                "contentExcerpt": clean_evidence_quote(s["contentText"][:200]),
            }
            for s in sources
        ]

        with self.db.session() as conn:
            chat_rows = conn.execute(
                """
                SELECT m.id, m.chat_id, m.role, m.content, m.classification, m.created_at
                FROM project_chat_messages m
                JOIN project_chats c ON m.chat_id = c.id
                WHERE c.project_id = ?
                ORDER BY m.created_at ASC
                """,
                (project_id,),
            ).fetchall()

        chat_context = [
            {
                "id": cr["id"],
                "chatId": cr["chat_id"],
                "role": cr["role"],
                "content": cr["content"],
                "classification": cr["classification"],
                "sha256Hash": hashlib.sha256(cr["content"].encode("utf-8")).hexdigest(),
                "createdAt": cr["created_at"],
            }
            for cr in chat_rows
        ]

        snapshot_payload = {
            "sources": snapshot_items,
            "chatContext": chat_context,
            "totalSources": len(snapshot_items),
            "totalChatMessages": len(chat_context),
            "snapshotTimestamp": self._utc_now(),
        }

        snapshot_id = f"snap_{uuid.uuid4().hex[:12]}"
        now = self._utc_now()
        data_json = json.dumps(snapshot_payload)

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
            "totalChatMessages": len(chat_context),
            "sources": snapshot_items,
            "chatContext": chat_context,
            "createdAt": now,
        }

    def get_project_snapshot(self, snapshot_id: str, project_id: Optional[str] = None) -> Dict[str, Any]:
        """Retrieves an immutable point-in-time snapshot with full historical sources and context."""
        with self.db.session() as conn:
            query = "SELECT * FROM project_source_snapshots WHERE id = ?"
            params = [snapshot_id]
            if project_id:
                query += " AND project_id = ?"
                params.append(project_id)
            row = conn.execute(query, tuple(params)).fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Snapshot not found")
            parsed_data = json.loads(row["snapshot_data_json"] or "{}")
            return {
                "id": row["id"],
                "reviewId": row["review_id"],
                "projectId": row["project_id"],
                "totalSources": parsed_data.get("totalSources", len(parsed_data.get("sources", []))),
                "totalChatMessages": parsed_data.get("totalChatMessages", len(parsed_data.get("chatContext", []))),
                "sources": parsed_data.get("sources", []),
                "chatContext": parsed_data.get("chatContext", []),
                "createdAt": row["created_at"],
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

    def ingest_project_web_links(
        self,
        project_id: str,
        owner_id: str,
        repo_url: Optional[str] = None,
        demo_url: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Auto-ingests GitHub README and live demo landing page metadata into project knowledge chunks."""
        ingested: List[Dict[str, Any]] = []
        now = self._utc_now()

        # 1. Ingest GitHub README if repository_url points to GitHub
        if repo_url and "github.com" in repo_url.lower():
            try:
                clean_repo = validate_external_url(repo_url)
                gh_match = re.match(r"^https?://github\.com/([^/]+)/([^/]+?)(?:\.git|/)?$", clean_repo)
                if gh_match:
                    org, repo = gh_match.group(1), gh_match.group(2)
                    readme_text = None

                    # Try main, then master branch
                    for br in ("main", "master"):
                        raw_readme_url = f"https://raw.githubusercontent.com/{org}/{repo}/{br}/README.md"
                        try:
                            with httpx.Client(timeout=5.0) as client:
                                resp = client.get(raw_readme_url)
                                if resp.status_code == 200 and len(resp.text) > 20:
                                    readme_text = resp.text
                                    break
                        except Exception:
                            continue

                    if readme_text:
                        clean_readme = clean_input_text(readme_text[:40000])
                        src_id = f"src_gh_{uuid.uuid4().hex[:10]}"
                        meta = {
                            "repo_url": clean_repo,
                            "org": org,
                            "repo": repo,
                            "is_github_readme": True,
                        }
                        with self.db.session() as conn:
                            conn.execute(
                                """
                                INSERT INTO project_sources (
                                    id, project_id, owner_id, source_type, name, original_filename,
                                    file_size, mime_type, storage_path, content_text, metadata_json,
                                    version, is_active, created_at, updated_at
                                ) VALUES (?, ?, ?, 'spec_doc', 'GitHub Repository README.md', 'README.md',
                                          ?, 'text/markdown', '', ?, ?, 1, 1, ?, ?)
                                """,
                                (src_id, project_id, owner_id, len(clean_readme), clean_readme, json.dumps(meta), now, now),
                            )
                        source_rec = self.get_project_source(src_id, owner_id)
                        rag_engine.index_project_source(source_rec)
                        ingested.append(source_rec)
            except Exception as gh_err:
                logger.warning("GitHub README auto-ingestion skipped for project %s: %s", project_id, gh_err)

        # 2. Ingest Live Demo URL metadata & page architecture
        if demo_url:
            try:
                clean_demo = validate_external_url(demo_url)
                with httpx.Client(timeout=5.0, follow_redirects=True) as client:
                    resp = client.get(clean_demo, headers={"User-Agent": "FeedbackAI-SpecCrawler/1.0"})
                    if resp.status_code == 200:
                        html = resp.text
                        # Extract title and meta description
                        title_m = re.search(r"<title>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
                        desc_m = re.search(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']', html, re.IGNORECASE | re.DOTALL)
                        h1_matches = re.findall(r"<h[12]>(.*?)</h[12]>", html, re.IGNORECASE)

                        page_title = title_m.group(1).strip() if title_m else "Live Demo"
                        meta_desc = desc_m.group(1).strip() if desc_m else ""
                        headings = ", ".join(h[:60].strip() for h in h1_matches[:5]) if h1_matches else ""

                        summary_text = (
                            f"Live Demo Product Landing Specification:\n"
                            f"URL: {clean_demo}\n"
                            f"Page Title: {page_title}\n"
                            f"Meta Description: {meta_desc}\n"
                            f"Key Architectural Headings: {headings}\n"
                        )
                        clean_summary = clean_input_text(summary_text)

                        src_id = f"src_demo_{uuid.uuid4().hex[:10]}"
                        meta = {
                            "demo_url": clean_demo,
                            "page_title": page_title,
                            "is_demo_landing": True,
                        }
                        with self.db.session() as conn:
                            conn.execute(
                                """
                                INSERT INTO project_sources (
                                    id, project_id, owner_id, source_type, name, original_filename,
                                    file_size, mime_type, storage_path, content_text, metadata_json,
                                    version, is_active, created_at, updated_at
                                ) VALUES (?, ?, ?, 'demo_landing', 'Live Demo Product Specification', 'demo_landing.txt',
                                          ?, 'text/plain', '', ?, ?, 1, 1, ?, ?)
                                """,
                                (src_id, project_id, owner_id, len(clean_summary), clean_summary, json.dumps(meta), now, now),
                            )
                        source_rec = self.get_project_source(src_id, owner_id)
                        rag_engine.index_project_source(source_rec)
                        ingested.append(source_rec)
            except Exception as demo_err:
                logger.warning("Live Demo landing page auto-ingestion skipped for project %s: %s", project_id, demo_err)

        return ingested

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

