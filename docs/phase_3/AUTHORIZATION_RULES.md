# Phase 3 — Authorization & Resource Ownership Rules

**Status**: IMPLEMENTED & VERIFIED  
**Security Architect**: Senior Full-Stack Architect & Security Engineer  
**Date**: November 2, 2026  
**Scope**: Server-Side Access Control, Ownership Guards, Space Isolation, Role-Based Access & Tampering Defense  

---

## 1. Core Authorization Principles

1. **Frontend Guards are NOT Security Boundaries**:
   - Client-side `<ProtectedRoute />` components exist solely to improve UX by preventing broken interface states and smoothly routing unauthenticated users to `/login`.
   - Every single sensitive operation is verified server-side on the FastAPI API layer using cryptographic token claim verification and relational ownership lookups.
2. **Explicit Deny by Default**:
   - Any resource not explicitly designated as public (`is_public = TRUE` or `1`) is strictly private to the authenticated creator who created it.
3. **Zero-Trust Identity Extraction**:
   - Injected `user_id`, `userId`, or `authorId` fields in client JSON request payloads are completely ignored. Caller identity is derived exclusively from the cryptographically verified `sub` claim of the `Authorization: Bearer <token>` header.

---

## 2. Resource Authorization Matrix

| Resource / Endpoint | HTTP Method | Access Rule | Unauthenticated Outcome | Unauthorized Caller Outcome |
|---|---|---|---|---|
| `POST /api/v1/projects` | `POST` | Authenticated user | `401 Unauthorized` | N/A |
| `GET /api/v1/projects/personal` | `GET` | Authenticated owner only (`WHERE user_id = sub`) | `401 Unauthorized` | Filtered strictly to caller's records |
| `GET /api/v1/projects/public` | `GET` | Anyone (Public explore feed) | `200 OK` (Only public items) | `200 OK` (Only public items) |
| `GET /api/v1/projects/{id}` | `GET` | Public if `is_public=1`, else Owner only | `403 Forbidden` if private | `403 Forbidden` if private |
| `PATCH /api/v1/projects/{id}` | `PATCH` | Owner only (`row.user_id == sub`) | `401 Unauthorized` | `403 Forbidden` |
| `DELETE /api/v1/projects/{id}` | `DELETE` | Owner only (`row.user_id == sub`) | `401 Unauthorized` | `403 Forbidden` |
| `PATCH /api/v1/findings/{id}/status` | `PATCH` | Project Owner only | `401 Unauthorized` | `403 Forbidden` |
| `GET /api/v1/moderation/reports` | `GET` | Staff / Moderator role only | `401 Unauthorized` | `403 Forbidden` |

---

## 3. Server-Side Ownership Enforcement Implementation

In `backend/app/db/project_repository.py`, every single mutation and private read directly validates ownership against the database:

```python
def update_project(self, project_id: str, user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    with self.db.session() as conn:
        row = conn.execute(
            "SELECT user_id FROM projects WHERE id = ?", (project_id,)
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Project not found")
        # Strict ownership validation
        if row["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Permission denied")
        ...
```

And in `get_project`:
```python
def get_project(self, project_id: str, requesting_user_id: Optional[str] = None) -> Dict[str, Any]:
    with self.db.session() as conn:
        row = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Project not found")
        # Row Level Security Guard: Visible only if public or caller is owner
        if not row["is_public"] and row["user_id"] != requesting_user_id:
            raise HTTPException(
                status_code=403,
                detail="Access denied: This project is private",
            )
        return self._serialize_project(row)
```

---

## 4. Space Isolation & Data Protection

The platform guarantees strict isolation between spaces:

```mermaid
graph LR
    subgraph ClientSpaceLens ["Client Space Selection Lens"]
        SP_Pub[Public Space]
        SP_Per[Personal Space]
        SP_Cre[Creator Space]
    end

    subgraph DataBoundaries ["Server Relational Data Boundaries"]
        DB_Pub[Public Database Records\n(WHERE is_public = 1)]
        DB_Priv[Private Personal Records\n(WHERE user_id = sub AND is_public = 0)]
    end

    SP_Pub -->|Requests Public Feed| DB_Pub
    SP_Per -->|Requests Personal Vault| DB_Priv
    SP_Cre -->|Requests Owned Studio Data| DB_Priv
    SP_Pub -. BLOCKED: Cannot access .-x DB_Priv
```

1. **Switching Spaces NEVER Mutates Ownership**:
   - Toggling the UI space selector simply updates client filter context and routing. It never modifies database records or changes `is_public` flags.
2. **Publishing Requires Explicit Intent**:
   - Projects are created with `is_public = False` and `status = 'draft'`.
   - A project can only be published to Public Space via an explicit `PATCH /api/v1/projects/{id}` call from the verified owner with `{"is_public": true}`.
3. **No Information Leaks in Error Responses**:
   - Unauthorized attempts to access private projects return a generic `403 Forbidden` ("Access denied: This project is private") without returning project names, categories, or author metadata.

---

## 5. Security Test Suite Verification Evidence

All authorization rules are verified in `backend/tests/test_phase_3_security_and_auth.py`:
- `test_unauthenticated_protected_route_rejection`: **PASSED** (all 5 sensitive endpoints reject without token).
- `test_cross_user_unauthorized_access_and_mutation`: **PASSED** (User B cannot read, edit, or delete User A's private project).
- `test_space_isolation_and_leakage_prevention`: **PASSED** (Private project never appears in public feed; publishing works with explicit patch; non-owner still blocked from mutating).
- `test_identity_spoofing_immunity`: **PASSED** (Payloads with spoofed `user_id` are ignored and bound to caller's verified JWT identity).

