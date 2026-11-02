# Phase 9: Creator Permissions & Security Boundaries

## 1. Security Matrix

| Action / Resource | Visitor (Anonymous) | Authenticated Other User | Project Owner (Creator) | Staff / Moderator |
| :--- | :--- | :--- | :--- | :--- |
| **View Creator Studio (`/creator`)** | `401 Unauthorized` | Views their own studio only | Allowed | Allowed (their own) |
| **Edit Creator Profile (`PATCH /creator/profile`)** | `401 Unauthorized` | Edits their own profile only | Allowed | Allowed (their own) |
| **Publish Project (`POST /creator/projects/{id}/publish`)** | `401 Unauthorized` | `403 Forbidden` | Allowed | `403 Forbidden` (unless owner) |
| **Revoke Project (`POST /creator/projects/{id}/unpublish`)** | `401 Unauthorized` | `403 Forbidden` | Allowed | Allowed (moderation override) |
| **View Public Maker Profile (`/creators/:username`)** | Allowed (Public Projection) | Allowed (Public Projection) | Allowed (Public Projection) | Allowed (Public Projection) |
| **View Private Project in Maker Profile** | **STRICTLY BLOCKED (Omitted)** | **STRICTLY BLOCKED (Omitted)** | **STRICTLY BLOCKED (Omitted)** | **STRICTLY BLOCKED (Omitted)** |

---

## 2. Inviolable Security Rules

1. **Space Switching Invariant**:
   - Switching navigation context to Creator space (`/creator`) **NEVER** silently alters project permissions or automatically publishes draft projects.
2. **Strict Ownership Validation**:
   - The backend checks `WHERE id = ? AND user_id = ?` for every publish, unpublish, and update operation.
   - Any attempt by User B to publish or revoke User A's project returns an immediate `403 Forbidden`.
3. **Quarantine of Private Projects on Public Profiles**:
   - The endpoint `GET /api/v1/creators/{username}` runs `SELECT * FROM projects WHERE user_id = ? AND is_public = 1`.
   - Projects with `is_public = 0` are completely excluded from the query, preventing private project exposure.
4. **Credential Isolation**:
   - Creator's email address, password hash, and raw LLM telemetry are permanently quarantined on the server.

