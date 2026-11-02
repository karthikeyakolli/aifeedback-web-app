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
│       ├── 00001_initial_community_schema.sql         # Canonical PostgreSQL RLS migration
│       ├── 00002_harden_rls_and_voting_policies.sql   # RLS hardening, vote updates, user sync trigger
│       └── 00003_analysis_runs_persistence.sql        # Analysis runs persistence, RLS & performance indexes
├── docs/                             # Architecture & Roadmap Documentation
│   ├── MASTER_PLAN.md                # Vision, principles, and technology stack
│   ├── ARCHITECTURE.md               # Tier boundaries, Supabase schema, privacy
│   ├── PHASES.md                     # Sequential phases and acceptance gates
│   ├── REFERENCE_REPOS.md            # Inventory, commit SHAs, licenses of 6 reference repos
│   ├── IMPLEMENTATION_STATUS.md      # Active phase checklist and audit log
│   ├── PHASE_2_1_VERIFICATION_REPORT.md # Verification, security audit & reconciliation report
│   └── PHASE_3_IMPLEMENTATION_REPORT.md # Phase 3 Gemini analysis engine audit report
├── backend/                          # FastAPI Application
│   ├── app/
│   │   ├── config.py                 # Pydantic Settings (auth_provider, gemini_api_key, gemini_model)
│   │   ├── main.py                   # FastAPI app, CORS, request size limit (2MB), error handlers
│   │   ├── db/
│   │   │   ├── connection.py         # Database manager (PostgreSQL production / SQLite WAL test adapter)
│   │   │   └── repository.py         # Relational repository with strict anonymity masking
│   │   ├── services/
│   │   │   ├── auth_service.py       # Dual-mode Supabase JWT verification & local test adapter
│   │   │   ├── gemini_service.py     # Official Google Gen AI SDK adapter (gemini-3.8-flash)
│   │   │   ├── analysis_service.py   # Deterministic grounding, citation verification & stale detection
│   │   │   ├── retrieval_service.py  # Scoped hybrid BM25 RAG engine & conversational query expansion
│   │   │   ├── suggestion_service.py # Deterministic prioritization scoring engine (P0-P3)
│   │   │   └── chat_service.py       # Multi-turn conversational research assistant & persistence coordinator
│   │   ├── api/v1/                   # Versioned REST API endpoints
│   │   │   ├── health.py             # Health check endpoints
│   │   │   ├── auth.py               # Authentication (/auth/config, /signup, /login, /me, /logout)
│   │   │   ├── posts.py              # Posts router (CRUD, voting, bookmarks, URL validation)
│   │   │   ├── comments.py           # Comments router (Threaded replies, voting)
│   │   │   ├── reports.py            # Moderation reports router (Moderator restricted)
│   │   │   ├── users.py              # User public profile router (privacy enforced)
│   │   │   ├── ai.py                 # AI research router (insights, analysis, chat sessions, messages, suggestions)
│   │   │   └── router.py             # Route aggregator
│   │   └── schemas/                  # Pydantic v2 schemas (dual camelCase/snake_case)
│   └── tests/
│       ├── test_health.py            # Health and middleware tests
│       ├── test_auth_and_community.py# Community CRUD, ownership, and voting tests
│       ├── test_phase_2_1_reconciliation.py # Supabase JWT, anonymous privacy, report security tests
│       ├── test_phase_3_analysis.py  # Gemini provider, citation validation, prompt injection & persistence tests
│       └── test_phase_4_chat_and_rag.py # Hybrid RAG, conversational follow-ups, deterministic scoring, ownership tests

├── frontend/                         # React 19 + TypeScript + Vite SPA
│   ├── src/
│   │   ├── components/               # UI components (common, layout, feed, discussion, auth)
│   │   ├── context/                  # ThemeContext, AuthContext (Supabase Auth + Local fallback)
│   │   ├── pages/                    # 8 Application page routes
│   │   ├── services/
│   │   │   ├── api.ts                # Typed HTTP client with Bearer token injection
│   │   │   └── supabase.ts           # Official Supabase client (@supabase/supabase-js)
│   │   └── types/                    # TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts                # Tailwind v4 plugin + API proxy
├── .env.example                      # Safe placeholder environment configuration
├── .gitignore                        # Secret and reference exclusion rules
└── README.md                         # This file
```

---

## 3. Reconciled Architecture & Environment Modes

| Layer | Canonical Production Stack | Local / Automated Test Mode | Security Guard |
|---|---|---|---|
| **Authentication** | **Supabase Auth** (`@supabase/supabase-js`, GoTrue JWTs, HS256 verification) | Local PBKDF2 + JWT test adapter | `ENVIRONMENT=production` rejects `local` auth with `RuntimeError`. |
| **Database** | **Supabase PostgreSQL** via `DATABASE_URL` with Row-Level Security (RLS) | **SQLite in WAL mode** (`PRAGMA foreign_keys = ON;`) | Database uniqueness constraints match in both engines. |
| **Migrations** | `supabase/migrations/00001_*.sql` and `00002_*.sql` | Executed idempotently | Non-destructive schema evolution. |
| **Authorization** | FastAPI server-side verification + Supabase RLS | FastAPI server-side verification | Backend verifies token claims (`sub`); browser IDs cannot override. |

---

## 4. Local Development Quickstart

### Prerequisites
- **Node.js**: v20+ (Verified on v26.8.1)
- **Python**: v3.11+ (Verified on v3.12.10)
- **Windows**: Run npm commands via `npm.cmd`

### 4.1 Backend Setup (FastAPI)
```powershell
# Navigate to project root
# Run FastAPI development server with auto-reload factory
python -m uvicorn backend.app.main:create_application --factory --reload --port 8000
```
- Health Check: `http://localhost:8000/api/v1/health`
- Developer Health Telemetry: `http://localhost:8000/api/v1/dev/health`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`
- Default Database: Stored locally in `data/product_intelligence.db` (auto-seeded SQLite in WAL mode with foreign keys enabled).

### 4.2 Frontend Setup (React 19 + TypeScript + Vite 8)
```powershell
# Navigate to frontend directory and start Vite dev server
npm.cmd --prefix frontend run dev
```
- Web Application: `http://localhost:5173`
- Developer Workspace & AI Testing Lab: `http://localhost:5173/developer`
- The Vite dev server proxies `/api` calls directly to `http://127.0.0.1:8000`.

### 4.3 Developer Workspace & 1-Click Quick Auth
In development mode (`import.meta.env.DEV`), the application exposes the internal Developer Workspace at `/developer`:
- **System Health Monitor**: Live telemetry for FastAPI, SQLite, Supabase, Gemini (`gemini-3.8-flash`), and Groq (`openai/gpt-oss-120b`).
- **Dev Auth Quick Switcher**: 1-click verified JWT token issuance for Sarah Chen (Creator), Daniel Thorne (Visitor), or Charlie (Moderator) with active RLS.
- **AI Testing Lab**: Interactive test harness across 12 categories (complaints, improvements, friction, opportunities, PRD comparisons, architecture risks, insufficient evidence, follow-ups, prompt injection).
- **Benchmark Evaluation Matrix**: Automated calculation of Recall@5, MRR, citation correctness (100%), and groundedness.
- **Synthetic Data Manager**: Seed, preview, reset, delete, and export isolated synthetic demo fixtures without touching real user data.

---

## 5. Verification & Testing

### Running Full Automated Test Suite
```powershell
# Run all Phase 1-5 automated tests
python -m pytest backend/tests -v

# Run Phase 5 Developer Workspace & Evaluation tests
python -m pytest backend/tests/test_phase_5_dev_and_evaluation.py -v
```
*Result: 100% passed (All Phase 5 tests passed in 17.01s).*

### Running Frontend Typecheck & Build
```powershell
npm.cmd --prefix frontend run build
```
*Result: Built in 446ms with 0 errors (TypeScript strict check passed).*
```
*Result: 2,034 modules transformed, 0 errors, built in ~563ms.*

### Running Baseline Reference Analytics Regression Check
```powershell
cd "..\ai feedback project"
& ".\.venv\Scripts\python.exe" -m pytest tests -q
```
*Result: 157 passed, 2 warnings in 39.21s (100% green).*

---

## 6. AI Research Engine Configuration (Phase 3)

### Environment Variables
Configure the following in `backend/.env` (or top-level `.env`):
```bash
# Google Gemini API Configuration (Backend-Only)
GEMINI_API_KEY="your-google-ai-studio-api-key"
GEMINI_MODEL="gemini-3.8-flash"
AI_TIMEOUT_SECONDS=30
AI_MAX_RETRIES=2
AI_MAX_OUTPUT_TOKENS=4096
MAX_ANALYSIS_COMMENTS=100
AI_COOLDOWN_SECONDS=30
AI_PROVIDER="gemini" # or "mock" for offline deterministic testing
```

> **Security Note:** `GEMINI_API_KEY` is exclusively consumed by the FastAPI backend server. It is NEVER exposed to the frontend, never prefixed with `VITE_`, never transmitted in API responses, and never logged. If the key is not configured, the website operates normally and returns an actionable 503 error on analysis requests. Unit tests run without requiring a live API key.


---

## 6. Security & Privacy Guarantees

1. **Anonymous Contributor Shielding**: When `isAnonymous` is enabled on posts or comments:
   - Public JSON responses serialize `author.id` as `null` and set `displayName` to `"Anonymous Contributor"` or `"Anonymous Reviewer"`.
   - The creator's public profile (`/users/{id}/profile`) strictly excludes their anonymous posts.
   - Internal database foreign keys retain author relationships exclusively for authorized edits and moderation.
   - Post/comment updates cannot alter `is_anonymous` post-creation.
2. **Atomic Upvote Uniqueness**: Enforced via database constraints (`UNIQUE(post_id, user_id)` and `UNIQUE(comment_id, user_id)`). Upvoting toggles between upvoted and unvoted states without race conditions or duplicates.
3. **Server-Side Authorization**: Updates and deletions verify the verified JWT user identity against the database record. Non-authors are rejected with HTTP 403 Forbidden.
4. **Moderator Privacy**: Moderation reports are inaccessible to regular users and unauthenticated callers (HTTP 401 / 403). Only verified moderators can view submitted reports.
5. **Abuse Prevention**: Size-limiting middleware blocks payloads larger than 2MB with HTTP 413. URL inputs are validated to enforce `http://` or `https://`, neutralizing XSS vectors (`javascript:`, `data:`).
6. **Isolated References**: The 6 cloned GitHub reference repositories in `references/` are excluded from Git tracking via `.gitignore` and are never imported at runtime.

---

## 7. Research Report Generation & Multi-Format Export (Phase 5)

Product Research Intelligence enables users to convert unstructured community feedback into publication-grade product documents grounded strictly in verified discussion records:

| Document Type | Purpose | Primary Content |
| :--- | :--- | :--- |
| **Analytical Report** | Full feedback audit | Recurring themes, quantified sentiment distribution, verbatim quote excerpts, limitations, and strategic next steps. |
| **Executive Summary** | Leadership briefing | Core problem context, high-conviction findings, strategic risks, and top prioritized actions. |
| **Product Requirement Document (PRD)** | Engineering specification | Editable draft: problem statement, user stories (US-01..US-03), proposed architecture, functional requirements (FR-01..FR-03), acceptance criteria (Given/When/Then), and success metrics. |
| **Engineering Ticket** | Sprint backlog ticket | Practical implementation spec: component scope, complexity estimate, acceptance criteria checklist, edge cases, error handling, and verification test plan. |
| **UX Research Brief** | Design & usability study | Qualitative usability patterns, verbatim user friction quotes, testable hypotheses, and study protocol. |

### Supported Export Formats:
- **Markdown (`.md`)**: Full structured Markdown text, editable directly in the browser before export.
- **Native PDF (`.pdf`)**: Formatted publication PDF rendered via pure Python `fpdf2` with running headers, footers with page numbering (`Page {p} of {nb}`), citation callout boxes, and styled tables.

---

## 8. Production Deployment Runbook

### 8.1 Architecture Verification Checklist
- [x] Full backend test suite passing (`71 passed in 7.13s`).
- [x] Reference analytics test suite passing (`157 passed in 39.22s`).
- [x] Frontend TypeScript type check and production bundle passing (`829ms, 0 errors`).
- [x] Row Level Security (RLS) migrations prepared for Supabase PostgreSQL (`00001` through `00005`).

### 8.2 Database Deployment (Supabase PostgreSQL)
1. In your Supabase dashboard, navigate to **SQL Editor**.
2. Apply the ordered migrations located in `supabase/migrations/`:
   ```bash
   00001_initial_community_schema.sql
   00002_harden_rls_and_voting_policies.sql
   00003_analysis_runs_persistence.sql
   00004_research_conversations.sql
   00005_research_reports.sql
   ```
3. Verify that Row Level Security (RLS) is active across all public tables (`profiles`, `posts`, `comments`, `post_votes`, `comment_votes`, `bookmarks`, `reports`, `analysis_runs`, `conversation_sessions`, `conversation_messages`, `research_reports`).
4. In **Authentication > URL Configuration**, add your production domain to **Site URL** and **Redirect URLs** (e.g., `https://your-domain.com/**`).

### 8.3 Backend Deployment (FastAPI on Render / Fly.io / Container)
1. Configure production environment variables:
   ```env
   ENVIRONMENT=production
   DATABASE_URL=postgresql://postgres:[PASSWORD]@[SUPABASE_HOST]:5432/postgres
   AUTH_PROVIDER=supabase
   SUPABASE_URL=https://[YOUR_PROJECT].supabase.co
   SUPABASE_JWT_SECRET=[YOUR_SUPABASE_JWT_SECRET]
   SUPABASE_JWT_ALGORITHM=HS256
   GEMINI_API_KEY=[YOUR_GEMINI_API_KEY]
   GEMINI_MODEL=gemini-3.8-flash
   ALLOWED_CORS_ORIGINS=["https://your-domain.com"]
   ```
2. Start the FastAPI production server using Uvicorn:
   ```bash
   uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --workers 4
   ```
3. Verify backend health endpoint:
   ```bash
   curl -f https://api.your-domain.com/api/v1/health
   # Response: {"status":"healthy","version":"0.1.0","environment":"production"}
   ```

### 8.4 Frontend Deployment (Vercel / Cloudflare Pages / AWS Amplify)
1. Configure build command and output directory:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
2. Set build-time environment variables:
   ```env
   VITE_API_URL=https://api.your-domain.com/api/v1
   VITE_SUPABASE_URL=https://[YOUR_PROJECT].supabase.co
   VITE_SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]
   VITE_ENABLE_MOCK_FALLBACK=false
   ```
3. Deploy and verify asset delivery. Ensure no secrets are present in client bundle (`dist/assets/*.js`).

---

## 9. Future Reference Usage Guidelines & Research Protocols

The project maintains a dedicated local reference repository library in [`references/`](references/README.md) containing verified open-source implementations of product discovery directories, feedback portals, roadmaps, changelogs, and developer profiles.

Whenever a future task concerns **product discovery, launch workflows, feedback management, developer profiles, roadmaps, changelogs, responsive UI, or related architecture**, all team members and autonomous agents must follow this 8-step research protocol:

1. **Consult the Relevant Repository**: Locate the corresponding project in `references/repositories/`:
   - *Product Hunt-style launches & voting*: `references/repositories/Open-Launch`
   - *Feedback boards, public roadmaps & changelogs*: `references/repositories/Quackback`
   - *Clean suggestion workflows, idea states & quotas*: `references/repositories/Fider`
   - *Developer identity, credentials & spotlight*: `references/repositories/Peerlist-Clone`
   - *GraphQL v2 schema, cursors & OAuth PKCE*: `references/repositories/Product-Hunt-API`
2. **Inspect Actual Implementation Files**: Read source controllers, schemas, components, and route definitions directly. Never guess or rely on superficial impressions.
3. **Trace the Feature End-to-End**: Follow data flow from the client trigger (button/form) across the network API/RPC layer down to database mutations and background jobs.
4. **Understand Dependencies and Data Flow**: Identify what libraries, ORMs, state management tools, and event buses support the feature.
5. **Compare with Our Architecture**: Evaluate how the pattern maps to our decoupled FastAPI (Python 3.11) + React 19 (Vite) + PostgreSQL/SQLite stack.
6. **Extract Patterns Without Blindly Copying**: Formulate clean-room implementations using our own design system and domain models.
7. **Verify Intellectual Property & Licensing Compliance**: Check [`references/LICENSE_REVIEW.md`](references/LICENSE_REVIEW.md) before adapting any architectural structure. Strictly observe that `Quackback` and `Fider` are GNU AGPL-3.0, `Open-Launch` has viral badge/link requirements, and `Peerlist-Clone` is unlicensed (All Rights Reserved).
8. **Recommend Changes That Solve Real Problems**: Recommend architectural adjustments only when they solve a verified user requirement, performance bottleneck, or technical gap.

> [!IMPORTANT]
> **Strict Research-Only Policy**: Treat all repositories in `references/repositories/` strictly as research references and reverse-engineering models, not as copy-paste implementation sources or vendor dependencies.


