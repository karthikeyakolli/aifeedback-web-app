# Architectural Study: GitHub Reference Repositories

This document evaluates the seven assigned reference repositories to extract proven design patterns, workflow separations, and security practices while explicitly identifying anti-patterns to avoid.

---

## Reference A: Existing Project (ai-feedback)
- **Repository**: [https://github.com/karthikeyakolli/ai-feedback](https://github.com/karthikeyakolli/ai-feedback)
- **Local Location**: `c:\Users\OMEN\.gemini\antigravity-ide\scratch\ai feedback project`
- **Key Concepts Analyzed**:
  - `src/clustering.py`: TF-IDF vectorization with n-gram extraction and Sentence-Transformers (`all-MiniLM-L6-v2`) embeddings. Implements partition agreement metrics (Adjusted Rand Index) for comparing clustering stability.
  - `src/llm_engine.py`: Direct Google Gemini REST API client with RAG semantic retrieval using normalized cosine similarity, citation extraction (`cited_feedback_ids`), and hallucination detection (`hallucinated_ids`).
  - `src/recommendations.py`: Deterministic opportunity scoring integrating cluster volume, positive sentiment ratio, and applicability constraints.
  - `src/database.py`: SQLite schema managing project isolation, atomic run tracking, and conflict-resolution policies (`replace_all`, `skip`, `reassign_id`).
- **Patterns to Adopt**:
  - Reusing deterministic scoring formulas for frequency, severity, and consensus.
  - Reusing the strict citation validation logic from `src/llm_engine.py`.
  - Preserving local SQLite capability as a zero-setup offline fallback while using Supabase Postgres for the live multi-user community.
- **Patterns to Avoid**:
  - Monolithic Streamlit UI layout where execution re-runs the entire Python script on every user interaction.
  - Direct UI-to-database coupling without an API gateway.

---

## Reference B: Rereflect
- **Repository**: [https://github.com/haqaliz/rereflect](https://github.com/haqaliz/rereflect)
- **Key Concepts Analyzed**:
  - Layered multi-tier separation: decoupled frontend client, backend application service, and isolated analytics engine.
  - Asynchronous task processing for computationally intensive analysis requests.
  - Provider abstraction patterns for switching AI backends without altering API contracts.
- **Patterns to Adopt**:
  - Clean service layer in FastAPI (`services/post_service.py`, `services/ai_service.py`) keeping route handlers thin and focused on HTTP/Pydantic validation.
  - Decoupling interactive community requests (instant feed browsing) from analytical jobs.
- **Patterns to Avoid**:
  - Overly complex microservice topologies for an initial product. We use a unified FastAPI ASGI application with modular service packages.

---

## Reference C: Feedback Intelligence Agent
- **Repository**: [https://github.com/DiogoRibeiro7/feedback-intelligence-agent](https://github.com/DiogoRibeiro7/feedback-intelligence-agent)
- **Key Concepts Analyzed**:
  - Hybrid keyword and semantic retrieval for evidence retrieval.
  - Structured output schemas with strict validation.
  - Prompt-injection defenses when passing untrusted user text into LLM prompts.
  - Explicit uncertainty handling: system acknowledges when retrieved context does not contain sufficient signal to draw conclusions.
- **Patterns to Adopt**:
  - Enclosing untrusted user contributions in explicit sandboxing XML tags (`<user_contributions>`).
  - System prompts enforcing that the LLM must never obey instructions embedded within user comments.
  - Returning explicit "insufficient evidence" disclosures when feedback volume is below reliable thresholds (< 3 comments).
- **Patterns to Avoid**:
  - Unconstrained agentic loop recursion. We use a bounded single-call structured synthesis with deterministic post-validation.

---

## Reference D: SignalLoop
- **Repository**: [https://github.com/sainianuj07/signalloop](https://github.com/sainianuj07/signalloop)
- **Key Concepts Analyzed**:
  - Feedback taxonomy: classifying contributions into distinct operational buckets (Complaints, Praises, Feature Requests, Workarounds, Confusions).
  - Evidence-backed PRD generation: generating structured requirements with linked customer quotes.
  - Distinguishing severity from frequency (a critical bug mentioned twice is higher priority than a cosmetic tweak mentioned five times).
- **Patterns to Adopt**:
  - The four-bucket taxonomy in AI Insights: (1) Praises / Strengths, (2) Usability Friction / Complaints, (3) Feature Requests, (4) Conflicting Viewpoints.
  - Structured PRD generation linking problem statements directly to comment citations.
- **Patterns to Avoid**:
  - Multi-agent autonomous boardrooms or recursive committee debates that add latency, cost, and unpredictability to v1.

---

## Reference E: Customer Feedback Analyzer GenAI
- **Repository**: [https://github.com/Sahajahanur/customer-feedback-analyzer-genai](https://github.com/Sahajahanur/customer-feedback-analyzer-genai)
- **Key Concepts Analyzed**:
  - Minimalist, high-reliability FastAPI-to-LLM bridge.
  - Storing run history with timestamps and model metadata.
  - Graceful degradation when external LLM APIs exceed rate quotas.
- **Patterns to Adopt**:
  - Clear Pydantic response models for OpenAPI schema generation.
  - Resilient error handling mapping HTTP 429/503 from LLM providers to clean, human-readable client error messages.

---

## Reference F: Reddit-style Discussion Platform
- **Repository**: [https://github.com/neilgebhard/reddit-clone](https://github.com/neilgebhard/reddit-clone)
- **Key Concepts Analyzed**:
  - Information hierarchy of community discussion: post header, metadata pills, content body, voting sidebar, nested comment trees with indent lines and collapse toggles.
  - Optimistic voting updates with server rollback on failure.
  - Distinct author tags and anonymous badges.
- **Patterns to Adopt**:
  - Threaded comment hierarchy with recursive rendering and visual left-border depth guides.
  - High-density discussion layout focused on readability and rapid scanning.
  - Anonymous identity badge (`Anonymous Contributor`) visually distinguished from public creator profiles.
- **Patterns to Avoid**:
  - Generic social media noise (memes, infinite doomscrolling). Our layout is purposefully focused on product critique, review questions, and evidence-grounded insights.

---

## Reference G: React + FastAPI Starter
- **Repository**: [https://github.com/w4zir/react-fastapi-starter](https://github.com/w4zir/react-fastapi-starter)
- **Key Concepts Analyzed**:
  - Vite dev server with proxy configuration for seamless `/api` routing without CORS friction in local development.
  - Clean folder structure separating frontend TypeScript types from component implementations.
  - Centralized Axios/Fetch client with interceptors for JWT token injection.
- **Patterns to Adopt**:
  - Vite proxy configuration forwarding `/api` requests to FastAPI on `http://127.0.0.1:8000`.
  - Typed API client in `frontend/src/services/api.ts` with transparent fallback to realistic fixtures during UI shell prototyping.
