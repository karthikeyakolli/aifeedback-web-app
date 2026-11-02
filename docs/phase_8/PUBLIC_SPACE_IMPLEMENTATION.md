# Phase 8: Public Space Technical Implementation

## 1. Database Schema Additions
In `backend/app/db/connection.py`, the `project_upvotes` table was introduced to handle community appreciation idempotently:

```sql
CREATE TABLE IF NOT EXISTS project_upvotes (
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    PRIMARY KEY (project_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_project_upvotes_proj ON project_upvotes(project_id);
CREATE INDEX IF NOT EXISTS idx_project_upvotes_user ON project_upvotes(user_id);
```

---

## 2. Backend API Endpoints
Implemented in `backend/app/api/v1/projects.py`:

### `GET /api/v1/projects/public`
- **Authentication**: None (Anonymous / Public)
- **Parameters**: `category` (optional), `search` (optional), `limit` (default: 50), `offset` (default: 0)
- **Response**: `List[PublicProjectRead]`
- **Behavior**: Retrieves only records where `is_public = 1`. Uses case-insensitive category matching and keyword substring searches.

### `GET /api/v1/projects/public/{project_id}`
- **Authentication**: None (Anonymous / Public)
- **Response**: `PublicProjectRead`
- **Behavior**: Retrieves single project with `is_public = 1`. Returns `404 Not Found` if private or nonexistent.

### `GET /api/v1/projects/public/{project_id}/report`
- **Authentication**: None (Anonymous / Public)
- **Response**: `FeedbackReportRead` or `None`
- **Behavior**: Retrieves latest feedback report for public project. Returns `404 Not Found` if project is private.

### `POST /api/v1/projects/public/{project_id}/upvote`
- **Authentication**: Required (`Depends(get_current_user_profile)`)
- **Response**: `PublicUpvoteResponse` (`projectId`, `upvotesCount`, `hasUpvoted`)
- **Behavior**: Atomically toggles upvote for authenticated user. If already upvoted, removes vote and decrements count. If not, adds vote and increments count.

---

## 3. Frontend Architecture & Components

1. **`PublicProjectCard.tsx` (`frontend/src/components/public/PublicProjectCard.tsx`)**:
   - Renders published projects on the Explore grid.
   - Dynamic gradients based on project title.
   - Upvote button with optimistic UI updates and unauthenticated login interception.
   - Direct link to technical inspection and review findings.

2. **`PublicProjectDetailPage.tsx` (`frontend/src/pages/public/PublicProjectDetailPage.tsx`)**:
   - Route: `/public/projects/:id`.
   - Fetches public project and public feedback report.
   - Clean 404 handler for revoked or private projects.
   - Comprehensive scrutiny layout:
     - Architecture specs
     - Finding severity metrics (Blockers, High, Medium, Low)
     - Executive summary and strengths
     - Filterable findings list with evidence quotes and actionable recommendations.

3. **`ExplorePage.tsx` (`frontend/src/pages/ExplorePage.tsx`)**:
   - Unified discovery page with tab switcher: "Public Projects" (primary) and "Community Discussions".
   - Category filtering and live search query bar.
   - Sorting by Popular (upvotes), Most Reviews, and Recent.

4. **`ProjectSetupPage.tsx` (`frontend/src/pages/personal/ProjectSetupPage.tsx`)**:
   - Visibility control tab with accessible confirmation modals:
     - **Publish Modal**: Explains data that will be shared publicly and emphasizes zero personal data leakage.
     - **Revoke Modal**: Explains immediate removal and that direct links will return 404 Not Found.

