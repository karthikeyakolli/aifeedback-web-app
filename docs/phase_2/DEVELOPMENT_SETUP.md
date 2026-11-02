# Phase 2 — Development Setup & Onboarding Guide

**Status**: APPROVED & LOCKED  
**Architect**: Senior Full-Stack Architect & DevOps Engineer  
**Date**: November 2, 2026  
**Scope**: Local Setup, Environment Provisioning, Migration Execution & Server Lifecycle  

---

## 1. Prerequisites

Before setting up the repository, verify that the following toolchains are installed on the host machine:

| Requirement | Supported Versions | Verification Command |
|---|---|---|
| **Python** | 3.11, 3.12, 3.15+ | `python --version` |
| **Node.js** | 18.x, 20.x, 22.x+ | `node --version` |
| **npm** | 9.x, 10.x+ | `npm --version` |
| **Git** | 2.30+ | `git --version` |

---

## 2. Quickstart Installation (5 Minutes)

### Step 1: Clone Repository & Enter Directory
```bash
git clone <repository_url>
cd "ai web application"
```

### Step 2: Configure Environment Variables
Copy the example environment files for both backend and frontend:
```bash
# Backend configuration
cp .env.example .env

# Frontend configuration
cp frontend/.env.example frontend/.env
```
Ensure `GEMINI_API_KEY` is populated in `.env` if testing live AI analysis. For zero-config local testing, default synthetic mocks and SQLite settings function immediately.

### Step 3: Install Backend Python Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Install Frontend Node Dependencies
```bash
cd frontend
npm install
cd ..
```

---

## 3. Database Initialization & Migrations

### 3.1 Local SQLite Mode (Default)
Local development uses an embedded SQLite database (`local.db`) with Write-Ahead Logging (`WAL`).

To verify or initialize the schema:
```bash
python -c "from backend.app.db.connection import db_manager; db_manager.init_db(); print('SQLite schema initialized successfully!')"
```
This automatically applies all tables, indexes, constraints, and initial state definitions.

### 3.2 Production Supabase PostgreSQL Mode
When deploying or developing against live Supabase PostgreSQL:
1. Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are defined in `.env`.
2. Apply migration script located in `supabase/migrations/`:
   ```bash
   # Using Supabase CLI:
   supabase db push

   # Or execute SQL migration directly:
   # supabase/migrations/00007_projects_and_ai_feedback_foundation.sql
   ```

---

## 4. Running the Development Servers

### 4.1 Running the Backend Server
Start the FastAPI server via Uvicorn with auto-reload:
```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Base URL: `http://127.0.0.1:8000`
- Interactive OpenAPI / Swagger UI: `http://127.0.0.1:8000/docs`
- Healthcheck Endpoint: `http://127.0.0.1:8000/health`

### 4.2 Running the Frontend Server
Start the Vite development server:
```bash
npm --prefix frontend run dev
```
- Frontend Application URL: `http://localhost:5173`
- Network Preview URL: `http://<local-ip>:5173`

---

## 5. Development Utilities & Seeding

For rapid testing without manual form completion:
1. **Developer Quick Tokens**:
   Generate an instant authenticated token for testing:
   ```bash
   curl -X POST http://127.0.0.1:8000/api/v1/dev/quick-token -H "Content-Type: application/json" -d '{"account_type": "creator"}'
   ```
2. **Synthetic Data Seeder**:
   Seed realistic sample projects and community discussions:
   ```bash
   curl -X POST http://127.0.0.1:8000/api/v1/dev/synthetic-data/seed
   ```
3. **Frontend Linting & Type-Checking**:
   ```bash
   npm --prefix frontend run lint
   npm --prefix frontend run build
   ```

