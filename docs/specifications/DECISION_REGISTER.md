# Decision Register: AI Project Feedback Platform

> **Document Type**: Phase 0 Core Deliverable  
> **Status**: `AUDITED / ACTIVE GOVERNANCE`  
> **Version**: 1.0.0  
> **Date**: November 2, 2026  
> **Audience**: Principal Product Architect, Senior Product Manager, Engineering Team  

---

## 1. Governance Principles

1. **Classification Standard**: Every decision must be classified as `CONFIRMED`, `PROPOSED BASELINE`, `CONDITIONAL`, or `OPEN`.
2. **Approval Gate**: No `OPEN` decision may be silently resolved by assumptions in code. An explicit decision must be recorded before implementing irreversible logic.
3. **Traceability**: Changes to decisions must record date, old value, new value, reason, and approving authority.

---

## 2. Confirmed Product & Architectural Decisions

| Decision ID | Decision Summary | Status | Approved Authority | Date |
|---|---|---|---|---|
| **D-01** | The primary work/task surface receives maximum visual priority. | `CONFIRMED` | Constitution § 1 | 2026-11-01 |
| **D-02** | One screen = one meaning = one goal = one dominant action. | `CONFIRMED` | Constitution § 1 | 2026-11-01 |
| **D-03** | Product has 3 confirmed spaces: `Public`, `Personal`, `Creator`. | `CONFIRMED` | Architecture Spec | 2026-11-01 |
| **D-04** | Space switching modifies navigation context only; never alters data visibility or permissions. | `CONFIRMED` | Security Spec | 2026-11-02 |
| **D-05** | Zero fabricated scores, fake confidence percentages, or fake progress spinners. | `CONFIRMED` | Constitution § 12 | 2026-11-01 |
| **D-06** | Status and severity must be distinguished by shape, icon, and text—never color alone (WCAG 2.2 AA). | `CONFIRMED` | Visual System § 8 | 2026-11-02 |
| **D-07** | Collapsible desktop sidebar (250px expanded / 72px rail) with accessible tooltips on rail items. | `CONFIRMED` | Shell Spec | 2026-11-02 |
| **D-08** | Multi-angle review rubric evaluates 5 dimensions: UX, Performance, Security, Architecture, Bugs. | `CONFIRMED` | AI Spec | 2026-11-02 |
| **D-09** | Minimum touch target size of 40x40px practical / 44x44px touch viewports. | `CONFIRMED` | A11y Spec | 2026-11-02 |
| **D-10** | Light, Dark, and System theme support with zero flash and contrast >= 4.5:1. | `CONFIRMED` | Theme Spec | 2026-11-01 |

---

## 3. Open Product Decisions Requiring Stakeholder Approval

---

### Decision ID: `DEC-OPEN-01`
- **Question**: What is the canonical project repository source integration model for the MVP?
- **Why It Matters**: Affects whether the backend clones repositories and executes static analysis via Git CLI, or if it inspects user-provided links and text excerpts via LLM context.
- **Available Options**:
  - *Option A*: **Link & Text Ingestion (Recommended)**. The user supplies repository URLs, README excerpts, and architectural markdown. The AI analyzes the submitted context.
  - *Option B*: **Server-Side Git Cloning**. The server clones the repository into a sandbox and runs linters/parsers.
- **Recommended Option**: **Option A (Link & Text Ingestion)**. Safe, scalable, avoids running untrusted code on the backend, and delivers instant MVP value.
- **Impact**: Backend compute, security surface, and MVP timeline.
- **Status**: `OPEN` (Recommended: Option A)
- **Approval Required**: Lead Architect / Product Manager.

---

### Decision ID: `DEC-OPEN-02`
- **Question**: Should an unauthenticated visitor be able to trigger an AI review as a guest demo?
- **Why It Matters**: Affects API abuse, server cost, rate limiting, and onboarding friction.
- **Available Options**:
  - *Option A*: **Require Sign In Before Review (Recommended)**. Visitors can view sample reports on the landing page, but must create an account/sign in to review their own project.
  - *Option B*: **Ephemeral Guest Review**. Allow 1 anonymous review stored in `localStorage`, prompting account creation to save findings.
- **Recommended Option**: **Option A**. Prevents API quota exhaustion, ensures RLS ownership from second one, and protects user data.
- **Impact**: Authentication flow, API security, bot protection.
- **Status**: `OPEN` (Recommended: Option A)
- **Approval Required**: Product Manager.

---

### Decision ID: `DEC-OPEN-03`
- **Question**: What are the exact permissions and capabilities of the `Creator` space in the MVP?
- **Why It Matters**: Avoids over-engineering a marketplace or monetization engine before core feedback loop is verified.
- **Available Options**:
  - *Option A*: **Showcase Studio + AI Review Lab (Recommended)**. Focus Creator space on assembling public showcases from reviewed projects and developer AI prompt benchmarking.
  - *Option B*: **Full Monetization & Paid Peer Marketplace**. Add paid review bookings, Stripe payouts, and creator subscriptions.
- **Recommended Option**: **Option A**. Preserves MVP focus while satisfying the requirement for a distinct Creator space.
- **Impact**: Payment gateway dependencies, compliance, schema complexity.
- **Status**: `OPEN` (Recommended: Option A)
- **Approval Required**: Product Manager.

---

### Decision ID: `DEC-OPEN-04`
- **Question**: How should Review Readiness validation thresholds be calibrated?
- **Why It Matters**: Setting the threshold too high discourages early testing; setting it too low wastes AI tokens on empty prompts.
- **Available Options**:
  - *Option A*: **Balanced Checklist (Recommended)**:
    1. Project name (min 3 chars)
    2. Summary (min 15 chars)
    3. Category selected
    4. Description >= 50 words OR valid repository URL provided.
  - *Option B*: **Strict Mandatory Spec**: Requires full architecture spec document, repository link, and live demo URL before review button is enabled.
- **Recommended Option**: **Option A**. Allows flexible input while guaranteeing sufficient signal for the AI model.
- **Impact**: Conversion rate on `PER-03` setup page.
- **Status**: `OPEN` (Recommended: Option A)
- **Approval Required**: Product Manager / UX Lead.

---

### Decision ID: `DEC-OPEN-05`
- **Question**: How is AI review execution delivered to the client (Synchronous vs. Asynchronous)?
- **Why It Matters**: Full multi-angle reviews using Gemini 2.5 Flash / Groq take 4–10 seconds, which exceeds ideal synchronous HTTP request timeouts on slower connections.
- **Available Options**:
  - *Option A*: **Asynchronous Job with SSE / Status Polling (Recommended)**. `POST /reviews` returns 202 Accepted with a Job ID. Client navigates to `PER-04` and polls or streams progress updates.
  - *Option B*: **Single Long-Lived Synchronous HTTP Request**. Client waits on a hanging POST request.
- **Recommended Option**: **Option A**. Resilient against network drops, supports realistic stage indicators, and provides clean error recovery.
- **Impact**: Backend job queue / database state machine and frontend status screen.
- **Status**: `OPEN` (Recommended: Option A)
- **Approval Required**: Principal Backend Architect.

---

## 4. Change Log Template

| Date | Decision ID | Previous Value | New Value | Reason | Approved By |
|---|---|---|---|---|---|
| 2026-11-02 | Initial Audit | — | D-01 through D-10 | Phase 0 Discovery & Audit | Architecture Team |
