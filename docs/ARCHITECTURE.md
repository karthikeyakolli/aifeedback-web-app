# System Architecture Specification

**Product Research Intelligence — Anonymous Feedback Community with AI**
*Phase 2.1 Architecture Reconciliation & Hardened Security Baseline*

---

## 1. Architectural Boundaries & Responsibility Separation

The architecture enforces strict separation of concerns across five isolated tiers:

```
[ Browser Client: React 19 + TS + Tailwind ]
                   |
     (HTTPS / JSON REST API / Bearer JWT)
                   v
[ Backend API Gateway: FastAPI + Pydantic ]
       |                  |                |
(Auth & SQL)    (Deterministic Math) (LLM Provider Interface)
       v                  v                v
[ Supabase Postgres ] [ Analytics Engine ] [ Google Gemini API ]
(RLS + Storage)       (TF-IDF / Sent-Trf) (Structured JSON - Phase 3)
```

### 1.1 Canonical Production vs. Local Test Environment

To prevent silent production mismatches while enabling fast, reliable offline testing and CI workflows, the architecture defines two explicit, strictly guarded modes:

| Layer | Canonical Production Stack | Local / Automated Test Adapter | Guard / Enforcement |
|---|---|---|---|
| **Frontend** | React 19, TypeScript, Vite, `@supabase/supabase-js` | React 19, TypeScript, Vite, Local Auth fallback | Auto-detects `VITE_SUPABASE_URL` / keys; falls back gracefully in dev. |
| **Authentication** | **Supabase Auth** (GoTrue JWTs, HS256/asymmetric verification, claims validation) | Local PBKDF2-HMAC-SHA256 & HS256 JWT adapter | **Strict Guard**: If `ENVIRONMENT=production` and `AUTH_PROVIDER=local`, system raises a `RuntimeError` and refuses to start. |
| **Persistence** | **Supabase PostgreSQL** via `DATABASE_URL` (Direct/Pooler) with RLS | **SQLite in WAL mode** (`PRAGMA foreign_keys = ON;`) | Mirrors PostgreSQL schema, unique constraints, and cascades. Never silently replaces production DB. |
| **Migrations** | Controlled SQL files in `supabase/migrations/` | Schema executed idempotently in repository | Non-destructive migration files (`00001`, `00002`). |
| **Authorization** | FastAPI server-side verification + Supabase RLS | FastAPI server-side verification | Server-side checks are authoritative; never trusts unverified client claims. |

---

### 1.2 Frontend Tier (`frontend/`)
- Client-side SPA built with React 19, TypeScript, and Vite.
- Communicates exclusively via typed HTTP client abstractions (`services/api.ts` and `services/supabase.ts`).
- Never holds elevated database credentials (`SUPABASE_SERVICE_ROLE_KEY`) or AI provider keys.
- Implements optimistic UI feedback with reliable error handling and loading skeletons.
- Integrates both canonical Supabase Auth and local developer authentication transparently via `AuthContext.tsx`.

### 1.3 Backend Application Tier (`backend/app/`)
- Async FastAPI application running under Python 3.12.
- Authenticates incoming JWT tokens and extracts verified user credentials (`sub`, `email`, `role`).
- Enforces strict server-side authorization: verifies ownership before edit/delete mutations (returns 403 Forbidden).
- Sanitizes and validates all payloads using Pydantic v2 schemas with custom URL scheme validation (`http://`, `https://`).
- Employs request payload size limit middleware (2MB maximum) to prevent DoS attacks.
- Acts as the orchestration layer: prepares safe, bounded prompts for AI, validates LLM responses, and executes deterministic scoring.

### 1.4 Database & Auth Tier (Supabase PostgreSQL)
- Authoritative persistence for user profiles, posts, threaded comments, votes, bookmarks, and reports.
- Enforces relational foreign keys, cascades, and uniqueness constraints (`unique_post_user_vote`, `unique_comment_user_vote`, `unique_user_post_bookmark`).
- Enforces Row Level Security (RLS) policies for direct access vectors:
  - Public profiles and published posts/comments readable by all.
  - Updates and deletes strictly restricted to the content author (`auth.uid() = author_id`).
  - Reports table query and status update strictly restricted to verified moderators (`is_moderator = TRUE`).
- Maintains automated triggers:
  - `trg_comment_count_change`: Updates post `comments_count` upon comment insertion or deletion.
  - `on_auth_user_created`: Automatically provisions a `public.profiles` row when a user registers via Supabase Auth.
  - `trg_prevent_post_anonymity_change` / `trg_prevent_comment_anonymity_change`: Prohibits altering `is_anonymous` post-creation.

### 1.5 Deterministic Analytics & Evidence Engine (Isolated Module)
- Reuses tested algorithms from the audited capstone project (157 unit tests passing):
  - TF-IDF and Sentence-Transformers semantic embeddings.
  - Cosine similarity retrieval for scoped RAG.
  - Post-generation citation verification: confirms every cited comment ID exists in the database and was authored within the active post.

---

## 2. Privacy & Anonymous Display Architecture

Community feedback often requires candor that public profiles discourage. However, anonymous posting cannot mean untraceable vandalism.

```
+--------------------------------------------------------------+
| Public Client View                                           |
| - Display Name: "Anonymous Contributor"                      |
| - Author ID: null / masked                                   |
| - Avatar: null / Neutral placeholder                         |
+--------------------------------------------------------------+
                              ^
                              | (Backend strips author_id when is_anonymous=true)
+--------------------------------------------------------------+
| Server / DB Record (Private to System)                       |
| - id: "cmt_12345"                                            |
| - author_id: "usr_98765" (Retained for auth & abuse control) |
| - is_anonymous: true                                         |
| - content: "The billing page throws a 500 error."            |
+--------------------------------------------------------------+
```

1. **Public Anonymity**: When `is_anonymous` is set to `true`, serialized responses set `author.id = null`, `author.username = "anonymous"`, `author.displayName = "Anonymous Contributor"` (or `"Anonymous Reviewer"` for comments), and `author.avatarUrl = null`. Email addresses are never exposed in public endpoints.
2. **Accountability**: The database keeps the relational link `author_id` to allow author-only edits, deletion, rate-limiting, and moderator reporting.
3. **No Account Leakage**: Public profile endpoints (`/users/:id/profile`) strictly omit posts or comments where `is_anonymous = true`.
4. **Immutability**: Authors cannot de-anonymize or alter the `is_anonymous` setting after creation.

---

## 3. Database Schema & Migration Specification

### Migration 00001: Initial Community Schema
- Enables extensions: `uuid-ossp`, `pgcrypto`.
- Creates core tables: `profiles`, `posts`, `comments`, `post_votes`, `comment_votes`, `bookmarks`, `reports`.
- Creates query performance indexes for status, category, author, parent comment, and votes.
- Installs `trg_comment_count_change` trigger on comments table.
- Enables Row Level Security (RLS) across all tables.

### Migration 00002: Hardened RLS, Voting Policies & User Sync
- Creates `handle_new_auth_user()` trigger on `auth.users` to automatically populate `public.profiles`.
- Adds `UPDATE` policies for `post_votes` and `comment_votes` to allow atomic vote switching.
- Restricts `public.reports` query and update access exclusively to profiles where `is_moderator = TRUE`.
- Installs `prevent_anonymity_tampering()` trigger preventing changes to `is_anonymous` on existing posts and comments.

---

## 4. API Specification & Routing Conventions

The FastAPI backend exposes versioned REST endpoints under `/api/v1`:

```
/api/v1/
├── health               (GET: system status, database connectivity, uptime)
├── auth/
│   ├── config [GET]     (Public auth provider status: Supabase vs Local)
│   ├── signup [POST]    (Local test mode only: registers user)
│   ├── login [POST]     (Local test mode only: authenticates user)
│   ├── me [GET]         (Current user profile from verified JWT claims)
│   └── logout [POST]    (Clears authenticated session)
├── posts/
│   ├── [GET]            (List posts: pagination, category filter, search, sort)
│   ├── [POST]           (Create post: requires auth, validates URL and content)
│   ├── saved [GET]      (List bookmarked posts of authenticated user)
│   ├── {id} [GET]       (Get post detail + stats + user engagement flags)
│   ├── {id} [PUT]       (Update post: author only, 403 otherwise)
│   ├── {id} [DELETE]    (Delete post: author only, 403 otherwise)
│   ├── {id}/vote [POST] (Toggle upvote: atomic, unique per user)
│   └── {id}/bookmark [POST] (Toggle bookmark)
├── comments/
│   ├── post/{post_id} [GET] (Get threaded comments & nested reply tree)
│   ├── [POST]               (Submit root comment or reply: requires auth)
│   ├── {id} [PUT]           (Edit comment: author only, 403 otherwise)
│   ├── {id} [DELETE]        (Delete comment: author only, decrements counter)
│   └── {id}/vote [POST]     (Toggle comment upvote)
├── reports/
│   ├── [GET]            (Moderator only: list all submitted moderation reports)
│   └── [POST]           (Submit moderation report for post or comment)
├── users/
│   └── {id}/profile [GET] (Public profile omitting email and anonymous posts)
└── ai/ (Phase 3 Gemini Analysis Engine)
    ├── {post_id}/insights [GET] (Retrieves latest persisted analysis run with real-time isStale detection)
    └── {post_id}/analyze [POST] (Author/Moderator only: generates structured grounded insights with cooldown)
```

---

## 5. Security Safeguards Summary

1. **Token Verification**: Supports standard Supabase Auth JWTs. Rejects expired, tampered, or wrong-audience tokens.
2. **Server-Side Authorization**: The backend derives caller identity exclusively from verified JWT claims (`sub`), never from client-supplied IDs. Analysis generation is restricted to the post creator or verified moderators.
3. **Strict Anonymity Masking**: Response serialization strips all identity attributes for anonymous items, and citations for anonymous comments display `"Anonymous Contributor"` without leaking account IDs.
4. **XSS & URL Injection Protection**: Pydantic schema validation rejects `javascript:`, `data:`, and non-HTTP(S) URLs.
5. **Abuse Prevention**: Size-limiting middleware rejects request payloads exceeding 2MB (HTTP 413). Analysis requests enforce a per-post cooldown (30s) to protect API quotas.
6. **Moderator Privacy**: Moderation reports are inaccessible to regular users and unauthenticated callers (HTTP 401 / 403).
7. **Prompt Injection Defense**: Feedback content within `<community_feedback>` XML delimiters is classified as untrusted observational data. Provider system instructions explicitly instruct the model to never execute or obey instructions embedded within user comments.

---

## 6. Phase 3 Gemini-Powered Analysis Engine

### 6.1 LLM Provider Integration (`google-genai` SDK)
- Uses the official Google Gen AI Python SDK (`google-genai` >= 2.25.0, current v2.33.0).
- Configurable model identifier defaulting to `gemini-3.8-flash`.
- Backend-only credentials via `GEMINI_API_KEY`. When absent, graceful 503 error states are returned; unit test suite executes with mock provider without requiring live cloud secrets.
- Enforces structured JSON output via `GenerateContentConfig(response_mime_type="application/json", response_json_schema=GeminiAnalysisOutput.model_json_schema())`.
- Bounded processing: maximum 100 comments analyzed per post with transparent coverage metadata when sampling occurs.
- Transient failure retry logic: bounded retries (max 2) with backoff, converting provider errors into safe HTTP codes (429 Rate Limit, 503 Config, 504 Timeout, 502 Provider).

### 6.2 Deterministic Citation Grounding & Metrics
- Python computes all factual metrics outside the LLM: total available comments, total analyzed comments, unique citations per theme, and recommendation frequency scores.
- Every citation proposed by the LLM is checked against the database:
  - Hallucinated comment IDs are strictly pruned.
  - The quote snippet is extracted directly from stored comment records (never trusting LLM hallucinations).
  - The author display name is derived from stored records, respecting anonymous privacy flags.

### 6.3 Persistent Analysis Runs (`00003_analysis_runs_persistence.sql`)
- Analysis runs are versioned and stored in `public.analysis_runs`:
  - `id`: unique run identifier.
  - `post_id`: foreign key to target post.
  - `status`: `completed` or `failed`.
  - `provider`: `gemini` or `mock`.
  - `model`: model identifier (`gemini-3.8-flash`).
  - `prompt_version`: prompt template version tag (`v1.0-structured`).
  - `input_hash`: deterministic SHA-256 hash over post title, description, comment IDs, contents, and timestamps.
  - `result_json`: structured JSON payload containing verified themes, disagreements, recommendations, and coverage notes.
- Real-time Stale Detection: on retrieval, `current_hash` is computed over current discussion records. If comments have been added or edited, `isStale` dynamically evaluates to `true`.

---

## 7. Phase 4 Conversational Research Assistant, RAG & Suggestions Architecture

### 7.1 Hybrid Retrieval-Augmented Generation (RAG)
- **Discussion Scope Boundary**: Retrieval operates exclusively on the target post, its non-moderated eligible comments, and its most recent validated Phase 3 analysis run. Evidence from unrelated posts is strictly prohibited.
- **BM25 Token Scoring**: Implements smoothed BM25 term weighting (`k1=1.2`, `b=0.75`) with document frequency penalization and phrase/bigram bonus matching.
- **Conversational Query Expansion**: Analyzes anaphoric markers (`those`, `these`, `that`, `which`, `earlier`) against the prior 6 conversation turns to expand the keyword query with context from previous assistant findings.
- **Insufficient Evidence Detection**: When the discussion contains zero comments or query terms yield no matches above the relevance threshold, the system enforces `has_sufficient_evidence = false`, sets an explicit limitation disclosure, and instructs the LLM not to speculate or fabricate community observations.

### 7.2 Conversational Research Assistant
- **Multi-Turn Bounded Context**: Feeds recent user and assistant turns (bounded to the last 6-8 messages) into the prompt alongside the retrieved comments and validated themes. Older history is truncated to keep within token budgets.
- **Zero Hallucinated Citations Guard**:
  - The model proposes comment IDs supporting its answer.
  - The backend cross-checks every ID against stored records for this post. Any hallucinated ID is immediately pruned.
  - Quote snippets are extracted directly from stored database rows, not from model text.
  - Author names are masked as `"Anonymous Contributor"` if the comment was submitted anonymously.
- **Separation of Facts vs. Hypotheses**: The prompt and structured schema explicitly divide output into `observed_facts` (literal feedback claims) and `hypotheses_and_interpretations` (product inferences).

### 7.3 Deterministic Product Suggestion Prioritization Engine
- **Formula**: Suggestion priority is computed mathematically by Python, never hallucinated by an LLM:
  $$\text{Total Score} = \text{Frequency} (0\text{–}35) + \text{Severity} (0\text{–}35) + \text{Consensus} (0\text{–}20) + \text{Confidence} (0\text{–}10)$$
- **Components**:
  - **Frequency (max 35)**: Ratio of unique commenters mentioning the friction relative to total post comments.
  - **Severity (max 35)**: Keyword heuristic detecting blocker terms (`crash`, `broken`, `unusable` $\to$ 35 pts), high friction (`slow`, `latency`, `frustrating` $\to$ 20–30 pts), medium (`clunky`, `awkward` $\to$ 10–20 pts), or low (`minor`, `typo` $\to$ 8 pts).
  - **Consensus (max 20)**: 20 pts if feedback is unanimous, penalized to 12 pts if contrasting viewpoints exist.
  - **Confidence (max 10)**: Scaled with total evidence volume.
- **Priority Thresholds**:
  - **P0 Blocker**: Total score $\ge 80$.
  - **P1 High Friction**: Total score $60\text{–}79$.
  - **P2 Opportunity**: Total score $40\text{–}59$.
  - **P3 Minor / Nice-to-Have**: Total score $< 40$.

### 7.4 Conversation Persistence & User Isolation (`00004_research_conversations.sql`)
- Tables:
  - `public.conversation_sessions`: `(id, post_id, user_id, title, created_at, updated_at)`.
  - `public.conversation_messages`: `(id, session_id, role, content, citations, metadata, created_at)`.
- Isolation:
  - Strict RLS on Supabase PostgreSQL: `auth.uid() = user_id`.
  - Backend API verifies ownership on every session and message operation (`session["userId"] == user["sub"]`). Cross-user session access yields 404/403.
- SQLite WAL test adapter mirror in `backend/app/db/connection.py` with foreign keys and performance indexes.

---

## 8. Phase 5 Research Report Generation, Exporting & Persistence Architecture

### 8.1 Document Synthesis Engine (`backend/app/services/report_generation_service.py`)
- **Supported Document Types**:
  1. **Analytical Research Report**: Full evidence audit, executive summary, methodology, recurring themes with sentiment breakdown, key evidence index, quantitative comment metrics, prioritized recommendations, limitations, and actionable conclusions.
  2. **Executive Summary**: One-page high-impact decision briefing featuring context, key findings, strongest supporting quotes, strategic risks, and defensible next actions.
  3. **Product Requirement Document (PRD)**: Comprehensive editable specification including problem statement, evidence-backed user needs, goals and non-goals, user stories (US-01..US-03), architecture overview, functional requirements (FR-01..FR-03), acceptance criteria (Given/When/Then), assumptions, dependencies, risks, and success metrics.
  4. **Engineering Implementation Ticket**: Practical sprint-ready technical ticket with issue type, problem context, proposed technical implementation, component scope, complexity estimate, acceptance criteria checklist, edge cases, error handling, and verification test plan.
  5. **UX Research Brief**: Qualitative usability brief containing research objectives, observed usability patterns, voice of the user excerpts, conflicting user opinions, testable hypotheses, recommended study methodology (moderated sessions, task evaluation), and study limitations.

### 8.2 Grounding & Privacy Rules
- **Strict Data Grounding**: All quotations, themes, and scores derive exclusively from stored post data, validated Phase 3 analysis runs, and eligible comments. Numerical metrics (comment count, word count, coverage ratio) are computed deterministically in application code.
- **Anonymous Contributor Protection**: Contributions where `is_anonymous = true` are masked as `"Anonymous Contributor"` in all generated documents. Private author IDs and usernames are never leaked in citations or exports.
- **Assumption Labeling**: Proposed capabilities are explicitly marked with `[Proposal]` or `[Assumed]` tags to distinguish observed user feedback from hypothetical engineering solutions.

### 8.3 Multi-Format Export Architecture
- **Markdown (`.md`)**: Full structured Markdown text returned with `text/markdown; charset=utf-8` and sanitized `Content-Disposition` attachment headers. Fully editable in-browser before export.
- **Native PDF (`.pdf`) via `fpdf2`**:
  - Publication-grade typography with customized running headers (`PRODUCT RESEARCH INTELLIGENCE | DOC_TYPE`) and footers (`Page X/{nb} | Confidential & Evidence-Grounded Research`).
  - Proportional table rendering, quote callout borders, section headings, and safe Latin-1 ASCII sanitization preventing rendering exceptions.
  - Returns binary `%PDF-1.3` stream with `application/pdf` MIME type.

### 8.4 Report Persistence & Row Level Security (`00005_research_reports.sql`)
- **Table**: `public.research_reports`
  - Columns: `id` (UUID), `post_id` (UUID), `owner_id` (UUID), `report_type` (VARCHAR), `title` (VARCHAR), `content_markdown` (TEXT), `status` (VARCHAR), `source_analysis_id` (UUID), `version` (INT), `metadata` (JSONB), `created_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ).
  - Performance Indexes: `idx_research_reports_post`, `idx_research_reports_owner`, `idx_research_reports_type`.
- **Row Level Security (RLS)**:
  - Strict user-isolation policies (`auth.uid() = owner_id`) for `SELECT`, `INSERT`, `UPDATE`, and `DELETE`.
  - Backend API verifies ownership on every operation (`report["ownerId"] == user["sub"]`). Unauthenticated requests yield 401; cross-user access yields 404.
- **Draft Versioning**:
  - Updating report title or Markdown content increments `version` (`v1` $\to$ `v2`) without mutating original community comments or previous validated analyses.



