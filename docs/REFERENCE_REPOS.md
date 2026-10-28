# Architectural Study & Local Reference Inventory

This document inventories the local GitHub reference code library downloaded into `references/` alongside the parent project, recording exact repository origins, commit SHAs, license boundaries, and architectural takeaways.

---

## Reference Inventory Summary

| Project Name | Remote URL | Local Destination | Commit SHA | Retrieved Date | License | Cloned & Verified |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Rereflect** | `https://github.com/haqaliz/rereflect.git` | `references/rereflect/` | `987dd9f0611c693524ec0cfba880517fa4d5ec57` | 2026-10-28 | MIT License | **Yes** |
| **Feedback Intelligence Agent** | `https://github.com/DiogoRibeiro7/feedback-intelligence-agent.git` | `references/feedback-intelligence-agent/` | `9151b6de6c57099d63abefba10286264bb7042ac` | 2026-10-28 | MIT License | **Yes** |
| **SignalLoop** | `https://github.com/sainianuj07/signalloop.git` | `references/signalloop/` | `d504f40db0341727aebc5902394adf60980c640b` | 2026-10-28 | Custom / Study-Only | **Yes** |
| **Customer Feedback Analyzer GenAI** | `https://github.com/Sahajahanur/customer-feedback-analyzer-genai.git` | `references/customer-feedback-analyzer-genai/` | `acdfbca8e4226a6140b5b05ade60e6ba9c2b1171` | 2026-10-28 | Custom / Study-Only | **Yes** |
| **Reddit Clone** | `https://github.com/neilgebhard/reddit-clone.git` | `references/reddit-clone/` | `1bc5c167b811becc27e21b83a915612964b9ee3e` | 2026-10-28 | Custom / Study-Only | **Yes** |
| **React FastAPI Starter** | `https://github.com/w4zir/react-fastapi-starter.git` | `references/react-fastapi-starter/` | `453eeb6d7962fe9be5e5ef8afa52e7a9ea835974` | 2026-10-28 | Custom / Study-Only | **Yes** |
| **Existing Project (ai-feedback)** | `https://github.com/karthikeyakolli/ai-feedback` | `..\ai feedback project` | Local workspace | 2026-10-28 | MIT License | **Yes (157 tests pass)** |

> **Isolation Policy**: All reference repositories in `references/` are excluded via `.gitignore`. They are preserved with their own Git metadata, strictly isolated from production dependencies, never imported at runtime, and never bundled into frontend or backend builds.

---

## Detailed Inspection & Architectural Learnings

### Reference 1: Rereflect
- **Original URL**: `https://github.com/haqaliz/rereflect.git`
- **Checked-out Commit**: `987dd9f0611c693524ec0cfba880517fa4d5ec57` (branch: `master`)
- **License**: MIT License (Copyright 2026 Rereflect contributors). Permissive for conceptual adaptation.
- **Key Files Inspected**:
  - `backend/app/services/`: Decoupled business service layer separating API request serialization from database queries.
  - `backend/app/api/`: Versioned routing patterns.
- **Takeaways for Phase 2**:
  - Adopt a dedicated service layer (`services/post_service.py`, `services/comment_service.py`) keeping route handlers focused on HTTP validation and status codes.
  - Separate interactive CRUD from compute-intensive background jobs.
- **Anti-patterns Avoided**:
  - Do not introduce complex microservice or message-broker topologies until explicit scale requirements mandate them.

---

### Reference 2: Feedback Intelligence Agent
- **Original URL**: `https://github.com/DiogoRibeiro7/feedback-intelligence-agent.git`
- **Checked-out Commit**: `9151b6de6c57099d63abefba10286264bb7042ac` (branch: `main`)
- **License**: MIT License (Copyright 2026 Diogo Ribeiro). Permissive for conceptual adaptation.
- **Key Files Inspected**:
  - `src/rag/`: Retrieval pipelines, semantic reranking, and citation provenance.
  - `src/guardrails/`: Prompt-injection defense wrapping untrusted user inputs in isolated XML tags.
- **Takeaways for Phase 2/3**:
  - Treat all user contributions as untrusted content.
  - Enclose feedback text in distinct delimiters when passing to downstream services.
  - Return clear "insufficient evidence" disclosures when feedback volume is below qualitative thresholds (< 3 comments).
- **Anti-patterns Avoided**:
  - Avoid unconstrained multi-agent feedback loops that can stall or generate runaway LLM costs.

---

### Reference 3: SignalLoop
- **Original URL**: `https://github.com/sainianuj07/signalloop.git`
- **Checked-out Commit**: `d504f40db0341727aebc5902394adf60980c640b` (branch: `main`)
- **License**: No explicit root license. Handled strictly as study-only reference code.
- **Key Files Inspected**:
  - `app/models/`: Categorization of user contributions into operational taxonomy (Complaints, Praises, Feature Requests, Workarounds).
  - Prioritization matrices separating frequency from severity.
- **Takeaways for Phase 2**:
  - Model comments and post types to clearly differentiate product review requests from open problem discovery.
  - Preserve clear distinctions between upvote counts, comment frequencies, and severity ratings.
- **Anti-patterns Avoided**:
  - Multi-agent autonomous boardroom simulation.

---

### Reference 4: Customer Feedback Analyzer GenAI
- **Original URL**: `https://github.com/Sahajahanur/customer-feedback-analyzer-genai.git`
- **Checked-out Commit**: `acdfbca8e4226a6140b5b05ade60e6ba9c2b1171` (branch: `main`)
- **License**: No explicit root license. Handled strictly as study-only reference code.
- **Key Files Inspected**:
  - `api.py`: Clean FastAPI endpoints for feedback ingestion and validation.
  - `database.py`: Lightweight persistence layer for analytical history.
- **Takeaways for Phase 2**:
  - Standardized JSON responses for error handling and API health.
  - Pydantic models for request bodies and response filtering.
- **Anti-patterns Avoided**:
  - Monolithic script patterns that combine UI rendering with API calls.

---

### Reference 5: Reddit Clone
- **Original URL**: `https://github.com/neilgebhard/reddit-clone.git`
- **Checked-out Commit**: `1bc5c167b811becc27e21b83a915612964b9ee3e` (branch: `main`)
- **License**: No explicit root license. Handled strictly as study-only reference code.
- **Key Files Inspected**:
  - `schema.ts`: Supabase database schema defining `profiles`, `posts`, `comments`, and `post_votes`.
  - Nested comment rendering logic with indentation guides and responsive layout.
  - Unique vote constraints preventing duplicate upvotes per user.
- **Takeaways for Phase 2**:
  - Supabase table design: `profiles`, `posts`, `comments`, `post_votes`, `comment_votes`, `bookmarks`.
  - Database-enforced uniqueness: `UNIQUE(post_id, user_id)` on `post_votes` and `UNIQUE(comment_id, user_id)` on `comment_votes`.
  - Recursive threaded comments with clear visual nesting.
- **Anti-patterns Avoided**:
  - Reddit-style memetic noise. Our UI maintains an editorial, product-critique tone with explicit evidence tracking.

---

### Reference 6: React FastAPI Starter
- **Original URL**: `https://github.com/w4zir/react-fastapi-starter.git`
- **Checked-out Commit**: `453eeb6d7962fe9be5e5ef8afa52e7a9ea835974` (branch: `main`)
- **License**: No explicit root license. Handled strictly as study-only reference code.
- **Key Files Inspected**:
  - `frontend/vite.config.ts`: Proxy configuration forwarding `/api` to FastAPI.
  - `backend/app/main.py`: CORS middleware and router inclusion.
  - Client-side JWT token interceptor pattern for authenticated requests.
- **Takeaways for Phase 2**:
  - Authorization header forwarding (`Authorization: Bearer <token>`) from React to FastAPI.
  - Clean error propagation when authentication tokens expire or are malformed.

---

## Reproduction Commands

To replicate this local reference library from scratch:
```powershell
mkdir -p references
git clone --depth 1 https://github.com/haqaliz/rereflect.git references/rereflect
git clone --depth 1 https://github.com/DiogoRibeiro7/feedback-intelligence-agent.git references/feedback-intelligence-agent
git clone --depth 1 https://github.com/sainianuj07/signalloop.git references/signalloop
git clone --depth 1 https://github.com/Sahajahanur/customer-feedback-analyzer-genai.git references/customer-feedback-analyzer-genai
git clone --depth 1 https://github.com/neilgebhard/reddit-clone.git references/reddit-clone
git clone --depth 1 https://github.com/w4zir/react-fastapi-starter.git references/react-fastapi-starter
```
