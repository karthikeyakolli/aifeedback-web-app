# PROJECT HANDOVER SPECIFICATION
**Project:** AI Project Feedback  
**Milestone:** Phase 14 — Final System Completion & Permanent Engineering Closure  
**Version:** 1.0.0 (Production Release)  
**Status:** AUTHORITATIVE HANDOVER DOCUMENT

---

## 1. Handover Overview & Ownership Transfer

This document provides complete operational, architectural, and development handover documentation for future maintainers, platform engineers, and site reliability teams responsible for the **AI Project Feedback** application.

All core engineering development is concluded under Phase 14. This document serves as the primary technical onboarding guide.

---

## 2. Developer Quick-Start & Local Setup

### 2.1 Prerequisites
- Python 3.11+ (Python 3.12 / 3.15 supported)
- Node.js 20+ and npm 10+
- Git

### 2.2 Local Development Bootstrapping
```bash
# 1. Clone repository
git clone https://github.com/aiprojectfeedback/aifeedback-web-app.git
cd "ai web application"

# 2. Setup Python virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# 3. Install backend dependencies
pip install -r backend/requirements.txt

# 4. Install frontend dependencies
npm install

# 5. Launch development services
# Terminal A (Backend API):
uvicorn backend.app.main:app --reload --port 8000

# Terminal B (Frontend Vite Dev Server):
npm run dev
```

The frontend will be available at `http://localhost:5173`, and the API documentation will be available at `http://localhost:8000/docs`.

---

## 3. Key Repositories, Paths & Files

| Component / Path | Purpose & Description |
| :--- | :--- |
| `backend/app/main.py` | FastAPI application bootstrap, CORS middleware, lifespan events |
| `backend/app/api/v1/` | All modular REST API routes (auth, projects, budgets, health, ai) |
| `backend/app/db/connection.py` | `DatabaseManager` providing dual-mode SQLite and PostgreSQL connections |
| `backend/app/db/project_repository.py` | Data access layer for projects, reviews, findings, citations, and snapshots |
| `backend/app/services/ai_orchestrator.py`| Multi-tier cascade orchestrator across Gemini, Claude, OpenAI, OpenRouter, NVIDIA |
| `backend/app/services/review_worker.py` | Review worker polling loop, heartbeat leasing, and stale recovery |
| `frontend/src/services/api.ts` | Typed client API connecting React to the backend |
| `frontend/src/components/product/ProjectReviewTab.tsx`| Primary UI review dashboard with 7-coordinate citation badges |
| `supabase/migrations/` | Versioned SQL migration scripts (00001 through 00012) |
| `backend/tests/` | 210 automated unit and integration tests |

---

## 4. Routine Operations & Maintenance Tasks

### Running the Test Suite
```bash
# Run all 210 backend tests
python -m pytest backend/tests

# Run frontend build check
npm run build
```

### Rotating Master Encryption Secrets
To rotate the `AI_VAULT_ENCRYPTION_KEY`:
1. Generate a new 32-byte Fernet key: `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`.
2. Re-encrypt stored secrets in `user_ai_credentials` using the key transition script.
3. Update environment secret across Kubernetes / Cloud Run pods.

### Checking Worker Queue Depth
```sql
SELECT status, COUNT(*) 
FROM ai_reviews 
GROUP BY status;
```

---

## 5. Architectural Invariants for Future Maintainers

Maintainers must observe the following invariants:
1. **Preserve Finding Citation Grounding**: Never generate findings without anchoring them to `finding_evidence_citations` containing line numbers, character offsets, snapshot IDs, and quote hashes.
2. **Preserve Lease Fencing on Finalization**: `finalize_feedback_report()` must always verify active worker lease tokens to prevent zombie worker overwrites.
3. **Preserve Dual-Mode Compatibility**: Any new database table or index must be added to both `connection.py` (for SQLite local tests) and a new `supabase/migrations/` script (for PostgreSQL production).
4. **Preserve Read-Only Public Space**: The Public space must remain strictly non-mutating until a formal product decision expands its scope.

---

## 6. Official Handover Sign-Off

All engineering deliverables, test suites, architecture documents, and runbooks have been transferred to production custody.

**HANDOVER COMPLETE AND ACCEPTED.**
