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
├── docs/                             # Architecture & Roadmap Documentation
│   ├── MASTER_PLAN.md                # Vision, principles, and technology stack
│   ├── ARCHITECTURE.md               # Tier boundaries, Supabase schema, privacy
│   ├── PHASES.md                     # Five sequential phases and acceptance gates
│   ├── REFERENCE_REPOS.md            # Comparative analysis of References A-G
│   └── IMPLEMENTATION_STATUS.md      # Active phase checklist and audit log
├── backend/                          # FastAPI Application
│   ├── app/
│   │   ├── config.py                 # Pydantic Settings
│   │   ├── main.py                   # FastAPI app, CORS, error handling
│   │   ├── api/v1/                   # Versioned REST API endpoints
│   │   │   ├── health.py             # Health check endpoints
│   │   │   ├── posts.py              # Posts router
│   │   │   ├── comments.py           # Comments router
│   │   │   ├── ai.py                 # AI research router
│   │   │   └── router.py             # Route aggregator
│   │   ├── schemas/                  # Pydantic v2 schemas
│   │   │   ├── health.py
│   │   │   ├── post.py
│   │   │   ├── comment.py
│   │   │   └── ai.py
│   │   └── services/                 # Business logic service abstractions
│   └── tests/
│       └── test_health.py            # Backend test suite (Pytest)
├── frontend/                         # React 18 + TypeScript + Vite SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/               # Badge, Button, Card, EmptyState
│   │   │   ├── layout/               # Navbar, MobileNav, Footer, AppLayout
│   │   │   ├── feed/                 # PostCard, CategoryFilter, FeedTabs
│   │   │   ├── discussion/           # CommentComposer, CommentThread
│   │   │   └── insights/             # AIInsightsView (Citations & Evidence)
│   │   ├── context/                  # ThemeContext, AuthContext
│   │   ├── fixtures/                 # High-fidelity realistic mock data
│   │   ├── pages/                    # 8 Core application page routes
│   │   │   ├── HomePage.tsx          # Feed with filters & search
│   │   │   ├── ExplorePage.tsx       # Discovery by categories & tags
│   │   │   ├── CreatePostPage.tsx    # Review request composer with anonymity
│   │   │   ├── PostDetailPage.tsx    # Discussions & AI Insights tabs
│   │   │   ├── SavedPostsPage.tsx    # Bookmarked discussions
│   │   │   ├── MyActivityPage.tsx    # User's contributions & privacy notice
│   │   │   ├── SettingsPage.tsx      # Theme & architecture status
│   │   │   └── NotFoundPage.tsx      # 404 handler
│   │   ├── services/
│   │   │   └── api.ts                # Typed API client (Mock & HTTP toggle)
│   │   ├── types/                    # TypeScript interfaces
│   │   └── lib/                      # Styling & date utilities
│   ├── package.json
│   └── vite.config.ts                # Tailwind v4 plugin + API proxy
├── .env.example                      # Safe placeholder environment configuration
├── .gitignore                        # Secret and artifact exclusion rules
└── README.md                         # This file
```

---

## 3. Local Development Quickstart

### Prerequisites
- **Node.js**: v20+ (Verified on v26.8.1)
- **Python**: v3.11+ (Verified on v3.12.10)
- **PowerShell (Windows)**: Run npm commands via `npm.cmd`

### 3.1 Backend Setup (FastAPI)
```bash
# Navigate to project root
# Ensure virtual environment is active
python -m pip install fastapi pydantic uvicorn httpx

# Run backend development server
python -m uvicorn backend.app.main:app --reload --port 8000
```
- API Health Endpoint: `http://localhost:8000/api/health`
- OpenAPI Documentation: `http://localhost:8000/docs`

### 3.2 Frontend Setup (React + Vite)
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (already completed)
npm install

# Start Vite development server
npm run dev
```
- Web Application UI: `http://localhost:5173`
- Client automatically proxies `/api` requests to `http://localhost:8000`.

---

## 4. Verification & Testing

### Running Backend Tests
```bash
python -m pytest backend/tests -v
```
*Current result: 5 passed in 0.54s.*

### Running Frontend Production Build & Typecheck
```bash
cd frontend
npm run build
```
*Current result: 1,990 modules transformed, 0 errors, build completed in ~490ms.*

### Running Existing Repository Baseline Tests
```bash
powershell -Command "Push-Location '..\ai feedback project'; & '.\.venv\Scripts\python.exe' -m pytest tests -q; Pop-Location"
```
*Current result: 157 passed, 2 warnings in 33.18s.*

---

## 5. Phase 1 Verification Summary

| Item | Requirement | Status |
| :--- | :--- | :--- |
| **Audit** | Preserve existing code & verify baseline tests | **157 passed (100% green)** |
| **Documentation** | MASTER_PLAN, ARCHITECTURE, PHASES, REFERENCE_REPOS, STATUS | **Completed** |
| **Frontend Shell** | React + TS + Tailwind + Lucide + 8 Routes + Responsive Design | **Verified & Built** |
| **Backend Core** | FastAPI + Health + CORS + Schemas + Router | **5/5 tests passed** |
| **Security** | No secrets committed, clean `.gitignore`, `.env.example` | **Verified** |
| **Phase Gate** | Phase 1 Completed; ready for Phase 2 approval | **Awaiting Approval** |
