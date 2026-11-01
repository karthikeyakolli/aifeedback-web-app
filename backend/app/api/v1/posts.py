"""Posts and feed endpoints with full persistence and authorization."""

from __future__ import annotations

import io
import pypdf
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status, UploadFile, File
from backend.app.schemas.post import (
    PostResponse,
    PostCreate,
    PostUpdate,
    PostVoteResponse,
    PostBookmarkResponse,
    PostDocumentResponse,
)
from backend.app.services.auth_service import (
    get_current_user_required,
    get_current_user_optional,
)
from backend.app.db.repository import community_repo

router = APIRouter(prefix="/posts", tags=["Posts"])


@router.get("", response_model=List[PostResponse])
async def list_posts(
    category: Optional[str] = Query(None, description="Filter by category"),
    tag: Optional[str] = Query(None, description="Filter by topic tag"),
    sort: str = Query("trending", description="Sort by trending, recent, or comments"),
    search: Optional[str] = Query(None, description="Search keyword in title or description"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user: Optional[Dict[str, Any]] = Depends(get_current_user_optional),
) -> List[PostResponse]:
    """Retrieves published posts for community discovery with pagination and filters."""
    current_user_id = user["sub"] if user else None
    posts = community_repo.list_posts(
        category=category,
        tag=tag,
        sort=sort,
        search=search,
        limit=limit,
        offset=offset,
        current_user_id=current_user_id,
    )
    return [PostResponse(**p) for p in posts]


@router.get("/saved", response_model=List[PostResponse])
async def get_saved_posts(
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> List[PostResponse]:
    """Retrieves the authenticated user's bookmarked posts."""
    posts = community_repo.list_saved_posts(user_id=user["sub"])
    return [PostResponse(**p) for p in posts]


@router.get("/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: str,
    user: Optional[Dict[str, Any]] = Depends(get_current_user_optional),
) -> PostResponse:
    """Retrieves a single published post with serialized author and engagement status."""
    current_user_id = user["sub"] if user else None
    post = community_repo.get_post(post_id, current_user_id=current_user_id)
    return PostResponse(**post)


@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    payload: PostCreate,
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> PostResponse:
    """Publishes a new review request. Requires authenticated account."""
    data = payload.model_dump()
    post = community_repo.create_post(author_id=user["sub"], data=data)
    return PostResponse(**post)


@router.put("/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: str,
    payload: PostUpdate,
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> PostResponse:
    """Updates an owned post. Author identity is verified on the backend."""
    data = payload.model_dump(exclude_unset=True)
    post = community_repo.update_post(post_id=post_id, author_id=user["sub"], data=data)
    return PostResponse(**post)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: str,
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> None:
    """Deletes an owned post. Author identity is verified on the backend."""
    community_repo.delete_post(post_id=post_id, author_id=user["sub"])


@router.post("/{post_id}/vote", response_model=PostVoteResponse)
async def vote_post(
    post_id: str,
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> PostVoteResponse:
    """Toggles upvote on a post. Database uniqueness prevents duplicate votes."""
    result = community_repo.toggle_post_vote(post_id=post_id, user_id=user["sub"], vote_type=1)
    return PostVoteResponse(**result)


@router.post("/{post_id}/bookmark", response_model=PostBookmarkResponse)
async def bookmark_post(
    post_id: str,
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> PostBookmarkResponse:
    """Toggles bookmark on a post."""
    result = community_repo.toggle_bookmark(post_id=post_id, user_id=user["sub"])
    return PostBookmarkResponse(**result)


# -----------------------------------------------------------------------------
# Creator Personal Workspace: Project Documentation Management
# -----------------------------------------------------------------------------
MAX_DOCUMENT_SIZE = 10 * 1024 * 1024  # 10 MB limit


def _verify_post_creator(post_id: str, user_id: str) -> None:
    """Validates that the requesting user is the verified project creator/owner.

    Per Phase 3 access and privacy rules: Creator Research Studio and private
    documents are strictly isolated to the verified owner. Non-author moderators
    must not automatically access private strategic documents or studio endpoints.
    """
    post = community_repo.get_post(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Discussion post not found.")

    is_author = post.get("author", {}).get("id") == user_id
    if not is_author:
        with community_repo.db.session() as conn:
            raw = conn.execute("SELECT author_id FROM posts WHERE id = ?", (post_id,)).fetchone()
            if raw and raw["author_id"] == user_id:
                is_author = True

    if not is_author:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden. Only the verified project owner can access private studio documents and research.",
        )


@router.get("/{post_id}/documents", response_model=List[PostDocumentResponse])
async def list_post_documents(
    post_id: str,
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> List[PostDocumentResponse]:
    """Lists project documentation attached to the discussion by the creator."""
    _verify_post_creator(post_id, user["sub"])
    docs = community_repo.list_post_documents(post_id)
    return [PostDocumentResponse(**d) for d in docs]


@router.get("/{post_id}/documents/{doc_id}", response_model=PostDocumentResponse)
async def get_post_document(
    post_id: str,
    doc_id: str,
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> PostDocumentResponse:
    """Retrieves full metadata and extracted text content of an attached project document."""
    _verify_post_creator(post_id, user["sub"])
    doc = community_repo.get_post_document(doc_id, user["sub"])
    return PostDocumentResponse(**doc)


@router.post("/{post_id}/documents", response_model=PostDocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_post_document(
    post_id: str,
    file: UploadFile = File(...),
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> PostDocumentResponse:
    """Uploads a PDF, Markdown, or text document to ground AI research alongside community feedback."""
    _verify_post_creator(post_id, user["sub"])

    filename = file.filename or "uploaded_document.txt"
    lower_name = filename.lower()
    allowed_exts = (".pdf", ".md", ".txt")
    if not any(lower_name.endswith(ext) for ext in allowed_exts):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported document format. Allowed file types: .pdf, .md, .txt",
        )

    content_bytes = await file.read()
    if len(content_bytes) > MAX_DOCUMENT_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of {MAX_DOCUMENT_SIZE // (1024 * 1024)} MB.",
        )

    # Extract text content preserving genuine page boundaries for PDFs
    if lower_name.endswith(".pdf"):
        try:
            reader = pypdf.PdfReader(io.BytesIO(content_bytes))
            pages_text = []
            for i, page in enumerate(reader.pages):
                extracted = page.extract_text()
                if extracted and extracted.strip():
                    pages_text.append(f"--- [Page {i + 1}] ---\n{extracted.strip()}")
            content_text = "\n\n".join(pages_text).strip()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to parse PDF document: {str(e)}",
            )
    else:
        try:
            content_text = content_bytes.decode("utf-8").strip()
        except UnicodeDecodeError:
            content_text = content_bytes.decode("latin-1", errors="ignore").strip()

    if len(content_text) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document text is empty or could not be extracted.",
        )

    file_type = "pdf" if lower_name.endswith(".pdf") else ("markdown" if lower_name.endswith(".md") else "text")

    doc = community_repo.add_post_document(
        post_id=post_id,
        owner_id=user["sub"],
        filename=filename,
        file_type=file_type,
        file_size=len(content_bytes),
        content_text=content_text,
    )
    return PostDocumentResponse(**doc)


@router.delete("/{post_id}/documents/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post_document(
    post_id: str,
    doc_id: str,
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> None:
    """Deletes an attached project document with verified creator ownership."""
    _verify_post_creator(post_id, user["sub"])
    community_repo.delete_post_document(doc_id, user["sub"])

