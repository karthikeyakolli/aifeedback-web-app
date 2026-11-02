# Phase 2 — Environment & Secrets Configuration

**Status**: APPROVED & LOCKED  
**Architect**: Senior Full-Stack Architect & DevOps Engineer  
**Date**: November 2, 2026  
**Scope**: Configuration Matrix, Secrets Management, Safe Defaults & Zero-Leakage Policies  

---

## 1. Environment Matrix

The system operates across three distinct operational environments:

| Environment | Purpose | Database Engine | Auth Mode | AI Mode | Dev Endpoints |
|---|---|---|---|---|---|
| `development` | Local engineering & UI iteration | SQLite (`local.db`, WAL) | Local JWT / Argon2id | Gemini API + Groq Fallback | **Enabled** (`/api/v1/dev/*`) |
| `testing` | Pytest automation & CI/CD | In-Memory SQLite (`:memory:`) | Test JWT Minting | Mocks & Deterministic Fallbacks | **Enabled** |
| `production` | Cloud live workload | PostgreSQL / Supabase | Supabase Auth + JWT verify | Live Gemini 2.5 Flash | **Disabled** (Strict 403) |

---

## 2. Environment Variables Catalog

All configuration variables are managed centrally via `backend/app/core/config.py` using Pydantic Settings with automatic `.env` file ingestion.

### 2.1 Core Application & Network

| Variable | Type | Default Value | Description |
|---|---|---|---|
| `ENVIRONMENT` | `string` | `development` | Operational environment: `development`, `testing`, `production` |
| `APP_NAME` | `string` | `AI Project Feedback Platform` | Display name of the application |
| `DEBUG` | `boolean` | `true` (dev) / `false` (prod) | Verbose logging toggle (strictly false in prod) |
| `HOST` | `string` | `127.0.0.1` | Network interface to bind Uvicorn server |
| `PORT` | `integer` | `8000` | Port for the backend API server |
| `CORS_ORIGINS` | `string` | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated allowed HTTP origins |

### 2.2 Security & Authentication

| Variable | Type | Default Value | Description |
|---|---|---|---|
| `JWT_SECRET_KEY` | `string` | `dev-insecure-secret-key-32-chars-long` | HMAC-SHA256 signing secret for authentication tokens |
| `JWT_ALGORITHM` | `string` | `HS256` | Cryptographic algorithm for JWT signatures |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `integer` | `1440` (24 hours) | Token validity duration before re-authentication |

> [!CAUTION]
> In production environments, `JWT_SECRET_KEY` must be cryptographically generated (min. 64 random alphanumeric characters) and provisioned via secure secret managers. Running with the default secret in `production` immediately terminates server startup.

### 2.3 Database & Persistence

| Variable | Type | Default Value | Description |
|---|---|---|---|
| `DATABASE_URL` | `string` | `sqlite:///./local.db` | Connection URI. Supports `sqlite://` and `postgresql://` |
| `SUPABASE_URL` | `string` | `""` | Supabase project URL (e.g. `https://xxxx.supabase.co`) |
| `SUPABASE_ANON_KEY` | `string` | `""` | Client-safe publishable key for public client queries |
| `SUPABASE_SERVICE_ROLE_KEY` | `string` | `""` | Server-only admin key for migrations & elevated operations |

### 2.4 AI Intelligence & Providers

| Variable | Type | Default Value | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | `string` | `""` | Google Gemini API key for feedback synthesis |
| `GROQ_API_KEY` | `string` | `""` | Secondary failover API key for Groq Llama-3 inference |
| `DEFAULT_AI_PROVIDER` | `string` | `auto` | `auto` (Gemini first with Groq failover), `gemini`, `groq` |
| `AI_TIMEOUT_SECONDS` | `integer` | `30` | Max duration before initiating provider failover |

### 2.5 File Storage & Uploads

| Variable | Type | Default Value | Description |
|---|---|---|---|
| `ATTACHMENT_STORAGE_DIR` | `string` | `./uploads` | Local directory for uploaded specifications and docs |
| `MAX_ATTACHMENT_SIZE_MB` | `integer` | `10` | Maximum single-file upload size boundary |

---

## 3. Secrets Hygiene & Zero-Leakage Policy

1. **Client Bundling Protection**:
   - Only variables prefixed with `VITE_` in `frontend/.env` are bundled into the frontend JavaScript artifact.
   - `GEMINI_API_KEY`, `GROQ_API_KEY`, `JWT_SECRET_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are never prefixed with `VITE_` and never imported into frontend code.
2. **Log Sanitization**:
   - Backend logging middleware intercepts all outgoing request and response logs, automatically masking `Authorization` headers and fields named `password`, `token`, `secret`, or `key`.
3. **Repository Exclusion**:
   - `.env`, `.env.local`, `.env.production`, and `local.db` are explicitly listed in `.gitignore` to prevent accidental commits.

