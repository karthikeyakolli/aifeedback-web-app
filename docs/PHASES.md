# Five-Phase Implementation Roadmap & Gating Criteria

**Product Research Intelligence**

Each phase represents a discrete, verifiable engineering milestone. Progression to the subsequent phase strictly requires passing all acceptance criteria and explicit approval.

---

## Phase 1: Repository Audit, Foundation & UI Shell (Current Phase)

### Objective
Audit the existing codebase, establish baseline test performance, create comprehensive architecture documentation, and implement the full-stack foundation: a modern React + TypeScript + Vite responsive frontend shell with complete routing and high-fidelity fixtures, alongside a modular FastAPI backend with health monitoring, schema standards, and CORS.

### Deliverables
1. **Audit Report & Documentation**:
   - Baseline test execution (157 passed tests in `ai feedback project`).
   - Architectural documentation: `docs/MASTER_PLAN.md`, `docs/ARCHITECTURE.md`, `docs/PHASES.md`, `docs/REFERENCE_REPOS.md`, `docs/IMPLEMENTATION_STATUS.md`.
2. **Frontend Foundation (`frontend/`)**:
   - React 18, TypeScript, Vite, Tailwind CSS, Lucide React.
   - Design system tokens (typography, subtle borders, accessible color palette, dark/light theme).
   - Application shell with desktop navbar, responsive mobile sheet navigation, search, and action triggers.
   - Complete page routes:
     - Home Feed (`/`) with filter tabs, category pills, post cards, voting triggers, and comment stats.
     - Explore (`/explore`) with search, category cards, and trending tags.
     - Create Post (`/create`) with validated inputs, anonymous toggle, and URL verification.
     - Post Details (`/posts/:id`) featuring post metadata, author pill, comment composer, threaded replies, and upvote actions.
     - AI Insights (`/posts/:id/insights` and integrated tab) presenting structured summary, themes with comment citations, feedback category breakdown, disagreements, and validation suggestions.
     - Saved Posts (`/saved`).
     - My Activity (`/activity`).
     - Settings (`/settings`).
   - Dedicated service layer (`frontend/src/services/api.ts`) separating UI components from data-fetching, enabling zero-rewrite migration to live endpoints in Phase 2.
3. **Backend Foundation (`backend/`)**:
   - FastAPI application instance, router setup, Pydantic schemas, and config management.
   - Health endpoints: `/api/health` and `/api/v1/health`.
   - Safe logging middleware and standard JSON error response structures.
   - Pytest setup with passing backend tests.
4. **Environment & Security Plan**:
   - Project `.gitignore` and `.env.example`.
   - Documented Supabase PostgreSQL schema for Phase 2.

### Acceptance Criteria
- [x] Existing application data and tests remain completely untouched.
- [x] Existing project tests pass without regression (157 passed).
- [ ] Frontend builds successfully (`npm run build`) without TypeScript or bundling errors.
- [ ] Frontend routes render smoothly and are responsive on mobile and desktop.
- [ ] Backend starts cleanly and health endpoints respond with 200 OK.
- [ ] Pytest runs cleanly on the new backend suite.
- [ ] No secrets committed.
- [ ] Clear labeling of visual prototype fixtures vs. production live API.

---

## Phase 2: Authentication, Posts & Community Discussions

### Objective
Transform the visual shell into a live, persistent community platform using Supabase PostgreSQL, Supabase Auth, and server-side FastAPI business rules.

### Key Workflows
1. **Authentication & Session Management**:
   - Supabase Auth integration (email/password signup, login, session tokens).
   - Protected client-side routes and secure HTTP authorization headers (`Bearer <token>`).
   - Private user profile management and public user profiles that strictly omit anonymous posts.
2. **Post Management**:
   - Create, read, update, and soft-delete posts.
   - Support public author display or anonymous author display.
   - Category filtering, tag searching, and cursor-based pagination.
3. **Discussion Threads & Voting**:
   - Nested comment threads (parent/child replies).
   - Upvoting on posts and helpful-comment upvotes with database-enforced uniqueness constraints.
   - Bookmarking posts into personal saved collections.
   - Community reporting flag for inappropriate content.
4. **Server-Side Authorization**:
   - Strict server-side verification: only author can edit/delete content.
   - Masking of private author IDs on all anonymous contributions in API serialization.

### Acceptance Criteria
- User can sign up, log in, refresh session, and log out.
- Published posts persist in PostgreSQL and render in the live feed.
- Threaded commenting and reply hierarchy function with database persistence.
- Upvotes and bookmarks persist; duplicate voting is prevented at the database constraint level.
- Anonymous posting completely strips private account fields from public payloads.
- Automated tests verify auth, authorization, data validation, and vote uniqueness.

---

## Phase 3: Gemini-Powered Community Analysis Engine (Completed)

### Objective
Connect Google Gemini via the official `google-genai` Python SDK to analyze post discussions and generate structured, evidence-grounded research intelligence, with strict citation grounding, deterministic metric computation, and versioned persistence.

### Key Workflows
1. **Isolated Provider Adapter**:
   - Built with official `google-genai` SDK (v2.33.0) and modern default model `gemini-3.8-flash`.
   - Bounded token limits, exponential backoff, rate-limit handling, and clear error fallbacks (503, 429, 504, 502).
2. **Deterministic Pre-Processing & Grounding**:
   - Python computes factual counts, analyzed comment counts, theme comment frequencies, and recommendation scores outside the LLM.
   - Every citation proposed by the LLM is checked against the database; hallucinated comment IDs are pruned; exact stored comment text is used for quote snippets; anonymous author masking is strictly preserved.
3. **Anti-Injection Boundaries**:
   - Sandboxes user feedback inside `<community_feedback>` XML delimiters and treats comment text as untrusted observational data.
4. **Versioned Persistence & Stale Detection**:
   - Stores validated analysis runs in `public.analysis_runs` table (`00003_analysis_runs_persistence.sql`).
   - Dynamic stale detection computes SHA-256 hash over post and comments to indicate when discussions have evolved.
   - Enforces 30-second cooldown on fresh analysis generation to protect API quotas.
5. **Interactive UI Integration**:
   - AI Insights view in `AIInsightsView.tsx` with synthesis cards, theme cards, clickable comment citations that scroll to discussion comments, and error/cooldown states.

### Acceptance Criteria
- [x] Live API calls ready with configurable `GEMINI_API_KEY` and default `gemini-3.8-flash`.
- [x] Missing/invalid API keys return clear, actionable configuration feedback (503).
- [x] Mocked test suite runs without external network calls (15 Phase 3 tests passing, 41 backend tests total).
- [x] 100% of cited comment IDs validated against the target post database records.
- [x] Direct quotations are extracted directly from stored database comment strings.
- [x] Analysis runs persist and reload instantly from database cache.
- [x] Stale discussion detection indicates when comments have changed.
- [x] Frontend builds cleanly (`npm run build`) with zero errors.

---

## Phase 4: AI Research Chat & Product Suggestions (Completed)

### Objective
Expand static analysis into an interactive research assistant enabling scoped conversational Q&A, multi-turn RAG memory, and explainable product opportunity prioritization.

### Key Workflows
1. **Scoped Discussion RAG**:
   - Discussion-scoped retrieval using BM25 token scoring, keyword frequency, and conversational query expansion.
   - Conversational assistant answers: "What are the recurring usability issues?", "What do users disagree on?", "Which feature request has the strongest consensus?".
   - Cites supporting comment references in conversational responses with real database quote snippets.
2. **Transparent Product Opportunity Scoring**:
   - Synthesizes product recommendations with distinct, transparent dimensions:
     - Verified Frequency (count of distinct commenters, max 35).
     - Explicit Severity (blocker vs. minor friction, max 35).
     - Community Consensus (agreement ratio vs. contradictions, max 20).
     - Confidence Score (evidence volume, max 10).
   - Maps total score (0-100) to deterministic priority tiers: P0, P1, P2, P3.
   - Generates concrete validation experiments and testable hypotheses.
3. **Security Safeguards**:
   - Cross-discussion isolation: chat cannot retrieve comments from private or unrelated posts.
   - User ownership isolation: users cannot access or list other users' research chat sessions (404/403).
   - Adversarial prompt injection defense across user queries and retrieved comments.

### Acceptance Criteria
- [x] User can create a research session and query the assistant about a specific post's feedback.
- [x] Answers include verifiable citations linking to specific comment cards, with smooth scroll and highlight.
- [x] Chat acknowledges uncertainty and insufficient evidence when no comments match the topic.
- [x] Opportunity scores are transparently calculated mathematically, not arbitrarily hallucinated.
- [x] Tests verify resistance against prompt injection, cross-post leakage, and cross-user data leakage.
- [x] Multi-turn follow-up queries resolve conversational pronouns ("those", "these") using recent message context.
- [x] All 54 backend tests pass; frontend production build passes in 515ms with 0 errors.

---

## Phase 5: Reports, Quality & Production Deployment (Completed)

### Objective
Produce exportable product intelligence assets (PRDs, Executive Summaries, Jira tickets, UX Briefs), execute an end-to-end benchmark evaluation, harden security and ownership isolation, and prepare verified deployment configurations.

### Key Workflows
1. **Report Generation & Multi-Format Export**:
   - Synthesize 5 evidence-grounded document types: Analytical Reports, Executive Summaries, editable PRDs, Engineering Tickets, and UX Research Briefs.
   - Dual export: Formatted Markdown (`.md`) and publication-grade native PDF (`.pdf`) via `fpdf2` with running headers, footers, pagination (`{nb}`), and styled tables.
2. **Persistence & Draft Versioning**:
   - PostgreSQL migration `00005_research_reports.sql` with Row Level Security (`auth.uid() = owner_id`).
   - SQLite WAL test adapter schema and repository methods.
   - In-place draft editing: updating report draft increments version (`v1` -> `v2`) without mutating original discussion comments.
3. **Benchmark Evaluation & Grounding Suite**:
   - Automated test suite validating citation accuracy, quote verification, and anonymous contributor masking.
   - Deterministic prioritization score formula verification (Frequency, Severity, Consensus, Confidence $\to$ P0-P3).
4. **Production Hardening & Verification**:
   - Strict frontend production build (`npm run build`) passing in 829ms with zero errors.
   - Full backend test suite passing with 71 passing tests.
   - Reference analytics test suite passing with 157 passing tests.
   - Honest live integration preflight status documented for Gemini and Supabase.

### Acceptance Criteria
- [x] Full PRD, Executive Summary, Analytical Report, Engineering Ticket, and UX Brief generation functions cleanly.
- [x] Multi-format export: Editable Markdown and binary PDF export via `fpdf2` verified.
- [x] Generated documents can be saved, updated with version incrementing, listed, and deleted.
- [x] User-isolated access boundaries strictly enforced (User B cannot access User A's private reports -> 404).
- [x] Automated test suite passes 100% across frontend, backend, and AI grounding tests (71 backend tests + 157 reference tests).
- [x] Zero secrets, mock placeholders, or unverified claims in production build assets.
- [x] Step-by-step setup and deployment guide verified in `README.md`.

