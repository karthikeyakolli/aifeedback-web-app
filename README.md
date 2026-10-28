# Product Research Intelligence

> **Anonymous Feedback Community with AI-Powered Research Intelligence**  
> *A community-driven product review and feedback platform with evidence-backed AI synthesis.*

---

## 1. Project Overview

**Product Research Intelligence** enables creators (founders, engineers, designers, students) to publish products, apps, websites, ideas, and review requests. Community members participate through anonymous reviews, problem reports, constructive critiques, threaded discussions, and upvotes.

An integrated AI research assistant analyzes authentic community feedback to extract recurring themes, categorize feedback (complaints, praise, feature requests, friction), highlight community disagreements, and suggest evidence-grounded validation steps.

### Core Philosophy
- **Community contributions are the ground truth.**
- **AI is the research copilot, never the source of truth.**
- **Every finding links directly to verifiable comment citations.**
- **Anonymous participation is cryptographically shielded from public feeds.**

---

## 2. Monorepo Project Structure

```
ai web application/
├── references/                       # Local Git clones of 6 architectural reference repos (ignored from git)
├── supabase/                         # Supabase configuration & database migrations
│   └── migrations/
│       └── 00001_initial_community_schema.sql  # Canonical PostgreSQL RLS migration
├── docs/                             # Architecture & Roadmap Documentation
│   ├── MASTER_PLAN.md                # Vision, principles, and technology stack
│   ├── ARCHITECTURE.md               # Tier boundaries, Supabase schema, privacy
│   ├── PHASES.md                     # Five sequential phases and acceptance gates
│   ├── REFERENCE_REPOS.md            # Inventory, commit SHAs, licenses of 6 reference repos
│   └── IMPLEMENTATION_STATUS.md      # Active phase checklist and audit log
├── backend/                          # FastAPI Application
│   ├── app/
│   │   ├── config.py                 # Pydantic Settings
│   │   ├── main.py                   # FastAPI app, CORS, error handling
│   │   ├── db/
│   │   │   ├── connection.py         # Relational database manager (SQLite WAL / Postgres)
│   │   │   └── repository.py         # Relational repository with strict anonymity masking
│   │   ├── services/
│   │   │   └── auth_service.py       # PBKDF2 password hashing & JWT token verification
│   │   ├── api/v1/                   # Versioned REST API endpoints
│   │   │   ├── health.py             # Health check endpoints
│   │   │   ├── auth.py               # Authentication (/auth/signup, /login, /me, /logout)
│   │   │   ├── posts.py              # Posts router (CRUD, voting, bookmarks)
│   │   │   ├── comments.py           # Comments router (Threaded replies, voting)
│   │   │   ├── reports.py            # Moderation reports router
│   │   │   ├── users.py              # User public profile router (privacy enforced)
│   │   │   ├── ai.py                 # AI research router (Phase 3 stub)
│   │   │   └── router.py             # Route aggregator
│   │   └── schemas/                  # Pydantic v2 schemas
│   │       ├── health.py
│   │       ├── auth.py
│   │       ├── post.py
│   │       ├── comment.py
│   │       ├── report.py
│   │       └── ai.py
│   └── tests/
│       ├── test_health.py            # Health and middleware tests
│       └── test_auth_and_community.py# 12 comprehensive Phase 2 backend tests
├── frontend/                         # React 18 + TypeScript + Vite SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/               # Badge, Button, Card, EmptyState
│   │   │   ├── layout/               # Navbar, MobileNav, Footer, AppLayout
│   │   │   ├── feed/                 # PostCard, CategoryFilter, FeedTabs
│   │   │   ├── discussion/           # CommentComposer, CommentThread (recursive)
│   │   │   ├── insights/             # AIInsightsView (Transparent Phase 2 status)
│   │   │   └── auth/                 # AuthModal (Sign in, Sign up, 1-click Demo)
│   │   ├── context/                  # ThemeContext, AuthContext (JWT session management)
│   │   ├── pages/                    # 8 Application page routes
│   │   │   ├── HomePage.tsx          # Real persistent feed with filters & sort
│   │   │   ├── ExplorePage.tsx       # Keyword search & topic tag explorer
│   │   │   ├── CreatePostPage.tsx    # Review request composer with anonymity toggle
│   │   │   ├── PostDetailPage.tsx    # Post review, threaded replies, reporting, tabs
│   │   │   ├── SavedPostsPage.tsx    # Bookmarked discussions
│   │   │   ├── MyActivityPage.tsx    # User's contributions & privacy notice
│   │   │   ├── SettingsPage.tsx      # Theme preferences, sign out, system status
│   │   │   └── NotFoundPage.tsx      # 404 handler
│   │   ├── services/
│   │   │   └── api.ts                # Real typed HTTP client with Bearer token injection
│   │   └── types/                    # TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts                # Tailwind v4 plugin + API proxy
├── .env.example                      # Safe placeholder environment configuration
├── .gitignore                        # Secret and reference exclusion rules
└── README.md                         # This file
```

---

## 3. Local Development Quickstart

### Prerequisites
- **Node.js**: v20+ (Verified on v26.8.1)
- **Python**: v3.11+ (Verified on v3.12.10)
- **Windows**: Run npm commands via `npm.cmd`

### 3.1 Backend Setup (FastAPI)
```powershell
# Navigate to project root
# Activate virtual environment
& "..\ai feedback project\.venv\Scripts\Activate.ps1"

# Run FastAPI development server
& "..\ai feedback project\.venv\Scripts\python.exe" -m uvicorn backend.app.main:app --reload --port 8000
```
- Health Check: `http://localhost:8000/api/health`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`
- Default Database: Stored locally in `data/product_intelligence.db` (auto-seeded with initial creators and review discussions).

### 3.2 Frontend Setup (React + Vite)
```powershell
# Navigate to frontend directory
cd frontend

# Run Vite dev server
npm.cmd run dev
```
- Web Application: `http://localhost:5173`
- The Vite dev server automatically proxies `/api` calls directly to `http://127.0.0.1:8000`.

### 3.3 Supabase Production Migration
When deploying to Supabase PostgreSQL:
1. Create a Supabase project.
2. Run SQL script: `supabase/migrations/00001_initial_community_schema.sql` via Supabase SQL Editor.
3. Configure environment variables in `.env`:
   ```bash
   SUPABASE_URL=https://<your-project-id>.supabase.co
   SUPABASE_ANON_KEY=<your-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   ```

---

## 4. Verification & Testing

### Running Backend Tests (Phase 1 & Phase 2)
```powershell
& "..\ai feedback project\.venv\Scripts\python.exe" -m pytest backend/tests -v
```
*Result: 17 passed in 1.27s (100% green).*

### Running Frontend Typecheck & Build
```powershell
cd frontend
npm.cmd run build
```
*Result: 1,990 modules transformed, 0 errors, built in ~520ms.*

### Running Baseline Capstone Regression Check
```powershell
& "..\ai feedback project\.venv\Scripts\python.exe" -m pytest "..\ai feedback project" -q
```
*Result: 157 passed, 2 warnings in 34.45s (100% green).*

---

## 5. Security & Privacy Guarantees

1. **Anonymous Contributor Shielding**: When `isAnonymous` is enabled on posts or comments:
   - Public JSON responses serialize `author.id` as `null` and set `displayName` to `"Anonymous Contributor"` or `"Anonymous Reviewer"`.
   - The creator's public profile (`/users/{id}/profile`) strictly excludes their anonymous posts.
   - Internal database foreign keys retain author relationships exclusively for authorized edits and moderation.
2. **Atomic Upvote Uniqueness**: Enforced via database constraints (`UNIQUE(post_id, user_id)` and `UNIQUE(comment_id, user_id)`). Upvoting toggles between upvoted and unvoted states without race conditions or duplicates.
3. **Server-Side Authorization**: Updates and deletions verify the verified JWT user identity against the database record. Non-authors are rejected with HTTP 403 Forbidden.
4. **Isolated References**: The 6 cloned GitHub reference repositories in `references/` are excluded from the main application's Git repository via `.gitignore` and are never imported at runtime.
