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

## Phase 3: LLM API & Post-Level AI Analysis

### Objective
Connect an isolated LLM provider (Google Gemini) to analyze active post discussions and generate structured, evidence-grounded research intelligence.

### Key Workflows
1. **Isolated Provider Adapter**:
   - Robust client adapter supporting `gemini-1.5-flash` with JSON mode structured output.
   - Bounded token limits, exponential backoff, rate-limit handling, and clear error fallbacks.
2. **Deterministic Pre-Processing**:
   - Ingest post text and comments. Calculate exact counts, upvote aggregates, and sentiment metrics in Python.
3. **Grounded Prompting & Verification**:
   - Provide untrusted comment text inside sandboxed data blocks.
   - Require typed Pydantic responses: Discussion Summary, Themes, Feedback Breakdown, Disagreements, and Validation Steps.
   - Post-validate that every cited comment ID exists in the post's database records.
4. **Versioned Persistence**:
   - Store validated analysis runs in `analysis_runs` table linked to the post.
   - Expose explicit user refresh button; avoid wasteful re-analysis on every page view.

### Acceptance Criteria
- Live API calls succeed with valid `GEMINI_API_KEY`.
- Missing/invalid API keys return clear, actionable configuration feedback.
- Mocked test suite runs without external network calls.
- 100% of cited comment IDs belong to the target post.
- Direct quotations are validated against stored database comment strings.
- Analysis runs persist and reload instantly from database cache.

---

## Phase 4: AI Research Chat & Product Suggestions

### Objective
Expand static analysis into an interactive research assistant enabling scoped conversational Q&A and explainable product opportunity prioritization.

### Key Workflows
1. **Scoped Discussion RAG**:
   - Discussion-scoped retrieval using TF-IDF and Sentence-Transformers cosine similarity.
   - Conversational assistant answers: "What are the recurring usability issues?", "What do users disagree on?", "Which feature request has the strongest consensus?".
   - Cites supporting comment references in conversational responses.
2. **Transparent Product Opportunity Scoring**:
   - Synthesizes product recommendations with distinct, transparent dimensions:
     - Verified Frequency (count of distinct commenters).
     - Explicit Severity (blocker vs. minor friction).
     - Community Consensus (agreement ratio).
     - Confidence Score (evidence volume).
   - Generates concrete validation experiments and testable hypotheses.
3. **Security Safeguards**:
   - Cross-discussion isolation: chat cannot retrieve comments from private or unrelated posts.
   - Adversarial prompt injection defense across user queries and retrieved comments.

### Acceptance Criteria
- User can query the assistant about a specific post's feedback.
- Answers include verifiable citations linking to specific comment cards.
- Chat acknowledges uncertainty when evidence is sparse or ambiguous.
- Opportunity scores are transparently calculated, not arbitrarily hallucinated.
- Tests verify resistance against prompt injection and cross-user data leakage.

---

## Phase 5: Reports, Quality & Production Deployment

### Objective
Produce exportable product intelligence assets (PRDs, Executive Summaries, Jira tickets), execute an end-to-end benchmark evaluation, harden security, and prepare deployment configurations.

### Key Workflows
1. **Report Generation & Multi-Format Export**:
   - Generate Product Requirements Documents (PRDs) with problem statements, evidence quotes, and acceptance criteria.
   - Export to Markdown, CSV summaries, and formatted research briefs.
2. **Benchmark Evaluation Suite**:
   - Benchmark evaluation across curated discussion datasets testing citation accuracy, theme recall, and hallucination resistance.
3. **Production Hardening & Deployment**:
   - Frontend production build verification (`npm run build`).
   - Secure Supabase Auth redirect URLs and strict CORS headers.
   - Production Dockerfile or deployment guides for Vercel/Render/Supabase.
   - Complete documentation of quotas, operational costs, and operational runbooks.

### Acceptance Criteria
- Full PRD and summary export functions cleanly.
- Automated test suite passes 100% across frontend, backend, and AI grounding tests.
- Zero secrets, mock placeholders, or unverified claims in production build.
- Step-by-step setup and deployment guide verified in `README.md`.
