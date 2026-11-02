# Core User Flows Specification

> **Document Type**: Phase 0 Core Deliverable  
> **Status**: `CONFIRMED / ACTIONABLE`  
> **Version**: 1.0.0  
> **Date**: November 2, 2026  
> **Audience**: UX Designers, Frontend Engineers, QA  

---

## 1. Primary User Journeys Overview

The application architecture supports five distinct end-to-end user flows across the three spaces:

1. **Flow 1**: Visitor Discovery & Public Exploration (`PUB-00` → `PUB-01` → `PUB-02`)
2. **Flow 2**: Project Creation & Context Setup (`PER-01` → `PER-02` → `PER-03`)
3. **Flow 3**: AI Review Execution & Feedback Exploration (`PER-03` → `PER-04` → `PER-05` → `PER-06`)
4. **Flow 4**: Finding Resolution & Backlog Tracking (`PER-05` → `Inspector` → `Addressed`)
5. **Flow 5**: Intentional Public Launch / Showcase (`PER-01` → Confirmation Guard → `PUB-02`)

---

## 2. Flow 1: Visitor Discovery & Public Exploration

```mermaid
flowchart TD
    A["PUB-00 Landing Page"] -->|Click 'Explore Projects'| B["PUB-01 Public Explore Feed"]
    A -->|Click 'Get Started'| C["ACC-01 / ACC-02 Auth"]
    B -->|Search / Filter by Category| D["Filtered Projects List"]
    D -->|Click Project Card| E["PUB-02 Public Project Detail"]
    E -->|Click 'Back to Explore'| B
    E -->|Click Maker Profile| F["PUB-03 Public Creator Profile"]
```

- **Dominant Actions**:
  - `PUB-00`: `Get Started` (Navigates to Sign In / Sign Up).
  - `PUB-01`: Click Project Card (Opens `PUB-02`).
  - `PUB-02`: Read project breakdown & community reviews.
- **Boundary Condition**: Visitors cannot edit or post without authenticating. Filter state and scroll position are preserved when navigating back from `PUB-02` to `PUB-01`.

---

## 3. Flow 2: Project Creation & Context Setup

```mermaid
flowchart TD
    A["PER-01 Personal Home"] -->|Click 'New Project'| B["PER-02 New Project Wizard"]
    B -->|Enter Name, Summary, Category| C{"Form Valid?"}
    C -- No --> B
    C -- Yes -->|Click 'Continue'| D["Create Project Draft (POST /api/v1/projects)"]
    D --> E["PER-03 Project Setup & Context"]
    E -->|Enter Links, Description, Files| F["Auto-save Draft (PATCH /api/v1/projects/:id)"]
    F --> G{"Readiness Checklist Pass?"}
    G -- No --> H["Show Missing Items in Checklist Side Panel"]
    G -- Yes --> I["Enable 'Start AI review' CTA"]
```

- **Draft Recovery**: If the user reloads or navigates away while on `PER-03`, all input is preserved via local storage and periodic auto-save.
- **Readiness Checklist**: Validates description depth (>= 50 words), category selection, and valid URLs before activating the review trigger.

---

## 4. Flow 3: AI Review Execution & Feedback Exploration

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer
    participant UI as PER-03 Setup Page
    participant Poller as PER-04 Status Screen
    participant Worker as Backend Review Engine
    participant LLM as Multi-Model Evaluator
    participant Report as PER-05 Feedback Report

    Dev->>UI: Clicks "Start AI review"
    UI->>Worker: POST /api/v1/projects/:id/reviews
    Worker-->>UI: 202 Accepted (job_id: "rev_123")
    UI->>Poller: Redirect to /personal/projects/:id/review
    loop Every 1.5 seconds
        Poller->>Worker: GET /api/v1/reviews/rev_123/status
        Worker-->>Poller: { stage: "analyzing_architecture", progress: "evaluating" }
        Poller->>Poller: Update truthful stage indicator
    end
    Worker->>LLM: Multi-angle Evaluation Prompt
    LLM-->>Worker: Structured Findings + Evidence Citations
    Worker-->>Poller: { stage: "complete", report_id: "rep_456" }
    Poller->>Report: Navigate to /personal/projects/:id/feedback
    Report->>Dev: Render Categorized Findings & Severity Pills
```

- **Error Recovery Path**: If the review fails due to network or provider error, `PER-04` renders an explicit failure card with error reason and an active `Retry Review` button. The original project context is never lost.

---

## 5. Flow 4: Finding Resolution & Backlog Tracking

```mermaid
flowchart LR
    A["PER-05 Feedback Report"] -->|Click Finding Card| B["Open 320px Contextual Inspector"]
    B -->|Review Evidence Quote & Recommendation| C["Developer fixes issue in codebase"]
    C -->|Click 'Mark as Addressed'| D["PATCH /api/v1/findings/:id (status: addressed)"]
    D --> E["Severity Pill updates to Resolved (Green Check)"]
    E --> F["Project Progress Meter updates (e.g. 4/5 Resolved)"]
```

- **User Control**: Developers can reopen an addressed finding if further refinement is required.
- **Non-Color Accessibility**: Status transition changes both shape (from octagon/triangle to rounded-full) and icon (alert icon to checkmark) in addition to text.

---

## 6. Flow 5: Intentional Project Publication to Public Space

```mermaid
flowchart TD
    A["PER-01 / PER-03 Personal Project"] -->|Click 'Publish to Public'| B["Consent Modal (Modal.tsx)"]
    B --> C["Modal explains: Project will become discoverable in Public Explore"]
    C -->|User clicks 'Cancel'| D["Aborted: Project remains 100% Private"]
    C -->|User clicks 'Confirm & Publish'| E["PATCH /api/v1/projects/:id (is_public: true)"]
    E --> F["Toast: 'Project published to Public Explore'"]
    F --> G["Navigate to PUB-02 Public View"]
```

- **Inviolable Security Rule**: Publishing requires an explicit modal confirmation. Space switching between Personal, Public, and Creator NEVER triggers this flow automatically.

