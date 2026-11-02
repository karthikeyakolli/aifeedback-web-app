# Product Requirements Document (PRD)

> **Document Type**: Phase 0 Core Deliverable  
> **Status**: `CONFIRMED / AUDITED`  
> **Version**: 1.0.0  
> **Date**: November 2, 2026  
> **Audience**: Product Management, Engineering, Architecture, QA  

---

## 1. Requirements Audit & Gap Analysis

An exhaustive audit of the historical documentation (`docs/`), recent design packs (`AI_Project_Feedback_Design_Spec/`), existing database schemas (`supabase/migrations/`), and backend implementations (`backend/app/`) revealed key architectural contradictions and incomplete specifications:

### Critical Contradictions Identified & Resolved:
1. **Community Discussions vs. Structured Projects**:
   - *Legacy State*: The original codebase was modeled on open discussions, threaded anonymous comments, and moderation queues (`docs/COMMUNITY_UX.md`).
   - *Confirmed Product Direction*: The product's central entity is a **Software Project** (`PER-01` to `PER-07`). Community discussions now serve as an optional public layer (`PUB-02`), but private project feedback is the core value driver.
2. **Fabricated / Unverified Metrics**:
   - *Legacy State*: Some early prototypes proposed "Product Health Scores" (e.g. 84/100) or generic AI confidence percentages.
   - *Audit Resolution*: **Zero fabricated scores**. The Product Design Constitution explicitly bans pseudo-scientific scores and fake progress animations. Feedback is structured as grounded, verifiable observations with citations.
3. **Implicit Space Entanglement**:
   - *Legacy State*: A single sidebar navigated between all routes without clear visibility boundaries.
   - *Audit Resolution*: Strict **3-Space Separation** (`Public`, `Personal`, `Creator`). Space switching modifies navigation context only and never silently publishes data.

---

## 2. Requirement Classification Taxonomy

Every requirement in this specification is governed by strict evidence classification:
- **`CONFIRMED`**: Approved product requirements backed by core specifications.
- **`PROPOSED BASELINE`**: Sound architectural and UX recommendations introduced to make the system actionable.
- **`CONDITIONAL`**: Capabilities dependent on explicit third-party or prerequisite services.
- **`OPEN`**: Unresolved product decisions marked for explicit stakeholder decision.

---

## 3. Functional Requirements (FR)

### Module 1: Project Management (Personal Space)

| Req ID | Title | Description | Classification |
|---|---|---|---|
| **FR-PRJ-01** | Project Record Creation | Users can create a private project with Name, Tagline, Primary Category, and Target Audience. | `CONFIRMED` |
| **FR-PRJ-02** | Context Input & Links | Users can attach repository URLs (GitHub/GitLab), live demo URLs, architectural overviews, and markdown specifications. | `CONFIRMED` |
| **FR-PRJ-03** | Local Draft Persistence | In-progress project setups and edits must automatically save to local storage to prevent data loss on unexpected reload. | `CONFIRMED` |
| **FR-PRJ-04** | Document Attachments | Users can upload project documentation files (PDF, Markdown, TXT) up to 10MB per file with upload progress and removal controls. | `PROPOSED` |
| **FR-PRJ-05** | Project Lifecycle States | Projects exhibit explicit states: `Draft`, `Ready for Review`, `In Review`, `Reviewed`, `Archived`. | `CONFIRMED` |
| **FR-PRJ-06** | Project Destruction Safeguards | Project deletion requires an explicit confirmation modal describing the permanent consequence. | `CONFIRMED` |

### Module 2: AI Review Orchestration & Grounding

| Req ID | Title | Description | Classification |
|---|---|---|---|
| **FR-REV-01** | Review Readiness Checklist | Prior to triggering AI review, the platform validates minimum input criteria (valid name, description >= 50 words, valid URL or architecture summary). "Start AI review" is disabled until validated. | `CONFIRMED` |
| **FR-REV-02** | Multi-Angle Evaluation | AI review evaluates projects across 5 confirmed dimensions: Usability (UX), Performance, Security/Auth, Architecture, and Correctness/Bugs. | `CONFIRMED` |
| **FR-REV-03** | Grounded Citation Requirement | Every generated finding must quote or cite specific text from user-provided context or repository references. Hallucinated findings without citations are invalid. | `CONFIRMED` |
| **FR-REV-04** | Real Event Stream | During review processing (`PER-04`), progress reflects authentic server-sent events or job completion polling; fake animated counters are prohibited. | `CONFIRMED` |
| **FR-REV-05** | Failure Recovery | If the AI service fails or times out, the system displays an honest error message and provides a safe retry without losing input. | `CONFIRMED` |

### Module 3: Feedback Report & Work Surface

| Req ID | Title | Description | Classification |
|---|---|---|---|
| **FR-REP-01** | Structured Finding Cards | Findings display Finding Title, Severity Badge, Category, Concise Observation, Evidence Quote, and Recommended Action. | `CONFIRMED` |
| **FR-REP-02** | Non-Color Severity Differentiation | Severity levels (`Blocker`, `High`, `Medium`, `Low`, `Resolved`) must use distinct geometric shapes, icons, and text, never relying on color alone. | `CONFIRMED` |
| **FR-REP-03** | Contextual Right Inspector | Selecting a finding opens a 320px collapsible right panel showing deep citations, source excerpts, and implementation guidance. | `CONFIRMED` |
| **FR-REP-04** | Improvement Action Tracking | Users can update a finding's status (`Open`, `In Progress`, `Addressed`) to methodically track resolution. | `PROPOSED` |
| **FR-REP-05** | Version Diffing & History | When an updated review is executed, users can inspect prior review runs and compare resolved vs. persistent issues. | `CONDITIONAL` |

### Module 4: Public Space & Discovery

| Req ID | Title | Description | Classification |
|---|---|---|---|
| **FR-PUB-01** | Public Landing (`/`) | Landing page presents product purpose, 3-step workflow, grounded sample findings, honest capabilities/limitations, and one dominant CTA (`Get Started`). | `CONFIRMED` |
| **FR-PUB-02** | Public Explore Feed (`/public`) | Filterable list of intentionally published projects with debounced search, category filter, and review count indicators. | `CONFIRMED` |
| **FR-PUB-03** | Public Project Detail | Read-only view of a published project, maker credentials, live links, and public feedback contributions. | `CONFIRMED` |
| **FR-PUB-04** | Publication Consent Guard | Moving a project from Personal to Public requires an explicit toggle and confirmation modal detailing public visibility. | `CONFIRMED` |

### Module 5: Creator Space (Showcase & Studio)

| Req ID | Title | Description | Classification |
|---|---|---|---|
| **FR-CRE-01** | Creator Studio (`/creator`) | Dedicated workbench for organizing launch assets, public showcase descriptions, and maker portfolio. | `CONFIRMED` |
| **FR-CRE-02** | AI Review Testing Lab | Interactive developer sandbox for testing different AI prompt variations, models (Gemini Flash vs. Groq), and synthetic test runs. | `CONFIRMED` |
| **FR-CRE-03** | Public Maker Profile | Public presentation showcasing a creator's verified projects, technical credentials, and contribution history. | `CONDITIONAL` |

---

## 4. Non-Functional Requirements (NFR)

### NFR-01: Accessibility (WCAG 2.2 Level AA)
- **Contrast**: All text and critical UI elements must achieve a contrast ratio of at least 4.5:1 against their background (3:1 for large text and UI components).
- **Keyboard Navigation**: All interactive controls must be fully operable via keyboard (`Tab`, `Shift+Tab`, `Enter`, `Space`, `Escape`, arrow keys). Focus rings must be high-contrast and never suppressed.
- **Screen Reader Support**: All icons must have accessible labels (`aria-label`) or be marked `aria-hidden="true"`. Dialogs and drawers must implement ARIA roles and trap focus.
- **Touch Targets**: Minimum hit box of 40x40px (practical) and 44x44px (touch viewports).

### NFR-02: Performance & Responsiveness
- **First Contentful Paint (FCP)**: < 1.2s on desktop broadband; < 1.8s on 4G mobile.
- **Cumulative Layout Shift (CLS)**: < 0.05. Layout must never jitter during sidebar collapse or theme changes.
- **Interaction to Next Paint (INP)**: < 100ms for all button clicks and panel toggles.
- **Streaming Response**: AI review output begins streaming within 1.5s of worker dispatch.

### NFR-03: Security & Privacy
- **Privacy by Default**: All projects created in Personal space are strictly private with row-level security (RLS) enforcement.
- **Credential Isolation**: AI API keys (Google Gemini, Groq) and Supabase service role keys reside strictly on the server; never exposed to client bundles.
- **Input Sanitization**: All user inputs (project descriptions, markdown comments) are sanitized against XSS and stored securely.
- **Zero Cross-Space Leaks**: Space switching modifies visual routing only; API endpoints strictly enforce user token authentication regardless of client space state.

### NFR-04: Theme & Ergonomics
- Seamless support for **Light**, **Dark**, and **System** themes with zero-flash rendering.
- Full respect for user's `prefers-reduced-motion` settings.
