# Limitations, Anti-Patterns & Engineering Observations

This document details the architectural bottlenecks, anti-patterns, maintainability issues, and operational risks identified across the reference codebases during reverse-engineering.

---

## 1. Open-Launch: Observations & Limitations

### A. Severe Intellectual Property Restriction
- **The Issue**: Open-Launch’s license requires every single webpage of any service using its code to host a permanent, prominent 150x44px SVG badge and a dofollow link back to `https://open-launch.com`.
- **Architectural Consequence**: Even if its Next.js 15 UI is appealing, incorporating its source code forfeits independent brand authority and compromises search engine authority by leaking PageRank to a competitor.

### B. Lack of Structured Technical Feedback
- **The Issue**: Open-Launch treats community interaction merely as generic blog-style comments via `@fuma-comment/react`.
- **Limitation**: Developers cannot specify reproduction steps, log snippets, severity levels, or categorize items into bugs versus feature requests. It functions solely as a hype directory rather than an engineering collaboration platform.

### C. Serverless Cold Starts on Database Connections
- **The Issue**: In `drizzle/db/index.ts`, standard database clients without connection pooling struggle when deployed to serverless environments (Vercel/Cloudflare). Under launch day concurrency spikes, connection pool exhaustion causes intermittent HTTP 504 gateway timeouts.

---

## 2. Quackback: Observations & Limitations

### A. Migration Sprawl & Schema Bloat
- **The Issue**: In `packages/db/drizzle/`, there are **over 300 sequential migration files** (`0000_initial.sql` through `0303_ai_permission_split.sql`).
- **Observation**: Over months of iteration, fields were added, dropped, renamed, and backfilled repeatedly (e.g., dropping merge suggestions, dropping board moderation, re-adding ticket SLAs).
- **Engineering Lesson**: Setting up automated migration squash pipelines or using declarative schema checks prevents continuous migration drift and keeps database bootstrapping fast during test execution.

### B. Heavy Monorepo Tooling Overhead
- **The Issue**: The Bun monorepo relies on customized package boundaries (`apps/web`, `packages/db`, `packages/ids`, `packages/email`, `packages/widget`).
- **Limitation**: Local setups require precise versions of Bun (`bunfig.toml`), Oxlint, and Vitest. A subtle package version conflict can break the entire workspace build.

### C. AGPL-3.0 License Barrier
- **The Issue**: Quackback is distributed under GNU AGPL-3.0.
- **Risk**: Any team attempting to copy components, hooks, or backend logic into a commercial SaaS must open-source their entire proprietary backend under Section 13.

---

## 3. Fider: Observations & Limitations

### A. Aging Frontend Toolchain
- **The Issue**: Fider’s frontend relies on Webpack 5, Babel, and custom esbuild shims (`esbuild-shim.js`, `babel.config.json`).
- **Limitation**: Compared to modern Vite pipelines, frontend builds take significantly longer (15–30s vs 200ms in Vite), and Hot Module Replacement (HMR) frequently requires full page reloads.

### B. Go-Template Hybrid Coupling
- **The Issue**: HTML entry points are generated via Go templates in `views/` before hydrating React components on the client.
- **Limitation**: Creating new client-side routes requires modifying both Go HTTP handlers (`app/cmd/routes.go`) and client bundle scripts, slowing down frontend iteration.

---

## 4. Peerlist-Clone: Observations & Limitations

### A. MongoDB Document Model for Relational Graphs
- **The Issue**: Peerlist-Clone uses MongoDB via Prisma (`provider = "mongodb"`).
- **Critical Flaw**: Social and developer platforms are fundamentally relational: users have followers, post comments, join projects, and cast upvotes. Modeling these relationships in MongoDB requires manual document cross-referencing without relational integrity:
  - If a user record is deleted, orphaned comments and likes can linger.
  - Concurrency locks on document updates can lead to lost upvote tallies.

### B. Insecure Background Scheduling (`corn.js`)
- **The Issue**: Periodic tasks are scheduled using Node.js `setInterval` inside `backend/corn/corn.js`.
- **Limitation**: If the Node.js server restarts or scales to multiple instances, `setInterval` either drops execution or executes multiple duplicate times in parallel without distributed locking.

### C. No TypeScript & Zero Automated Tests
- **The Issue**: Both backend and frontend are written in plain JavaScript with zero unit or integration tests.
- **Risk**: Refactoring database fields or API signatures introduces invisible runtime crashes.

---

## 5. Product-Hunt-API: Observations & Limitations

### A. Outdated Legacy Dependencies
- **The Issue**: The package relies on deprecated Node packages requiring `NODE_OPTIONS=--openssl-legacy-provider` to successfully compile under modern Node.js versions.
- **Limitation**: Serves only as a static conceptual reference for GraphQL v2 schemas, rather than a production-ready starter kit.

---

## 6. Summary of Architectural Traps to Avoid

1. **Avoid Viral Licenses**: Never adopt AGPL-3.0 or viral attribution MIT variants into our codebase.
2. **Avoid Non-Relational Stores for Relational Data**: Always rely on ACID-compliant PostgreSQL for feedback, roadmaps, and voting.
3. **Avoid Unpooled Serverless DB Connections**: Use persistent connection pooling for FastAPI database engines.
4. **Avoid In-Process `setInterval` for Critical Tasks**: Use database-backed job tables or Celery/FastAPI task queues with distributed locks for scheduling.

