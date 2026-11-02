# Reference Repository Index

This document provides a comprehensive technical index of the five reference repositories cloned into `references/repositories/`. Each repository has been inspected, verified against its upstream Git remote, and profiled for architectural, database, and UI/UX research.

---

## 1. Master Repository Inventory

| Repository | Official Remote Git URL | Default Branch | Checked Out Commit Hash | Clone Date | Primary Stack | License | Primary Research Purpose |
|---|---|---|---|---|---|---|---|
| **Open-Launch** | `https://github.com/openlaunch-org/Open-Launch.git` | `main` | `dc856658e32bacbe9e04aa32e41c2ed740833c54` | 2026-11-01 | Next.js 15, React 19, Drizzle ORM, PostgreSQL, Tailwind | Modified MIT (Viral Attribution Required) | Product Hunt-style launch directory, scheduling, voting & daily leaderboards |
| **Quackback** | `https://github.com/QuackbackIO/quackback.git` | `main` | `95a4608838b9f8676020672a045e9ea56ec2ab03` | 2026-11-01 | React 19, TanStack Router, Drizzle ORM, Bun Monorepo | GNU AGPL-3.0 | Multi-tenant feedback boards, public roadmaps, changelogs & embeddable widget |
| **Fider** | `https://github.com/getfider/fider.git` | `main` | `9949e70e9f5f802a34b3cf62a4f75d8f56caf321` | 2026-11-01 | Go 1.21, React, PostgreSQL (SQL migrations), Webpack | GNU AGPL-3.0 | Clean suggestion portal, voting quotas, idea status workflow & tenant isolation |
| **Peerlist-Clone** | `https://github.com/pruthvii09/peerlist.git` | `main` | `d6ab78718441177583a14f11edaa874f4395f6df` | 2026-11-01 | React, Node.js, Express, Prisma ORM, MongoDB | No License (All Rights Reserved) | Developer profiles, verified credentials, project showcase & community feed |
| **Product-Hunt-API** | `https://github.com/producthunt/producthunt-api.git` | `master` | `16d9463ba0b7c2d025dec7343d13062dac73d8c2` | 2026-11-01 | Node.js, Express, React, Apollo Client, GraphQL v2 | No License (API Terms) | Official GraphQL v2 schema, OAuth 2.0 PKCE flow, cursor pagination & rate limits |

---

## 2. Detailed Repository Profiles

### A. Open-Launch
- **Local Path**: [references/repositories/Open-Launch](file:///c:/Users/OMEN/.gemini/antigravity-ide/scratch/ai%20web%20application/references/repositories/Open-Launch)
- **Upstream Repository**: `https://github.com/openlaunch-org/Open-Launch.git`
- **Total Tracked Files**: 222 source files
- **Package Manager**: Bun (`bun.lockb`)
- **Frontend Stack**:
  - Framework: Next.js 15.1.4 (App Router)
  - UI Library: React 19.0.0
  - Styling: Tailwind CSS 3.4.17 with `tailwindcss-animate`
  - Component Primitives: Radix UI (`@radix-ui/react-accordion`, `dialog`, `dropdown-menu`, `popover`, `slot`, `tabs`, `tooltip`)
  - Icons: `lucide-react`
  - Anti-Bot / Security: Cloudflare Turnstile (`@marsidev/react-turnstile`)
  - Markdown/Comments: `@fuma-comment/react`, `next-mdx-remote`
- **Backend Stack**:
  - Runtime: Next.js Route Handlers & Server Actions
  - Authentication: `better-auth` with Stripe plugin (`@better-auth/stripe`)
  - Database Driver: `postgres` with Drizzle ORM (`drizzle-orm`)
  - Image Upload: `uploadthing`
  - Payments: Stripe SDK (`stripe`)
- **Key Files & Entry Points**:
  - Root Layout: [`app/layout.tsx`](file:///c:/Users/OMEN/.gemini/antigravity-ide/scratch/ai%20web%20application/references/repositories/Open-Launch/app/layout.tsx)
  - Home / Daily Feed: [`app/page.tsx`](file:///c:/Users/OMEN/.gemini/antigravity-ide/scratch/ai%20web%20application/references/repositories/Open-Launch/app/page.tsx)
  - Drizzle Schema: [`drizzle/db/schema.ts`](file:///c:/Users/OMEN/.gemini/antigravity-ide/scratch/ai%20web%20application/references/repositories/Open-Launch/drizzle/db/schema.ts)
  - Launch Submission Form: [`components/dashboard/new-project-dialog.tsx`](file:///c:/Users/OMEN/.gemini/antigravity-ide/scratch/ai%20web%20application/references/repositories/Open-Launch/components/dashboard/new-project-dialog.tsx)
  - Cron Tasks: [`app/api/cron/update-launches/route.ts`](file:///c:/Users/OMEN/.gemini/antigravity-ide/scratch/ai%20web%20application/references/repositories/Open-Launch/app/api/cron/update-launches/route.ts)

---

### B. Quackback
- **Local Path**: [references/repositories/Quackback](file:///c:/Users/OMEN/.gemini/antigravity-ide/scratch/ai%20web%20application/references/repositories/Quackback)
- **Upstream Repository**: `https://github.com/QuackbackIO/quackback.git`
- **Total Tracked Files**: 6,160 source files
- **Package Manager**: Bun Workspace Monorepo (`bun.lock`, `bunfig.toml`)
- **Monorepo Topology**:
  - `apps/web`: Complete single-page application & portal frontend
  - `packages/db`: Drizzle ORM definitions, 303 SQL migrations, RBAC & analytics
  - `packages/widget`: Embeddable customer feedback / messenger widget
  - `packages/email`: Transactional React Email templates
  - `packages/ids`: Cryptographic nanoid / slug generators
  - `packages/logger`: Structured logging primitives
- **Frontend Stack**:
  - Build Tool: Vite 5.x
  - Routing: TanStack Router (`@tanstack/react-router`, `tsr.config.json`)
  - UI Library: React 19.x, Tailwind CSS, `shadcn/ui` components
  - Rich Text Engine: TipTap (`@tiptap/core`, `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-mention`, `@tiptap/extension-table`)
  - Command Palette: `cmdk`
  - Code Editor: `@uiw/react-codemirror`
- **Database & Data Layer**:
  - ORM: Drizzle ORM with PostgreSQL
  - Schema files: `packages/db/src/schema/` (posts, boards, feedback, roadmaps, changelog, comments, rbac, sentiment, analytics)
  - Over 300 sequential migrations reflecting enterprise product maturation
- **Key Files & Entry Points**:
  - Frontend Routes: [`apps/web/src/routes/`](file:///c:/Users/OMEN/.gemini/antigravity-ide/scratch/ai%20web%20application/references/repositories/Quackback/apps/web/src/routes)
  - Feedback Upvote Button: [`apps/web/src/components/public/auth-vote-button.tsx`](file:///c:/Users/OMEN/.gemini/antigravity-ide/scratch/ai%20web%20application/references/repositories/Quackback/apps/web/src/components/public/auth-vote-button.tsx)
  - Threaded Comments: [`apps/web/src/components/public/comment-thread.tsx`](file:///c:/Users/OMEN/.gemini/antigravity-ide/scratch/ai%20web%20application/references/repositories/Quackback/apps/web/src/components/public/comment-thread.tsx)
  - Schema Definitions: [`packages/db/src/schema/posts.ts`](file:///c:/Users/OMEN/.gemini/antigravity-ide/scratch/ai%20web%20application/references/repositories/Quackback/packages/db/src/schema/posts.ts)

---

### C. Fider
- **Local Path**: [references/repositories/Fider](file:///c:/Users/OMEN/.gemini/antigravity-ide/scratch/ai%20web%20application/references/repositories/Fider)
- **Upstream Repository**: `https://github.com/getfider/fider.git`
- **Total Tracked Files**: 1,005 source files
- **Package Manager**: NPM (`package-lock.json`) + Go Modules (`go.mod`)
- **Backend Stack**:
  - Language: Go 1.21
  - Router/Server: Custom high-performance HTTP multiplexer with middleware pipeline
  - Database: PostgreSQL with raw SQL versioned migration files (`migrations/`)
  - Bus & Architecture: In-memory event bus (`pkg/bus`), task queues (`tasks/`), background jobs (`jobs/`)
  - Auth Providers: GitHub, Google, Facebook, Custom OAuth2, Email Magic Links
- **Frontend Stack**:
  - Language: TypeScript / React
  - Bundler: Webpack + Babel (`webpack.config.js`, `babel.config.json`)
  - Editor: TipTap Markdown editor
  - Internationalization: `@lingui/core` & `@lingui/react` (over 20 language catalogs)
- **Key Files & Entry Points**:
  - Go Server Entry Point: [`main.go`](file:///c:/Users/OMEN/.gemini/antigravity-ide/scratch/ai%20web%20application/references/repositories/Fider/main.go)
  - Route Registrations: [`app/cmd/routes.go`](file:///c:/Users/OMEN/.gemini/antigravity-ide/scratch/ai%20web%20application/references/repositories/Fider/app/cmd/routes.go)
  - Suggestion Handler: [`app/handlers/ideas.go`](file:///c:/Users/OMEN/.gemini/antigravity-ide/scratch/ai%20web%20application/references/repositories/Fider/app/handlers)
  - SQL Migrations: [`migrations/`](file:///c:/Users/OMEN/.gemini/antigravity-ide/scratch/ai%20web%20application/references/repositories/Fider/migrations)
  - Multi-Tenant Middleware: [`app/middlewares/tenant.go`](file:///c:/Users/OMEN/.gemini/antigravity-ide/scratch/ai%20web%20application/references/repositories/Fider/app/middlewares)

---

### D. Peerlist-Clone
- **Local Path**: [references/repositories/Peerlist-Clone](file:///c:/Users/OMEN/.gemini/antigravity-ide/scratch/ai%20web%20application/references/repositories/Peerlist-Clone)
- **Upstream Repository**: `https://github.com/pruthvii09/peerlist.git`
- **Total Tracked Files**: 246 source files
- **Package Manager**: NPM (`package-lock.json`)
- **Architecture**: Polyrepo-style single repository with dedicated `backend/` and `frontend/` folders
- **Backend Stack**:
  - Language: Node.js / Express
  - ORM: Prisma ORM (`prisma/schema.prisma`)
  - Database: MongoDB via Prisma MongoDB Connector
  - Realtime: Socket.io for direct messaging and live notifications (`sockets/socket.js`)
  - Auth: JWT (JSON Web Tokens) with Refresh Token rotation (`helpers/refreshToken.js`)
- **Frontend Stack**:
  - Language: React (Create-React-App structure)
  - Styling: Tailwind CSS
  - State & Modals: React Context (`ModalContext.js`, `ConfettiContext.js`)
  - Feed & Cards: Custom developer cards, work experience timelines, skill badges
- **Key Files & Entry Points**:
  - Backend Entry: [`backend/index.js`](file:///c:/Users/OMEN/.gemini/antigravity-ide/scratch/ai%20web%20application/references/repositories/Peerlist-Clone/backend/index.js)
  - Prisma Schema: [`backend/prisma/schema.prisma`](file:///c:/Users/OMEN/.gemini/antigravity-ide/scratch/ai%20web%20application/references/repositories/Peerlist-Clone/backend/prisma/schema.prisma)
  - Project Spotlight Controller: [`backend/controllers/spotlight.controller.js`](file:///c:/Users/OMEN/.gemini/antigravity-ide/scratch/ai%20web%20application/references/repositories/Peerlist-Clone/backend/controllers/spotlight.controller.js)
  - Frontend Feed Page: [`frontend/src/pages/Home.jsx`](file:///c:/Users/OMEN/.gemini/antigravity-ide/scratch/ai%20web%20application/references/repositories/Peerlist-Clone/frontend/src/pages/Home.jsx)

---

### E. Product-Hunt-API
- **Local Path**: [references/repositories/Product-Hunt-API](file:///c:/Users/OMEN/.gemini/antigravity-ide/scratch/ai%20web%20application/references/repositories/Product-Hunt-API)
- **Upstream Repository**: `https://github.com/producthunt/producthunt-api.git`
- **Total Tracked Files**: 23 source files
- **Package Manager**: Yarn (`yarn.lock`)
- **Architecture**: Minimal Node.js proxy server with React Apollo frontend
- **Backend Stack**:
  - Runtime: Node.js with Express
  - Security / Auth: OAuth 2.0 Authorization Code flow with Product Hunt v2 OAuth API
  - GraphQL Proxy: Express route handler proxying GraphQL queries to `https://api.producthunt.com/v2/api/graphql`
  - Rate-Limit Logging: Automatic header inspection (`x-rate-limit-limit`, `x-rate-limit-remaining`, `x-rate-limit-reset`)
- **Frontend Stack**:
  - Client: React with Apollo Client (`@apollo/client`, `graphql`)
- **Key Files & Entry Points**:
  - Express Server: [`index.js`](file:///c:/Users/OMEN/.gemini/antigravity-ide/scratch/ai%20web%20application/references/repositories/Product-Hunt-API/index.js)
  - GraphQL Proxy Route: [`routes/graphql.js`](file:///c:/Users/OMEN/.gemini/antigravity-ide/scratch/ai%20web%20application/references/repositories/Product-Hunt-API/routes/graphql.js)
  - OAuth Authorize Route: [`routes/authorize.js`](file:///c:/Users/OMEN/.gemini/antigravity-ide/scratch/ai%20web%20application/references/repositories/Product-Hunt-API/routes/authorize.js)
  - Complete Schema: [`schema.graphql`](file:///c:/Users/OMEN/.gemini/antigravity-ide/scratch/ai%20web%20application/references/repositories/Product-Hunt-API/schema.graphql)

