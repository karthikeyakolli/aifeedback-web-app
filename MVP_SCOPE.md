# MVP Scope and Critical User Journey Specification

> **Document Type**: Phase 0 Core Deliverable  
> **Status**: `CONFIRMED SCOPE FREEZE`  
> **Version**: 1.0.0  
> **Date**: November 2, 2026  
> **Audience**: Product Management, Engineering Leads, QA  

---

## 1. MVP Purpose & Scope Freeze Rule

The Minimum Viable Product (MVP) has one paramount objective:
> **Deliver a dependable, end-to-end feedback loop where a developer can input their project context, receive grounded and actionable AI review findings, and track improvements without friction or fake metrics.**

Features that do not directly support this core journey are deferred to subsequent phases. No speculative features shall be introduced during the MVP build.

---

## 2. Step-by-Step Critical User Journey Specification

The MVP centers on the following 10-step critical path:
`Sign In` → `Personal Home` → `New Project` → `Project Setup` → `Save Project` → `Start AI Review` → `Processing` → `Feedback Report` → `Return to Project` → `Continue Improving`.

---

### Step 1: Sign In (`ACC-01` / `/login`)
- **User Goal**: Establish identity to access private project workspace.
- **Required Info**: Email and password (or demo login shortcut).
- **Main Action**: Click `Sign In`.
- **Expected Result**: Authenticated session established; JWT stored; redirect to `/personal`.
- **Validation**: Email format validation, password minimum 8 chars.
- **Error Conditions**: Invalid credentials (401), rate limited (429), unverified email.
- **Permission Check**: Publicly accessible; redirects to `/personal` if already authenticated.
- **Dependencies**: Supabase Auth or FastAPI local authentication service.

---

### Step 2: Personal Home (`PER-01` / `/personal`)
- **User Goal**: View existing projects or initiate a new project review.
- **Required Info**: None (fetches user's project list).
- **Main Action**: Click `New Project` (Dominant CTA).
- **Expected Result**: Navigates to `/personal/projects/new`.
- **Validation**: Project cards display correct status pills (`Draft`, `In Review`, `Reviewed`).
- **Error Conditions**: Network fetch failure shows empty state with `Retry` action.
- **Permission Check**: Strictly authenticated; visitor redirected to `/login`.
- **Dependencies**: `GET /api/v1/projects` (scoped by user ID).

---

### Step 3: New Project Wizard (`PER-02` / `/personal/projects/new`)
- **User Goal**: Define basic project identity.
- **Required Info**: Project Name (min 3 chars), Short Summary (min 15 chars), Primary Category.
- **Main Action**: Click `Continue to Setup`.
- **Expected Result**: Project draft created in database; navigates to `/personal/projects/:id/setup`.
- **Validation**: Inline real-time field validation; character counters.
- **Error Conditions**: Duplicate name (optional warning), validation error shows adjacent text.
- **Permission Check**: Project Owner authenticated session.
- **Dependencies**: `POST /api/v1/projects`.

---

### Step 4: Project Setup & Context Input (`PER-03` / `/personal/projects/:id/setup`)
- **User Goal**: Supply deep project context for the AI reviewer.
- **Required Info**: Detailed Project Description, Repository URL (GitHub/GitLab), Live Demo URL, Technical Stack tags, Optional documentation attachments.
- **Main Action**: Fill fields; observe the **Review Readiness Checklist** side panel.
- **Expected Result**: Draft automatically saved in background; checklist items mark green as completed.
- **Validation**: Valid URL structures; text area preserves input across reloads.
- **Error Conditions**: Invalid URL syntax shows inline hint.
- **Permission Check**: Owner only (`auth.uid() === project.user_id`).
- **Dependencies**: Auto-save draft endpoint `PATCH /api/v1/projects/:id`.

---

### Step 5: Save Project & Readiness Checklist Validation (`PER-03`)
- **User Goal**: Ensure project has sufficient depth before consuming AI review compute.
- **Required Info**: Checklist requires:
  1. Project name & summary valid.
  2. Description >= 50 words detailing problem & solution.
  3. At least one source link or documentation excerpt provided.
- **Main Action**: Inspect Review Readiness Checklist.
- **Expected Result**: When all criteria pass, the dominant CTA `Start AI review` transitions from disabled to active.
- **Validation**: Client-side & server-side checklist audit.
- **Error Conditions**: Incomplete context shows missing criteria with click-to-fix shortcuts.
- **Permission Check**: Owner only.
- **Dependencies**: Client validation engine.

---

### Step 6: Start AI Review (`PER-03` → `PER-04`)
- **User Goal**: Submit project context to the multi-angle AI review engine.
- **Required Info**: Project ID.
- **Main Action**: Click `Start AI review`.
- **Expected Result**: Review job dispatched; immediate navigation to `/personal/projects/:id/review`.
- **Validation**: Prevents double-clicking via immediate button loading state.
- **Error Conditions**: Server busy (503) or rate limit shows honest wait estimate.
- **Permission Check**: Owner only.
- **Dependencies**: `POST /api/v1/projects/:id/reviews`.

---

### Step 7: Review Processing & Live Status (`PER-04` / `/personal/projects/:id/review`)
- **User Goal**: Track authentic review execution progress.
- **Required Info**: Review Job ID.
- **Main Action**: Wait for completion or click `Back to project` (safe return).
- **Expected Result**: Displays real progress stages: `Ingesting context` → `Analyzing Usability & UX` → `Auditing Architecture & Security` → `Synthesizing Findings`. Automatically transitions to report when complete.
- **Validation**: Zero fake progress spinners; stages reflect actual backend worker signals.
- **Error Conditions**: Worker timeout triggers clear `Retry Review` button without data loss.
- **Permission Check**: Owner only.
- **Dependencies**: WebSocket or polling endpoint `GET /api/v1/reviews/:id/status`.

---

### Step 8: AI Feedback Report Work Surface (`PER-05` / `/personal/projects/:id/feedback`)
- **User Goal**: Inspect comprehensive, categorized findings and recommendations.
- **Required Info**: Review ID.
- **Main Action**: Browse findings; click finding to inspect in Contextual Right Inspector.
- **Expected Result**: Findings displayed with severity pills (`Blocker`, `High`, `Medium`, `Low`), category tags, concise observation, and cited evidence.
- **Validation**: Non-color severity distinction (shape + icon + text).
- **Error Conditions**: Incomplete report shows error banner with regenerate option.
- **Permission Check**: Owner only (or public if project published).
- **Dependencies**: `GET /api/v1/projects/:id/feedback`.

---

### Step 9: Return to Project & Backlog Tracking (`PER-05` / `PER-06`)
- **User Goal**: Select an improvement to address in code.
- **Required Info**: Finding ID.
- **Main Action**: Click `Work on improvement` or update status to `In Progress` / `Addressed`.
- **Expected Result**: Finding resolution status updates immediately; reflected in project summary.
- **Validation**: Optimistic UI update with server synchronization.
- **Error Conditions**: Network sync failure reverts toggle and alerts user.
- **Permission Check**: Owner only.
- **Dependencies**: `PATCH /api/v1/findings/:id`.

---

### Step 10: Continue Improving (`PER-01` / `PER-05`)
- **User Goal**: Methodically resolve all blockers before releasing publicly.
- **Expected Result**: Project card on Personal Home reflects updated status (e.g. `Reviewed: 3/5 Addressed`).
- **Next Transition**: User can re-run review or proceed to Creator Showcase / Public Launch when satisfied.

---

## 3. Explicit MVP Boundary Matrix

| In Scope for MVP | Deferred to Post-MVP |
|---|---|
| User Authentication (Email/Password & Demo switch) | Third-party GitHub OAuth App permissions |
| Personal Projects Workspace & Draft persistence | Multi-user team collaboration & permissions |
| Review Readiness Checklist validation | Automated CI/CD GitHub Actions bot |
| Multi-angle AI Review (Gemini/Groq backend) | Real-time voice/audio briefing generation |
| Structured Findings with verifiable Citations | Automated Code Sandbox execution |
| Contextual Right Inspector (320px) | Creator monetization & paid reviews |
| Status tracking (`Open`, `In Progress`, `Addressed`) | Automated PR code patch generation |
| 3-Space Navigation Shell with Theme Engine | Public contest / hackathon leaderboards |
