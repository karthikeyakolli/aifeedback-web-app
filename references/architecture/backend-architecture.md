# Backend Architecture & Security Engineering

This report evaluates backend architecture, API designs, authentication, authorization, background processing, and security protections across the reference repositories.

---

## 1. Backend Architectures & Framework Comparisons

```mermaid
flowchart LR
    subgraph FiderArch["Fider (Go Modular Monolith)"]
        F_In[HTTP Request] --> F_Mid[Middleware Chain]
        F_Mid --> F_Hand[Handler Func]
        F_Hand --> F_Bus[Event Bus (pkg/bus)]
        F_Bus --> F_Task[Async Tasks]
        F_Hand --> F_SQL[Postgres SQL]
    end

    subgraph OLArch["Open-Launch (Next.js Server Actions)"]
        OL_In[RPC / Action] --> OL_Auth[better-auth Check]
        OL_Auth --> OL_Driz[Drizzle PostgreSQL]
        OL_Cron[Vercel Cron] --> OL_Route[Route Handlers]
    end

    subgraph OurArch["Our Platform (FastAPI Async Kernel)"]
        O_In[REST Request] --> O_Mid[CORS / Auth Middleware]
        O_Mid --> O_Fast[FastAPI Router]
        O_Fast --> O_Pyd[Pydantic Validation]
        O_Fast --> O_SQL[SQLAlchemy / SQLite-PG]
        O_Fast --> O_AI[Async AI Worker]
    end
```

---

## 2. API Protocols & Interface Designs

| Repository | Protocol | Schema Validation | Key Endpoints | Error Handling Standard |
|---|---|---|---|---|
| **Open-Launch** | Next.js Server Actions + REST | Zod (`zod`) schemas | `/api/auth/*`, `/api/comments/*`, `/api/cron/*` | Next.js throw errors & JSON responses |
| **Quackback** | RESTful JSON API | Zod / TypeScript types | `/api/v1/posts`, `/api/v1/boards`, `/api/v1/votes` | RFC 7807 Problem Details JSON |
| **Fider** | RESTful JSON API | Go struct binding | `/api/v1/ideas`, `/api/v1/comments`, `/api/v1/votes` | Standardized `{ error: { code, message } }` |
| **Peerlist-Clone** | Express REST + Socket.io | Manual parameter checks | `/api/projects`, `/api/users`, `/api/posts` | Express `res.status().json({ message })` |
| **Product-Hunt-API**| GraphQL API v2 | GraphQL Schema definition | `/v2/api/graphql` (POST query/mutation) | GraphQL standard `{ data, errors }` |

---

## 3. Authentication & Session Management

### A. Better-Auth (Open-Launch)
- **Library**: `better-auth` v1.x with PostgreSQL adapter.
- **Session Model**: Database-backed sessions stored in the `session` table with `expires_at`, `token`, and `ip_address`.
- **Social Providers**: Native OAuth for Google and GitHub, plus magic link email verification.
- **Pros**: Handles CSRF tokens, session rotation, password hashing (Argon2id), and role impersonation automatically.

### B. Multi-Provider OAuth with Cookie Sessions (Fider)
- **Implementation**: Handled in `app/services/oauth/` and `app/middlewares/auth.go`.
- **Flow**:
  1. User clicks login; Go handler redirects to OAuth provider (GitHub, Google, Facebook) with encrypted state token.
  2. Provider callbacks verify state and exchange code for access token.
  3. Fider matches user email or creates tenant-isolated user record.
  4. Issues an encrypted, HTTP-only, SameSite=Lax session cookie.
- **Key Insight**: Session cookies remain the most resilient pattern for web portals, avoiding token storage in `localStorage` which is vulnerable to XSS attacks.

### C. JWT with Refresh Token Rotation (Peerlist-Clone)
- **Implementation**: Located in `backend/helpers/refreshToken.js` and `backend/middleware/auth.js`.
- **Mechanics**:
  - Access token has a short TTL (15 minutes).
  - Refresh token stored in HTTP-only cookie with database tracking.
  - When access token expires, client issues `/refresh-token` to obtain a fresh pair.

---

## 4. Authorization & Role-Based Access Control (RBAC)

### A. Quackback's Granular RBAC Catalog
Quackback implements one of the most mature open-source RBAC schemas in `packages/db/src/schema/rbac.ts`:
- **Roles**: `Owner`, `Admin`, `Moderator`, `Contributor`, `Visitor`.
- **Permissions**: Defined as fine-grained enum tokens:
  - `boards:create`, `boards:update`, `boards:delete`
  - `posts:publish`, `posts:moderate`, `posts:merge`
  - `comments:delete_any`, `comments:pin`
  - `roadmap:manage`, `changelog:publish`
- **Dynamic Gating**: Middleware verifies whether the principal holds the required capability for the target workspace or board.

### B. Fider's Role Model
Fider uses a clean 3-tier role enum in `app/models/enum/user_role.go`:
- `Administrator` (full tenant control)
- `Collaborator` (manage ideas, set status, post official responses)
- `Visitor` (submit ideas, vote, comment)

---

## 5. Abuse Prevention, Rate Limiting & Anti-Bot Protection

### A. Cloudflare Turnstile Verification (Open-Launch)
- Located in `components/dashboard/new-project-dialog.tsx` and validated on the backend.
- Prevents automated bot scripts from spamming prototype submissions and manipulating upvote counts without annoying captchas.

### B. Product Hunt Rate Limit Tracking
- Product Hunt v2 enforces strict API consumption limits.
- Inspecting `routes/graphql.js` reveals how rate limits are monitored:
  ```javascript
  const limit = response.headers.get("x-rate-limit-limit");
  const remaining = response.headers.get("x-rate-limit-remaining");
  const resetIn = response.headers.get("x-rate-limit-reset");
  ```
- **Platform Application**: Our public API endpoints for testing prototypes and submitting feedback should return standard `X-RateLimit-*` headers to prevent scraping and abuse.

---

## 6. Background Processing & Task Orchestration

### A. Scheduled Cron Jobs (Open-Launch)
- Endpoints in `app/api/cron/`:
  - `update-launches/route.ts`: Evaluates scheduled launches at midnight UTC, transitioning statuses from `scheduled` to `ongoing`.
  - `send-ongoing-reminders/route.ts`: Sends email reminders to makers during active launch days.
  - `send-winner-notifications/route.ts`: Tally daily votes and awards "#1 Product of the Day" badges.

### B. In-Memory Job Bus (Fider)
- Located in `app/jobs/` and `app/tasks/`:
  - Dispatches tasks asynchronously via Go goroutines without blocking HTTP responses.
  - Periodic tasks purge unverified users, clean suppressed emails, and process webhook deliveries.

---

## 7. Backend Recommendations for Our Platform

1. **Leverage FastAPI Asynchronous Background Tasks**: Use Python `asyncio` and `BackgroundTasks` for non-blocking AI summarization, audio generation, and email dispatching.
2. **Implement Idempotent Upvoting with Unique Constraints**: Combine database unique constraints on `(user_id, product_id)` with atomic counter increments to prevent race conditions during launch spikes.
3. **Enforce HTTP-Only Secure Cookies for Sessions**: Store auth tokens in encrypted HTTP-only cookies with `SameSite=Strict` and `Secure` flags.
4. **Expose Standard Rate-Limiting Headers**: Protect feedback and prototype submission endpoints using a token bucket rate limiter with `X-RateLimit-*` headers.

