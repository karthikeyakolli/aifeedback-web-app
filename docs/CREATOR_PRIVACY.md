# Creator Privacy & Security Architecture

## Executive Overview

The **Creator Research Studio** is designed as a **strictly private workspace** for verified project creators. While community feedback is public, creator research sessions, prompt inquiries, hypothesis testing, and attached internal documents (PRDs, whitepapers, draft specs) contain sensitive intellectual property and strategic trade secrets.

This document outlines the privacy boundaries, authentication requirements, ownership verification layers, and non-author moderation isolation rules.

---

## 1. Public vs. Private Functional Boundaries

```
+-----------------------------------------------------------------------------------------+
| PUBLIC COMMUNITY ZONE (Accessible to all authenticated & visitor users)                |
| • Public Discussion Title & Description                                                 |
| • Threaded Community Comments & Replies                                                 |
| • Aggregate Upvote Counts & Category Explorer                                           |
| • Public Product Profile                                                                |
+-----------------------------------------------------------------------------------------+
                                      |
                                      | Strict Authorization Firewall
                                      | (isOwner verification & HTTP 403)
                                      v
+-----------------------------------------------------------------------------------------+
| PRIVATE CREATOR STUDIO ZONE (Owner-Only Access)                                         |
| • Attached Project Documents (PDFs, Markdown Specs, Architecture TXT)                   |
| • Document Previews & Full Extracted Text                                               |
| • Conversational Research Assistant Sessions & Chat Turns                               |
| • Custom PRD Drafts, Generated Briefs, and Strategic Hypotheses                         |
| • Document Inclusion/Exclusion Retrieval Filters                                        |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Strict Project Ownership Verification

Every route interacting with private creator resources enforces ownership at both the UI entry points and the backend database layer:

### Frontend Entry Points
1. **Discussion Detail Page (`PostDetailPage.tsx`)**:
   - `isOwner = Boolean(user && post?.author?.id && user.id === post.author.id)`
   - The "Creator Research Studio" dock banner and tab header are rendered **only if `isOwner === true`**.
   - If an unauthorized visitor or non-author navigates directly to `?tab=insights`, the page immediately resets to `?tab=discussion`.
2. **My Activity Dashboard (`MyActivityPage.tsx`)**:
   - Lists only posts authored by the authenticated user with direct studio launch buttons.
3. **Product Detail Page (`ProductDetailPage.tsx`)**:
   - Only displays the private research studio banner if the logged-in user is the verified creator.

### Backend Verification (`backend/app/api/v1/posts.py`)
```python
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
```

---

## 3. Non-Author Moderator Access Isolation

A critical security principle established in Phase 3:
> **"Moderator access must not automatically expose private documents or strategic research."**

### Why Non-Author Moderators Are Excluded from Studio Documents:
1. **Separation of Moderation vs. Strategy**: Community moderators are responsible for enforcing community standards on public posts and public comments. They do not have legal or strategic authority to inspect an organization's proprietary PRDs or confidential roadmaps.
2. **Targeted Privilege**: `is_moderator` privileges apply strictly to moderation actions (`lock_post`, `hide_comment`, `resolve_report`). They are explicitly blocked from:
   - `GET /api/v1/posts/{post_id}/documents` -> Returns `403 Forbidden`
   - `POST /api/v1/posts/{post_id}/documents` -> Returns `403 Forbidden`
   - `GET /api/v1/posts/{post_id}/documents/{doc_id}` -> Returns `403 Forbidden`
   - `DELETE /api/v1/posts/{post_id}/documents/{doc_id}` -> Returns `403 Forbidden`
   - `GET /api/v1/ai/{post_id}/chat/sessions` -> Returns only sessions owned by that user

---

## 4. Contributor Privacy in Research Citations

When community feedback is retrieved into conversational research turns:
- **Anonymous Reviews**: If a community reviewer selected `isAnonymous=True`, their real profile username and avatar are stripped before being returned to the assistant.
- In both chat citations and the Evidence Inspector, anonymous contributors are rendered as `Anonymous Contributor` with a masked shield icon.
- This ensures creators receive the objective value of the feedback without unmasking contributors who requested anonymity.

---

## 5. Row-Level Security (RLS) & Relational Integrity

- In Supabase PostgreSQL, the `post_documents`, `conversation_sessions`, and `research_reports` tables have active Row Level Security (RLS) policies:
  - `SELECT`, `INSERT`, `UPDATE`, `DELETE` operations are restricted by `auth.uid() = owner_id`.
  - Service role keys are never exposed on client-facing routes.
- Deletions are atomic and bounded: deleting a document removes it from future retrieval candidate pools without leaving orphan vector embeddings or broken citations in historical messages.

