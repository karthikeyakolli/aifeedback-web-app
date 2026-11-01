# UX Design Decision Log & Architecture Audit

This log documents the friction points identified in the original application, the design decisions implemented to address them, the supporting research rationale, accessibility evaluations, and verification methods.

---

## Decision Matrix

### Decision 1: Ambient Onboarding vs. Modal Gate
* **Previous Friction**: New visitors landed on an unexplained feed without understanding the community's value proposition, norms, or how anonymous feedback integrates with AI research.
* **Implemented Design**:
  - Dismissible 3-pillar editorial banner (`Cho & Wash, 2021`) on the Home page explaining:
    1. *Candid Feedback* (anonymous or reputation-backed).
    2. *Bounded Threading* (structured civil debate).
    3. *Evidence Grounding* (verifiable AI PRD generation).
  - One-click dismissal with `localStorage` persistence, plus an ambient help icon to re-summon on demand.
* **Research Rationale**: Cho & Wash (2021) demonstrated that forced registration or onboarding overlays alienate prospective members; visible content exploration drives organic community adoption.
* **Accessibility & Verification**: Screen-reader accessible landmark `<section aria-label="Community Welcome and Overview">` with high contrast ratios. Verified via Vite production build and manual DOM inspection.

---

### Decision 2: Real-Time Post Guidance & Duplicate Suggestions
* **Previous Friction**: Creators risked posting duplicate topics or submitting vague, one-sentence feedback requests that yielded poor AI syntheses.
* **Implemented Design**:
  - Dynamic character count indicators on Title (`5 - 120 chars`) and Description (`20+ chars`).
  - Real-time duplicate discussion suggestions box (`Ribeiro et al., 2025`): compares title words against active discussions and surfaces similar existing threads non-intrusively.
  - Live Markdown Edit/Preview toggle.
  - Unsent draft auto-save to `localStorage` (`pri_draft_post`) with recovery indicator.
* **Research Rationale**: Ribeiro et al. (2025) proved that real-time, non-blocking post guidance dramatically improves submission quality without chilling creator motivation.
* **Accessibility & Verification**: Keyboard-navigable buttons; form elements have explicit `<label>` tags with `required` and `maxLength` attributes.

---

### Decision 3: Bounded Conversation Threading ($D \le 2$)
* **Previous Friction**: Unbounded recursive comment nesting caused extreme horizontal cramping ("staircase collapse") on mobile viewports, shrinking readable text areas to a sliver.
* **Implemented Design**:
  - Physical CSS margin/padding indentation is strictly bounded to `MAX_VISUAL_DEPTH = 2`.
  - Replies at depth $\ge 3$ align with depth 2 margins and render an indigo accent border with a `"depth {n} · Replying to @Author"` pill.
  - Thread subtree collapse toggle (`[ — ]` / `[ + ]`) displaying the count of collapsed replies.
* **Research Rationale**: Aragón, Gómez, & Kaltenbrunner (2017) demonstrated that conversation threading beyond depth 2 creates cognitive fatigue and mobile abandonment unless visual indentation is bounded.
* **Accessibility & Verification**: Verified on mobile ($360$ px) and desktop ($1440$ px) viewports. Collapse buttons feature explicit `aria-label` tags.

---

### Decision 4: Draft Preservation & Keyboard Shortcuts
* **Previous Friction**: Network glitches, accidental page reloads, or clicking outside a comment composer permanently discarded user comments.
* **Implemented Design**:
  - Automatic `localStorage` caching per discussion and parent thread (`pri_draft_comment_{postId}_{parentId}`).
  - `Ctrl+Enter` / `Cmd+Enter` keyboard submission handler.
  - Inline error banners retain typed text upon network failure, enabling instant retry.
* **Research Rationale**: Nielsen Heuristic #5 (Error Prevention) & #9 (Help users recognize, diagnose, and recover from errors).
* **Accessibility & Verification**: Keyboard event listeners tested with `ctrlKey` / `metaKey`. Draft restored across page refreshes.

---

### Decision 5: Accessible Voting & Optimistic Concurrency
* **Previous Friction**: Upvote buttons lacked accessible state signaling (`aria-pressed`) and optimistic responsiveness, making voting feel sluggish.
* **Implemented Design**:
  - Touch targets sized to $44 \times 40$ px (WCAG 2.2 AA target size compliance).
  - Explicit ARIA attributes: `role="button"`, `aria-pressed={hasUpvoted}`, dynamic `aria-label`.
  - Optimistic local count increment with automatic rollback on network failure.
  - Server-side unique database constraint preventing double-voting.
* **Research Rationale**: Nielsen Heuristic #1 (Visibility of system status) and WCAG 2.2 SC 2.5.8 (Target Size).
* **Accessibility & Verification**: Tested with keyboard focus rings (`focus:ring-2 focus:ring-blue-500`).

---

### Decision 6: 3-Pane AI Research Workspace vs. Embedded Chatbot
* **Previous Friction**: The previous conversational AI feature was crammed into a single vertical card stack, separating questions from citations and lacking session context.
* **Implemented Design**:
  - Professional 3-pane workbench on desktop (`grid-cols-12`):
    1. *Left Pane* (3 cols): Past inquiry sessions, post metadata, and quick question prompts.
    2. *Center Pane* (6 cols): Conversation stream leading with direct answers, observed facts, hypotheses, follow-up pills, and feedback controls.
    3. *Right Pane* (3 cols): Evidence & Citation Inspector displaying verbatim source comments with a one-click `"Highlight in Discussion"` action.
  - Responsive collapsible side panels on tablet/mobile with header toggles.
* **Research Rationale**: Hong & Park (2025) 5-stage XAI framework; Bove et al. (2022) separation of ground truth from inference; Amershi et al. (2019) Guidelines for Human-AI Interaction.
* **Accessibility & Verification**: Responsive breakpoints tested across breakpoints (`lg:grid-cols-12`).

---

### Decision 7: Human-AI Feedback & Correction Controls
* **Previous Friction**: Users had no means to challenge inaccurate syntheses, correct assumptions, or give feedback on retrieved citations.
* **Implemented Design**:
  - Inline **Thumbs Up** / **Thumbs Down** rating buttons on every assistant response with immediate visual acknowledgment.
  - One-click **Regenerate** button querying the RAG pipeline with expanded context.
  - Interactive citation badges linking to verbatim quotes in the Evidence Inspector.
* **Research Rationale**: Zamfirescu-Pereira et al. (CHI 2026 Feedback by Design) demonstrated that low-barrier feedback mechanisms dramatically enhance trust in conversational systems.
* **Accessibility & Verification**: Screen-reader friendly buttons with title tooltips.

---

### Decision 8: Deterministic Opportunity Prioritization ($P_0 - P_3$)
* **Previous Friction**: Priority labels ($P_0, P_1, P_2, P_3$) appeared arbitrary and "hallucinated" by the LLM without mathematical grounding.
* **Implemented Design**:
  - Implemented an interactive **"Formula Breakdown"** card detailing the deterministic scoring equation:
    $$\text{Score} = (F \times 0.35) + (S \times 0.35) + (C \times 0.20) + (K \times 0.10)$$
  - Displays discrete sub-scores for Frequency ($/35$), Severity ($/35$), Consensus ($/20$), and Grounding Confidence ($/10$).
  - Explains priority threshold mapping ($P_0 \ge 85$, $P_1: 70-84$, $P_2: 50-69$, $P_3 < 50$).
* **Research Rationale**: Google PAIR Guidebook on calibration of user trust and explainable AI transparency.
* **Accessibility & Verification**: High-contrast typography and KaTeX/markdown-compatible math syntax.

---

### Decision 9: Real-Time Notification Center
* **Previous Friction**: Creators received no notification when other members reviewed their products or when AI research finished processing.
* **Implemented Design**:
  - Centralized notification bell in the Navbar with an unread badge.
  - Auto-polling every 30 seconds.
  - Category icons for replies, comments, AI analysis completions, and moderation alerts.
  - One-click "Mark all read" and direct deep linking to discussion comments.
* **Research Rationale**: Social translucence (Erickson & Kellogg, 2000) and community interactivity (Wise et al., 2006).
* **Accessibility & Verification**: Dropdown dismisses on outside click and Escape key.

---

### Decision 10: Non-Destructive Moderation Workspace
* **Previous Friction**: Content moderation lacked dedicated administrative tooling, risking either total inaction or harsh permanent deletions.
* **Implemented Design**:
  - Role-gated `/moderation` workspace accessible only to verified moderators (`user.isModerator`).
  - Non-destructive actions: **Hide Content** (soft delete toggling status to `'hidden'`), **Restore Content**, and **Dismiss Report**.
  - Discussion locking tool (`status = 'locked'`) to freeze new replies on inflamed posts while preserving historical feedback.
* **Research Rationale**: Wise, Hamman, & Thorson (2006) on moderation response rates and message interactivity.
* **Accessibility & Verification**: Verified with moderator and non-moderator auth sessions.

---

### Decision 11: Creator Personal Workspace & AI Research Studio Privacy Gating
* **Previous Friction**: The AI Research Insights tab was publicly visible to all community visitors and competitors on the public post page, which created privacy concerns for creators seeking sensitive customer feedback synthesis.
* **Implemented Design**:
  - Re-scoped the AI Research Studio into a **private, owner-exclusive Personal Workspace**.
  - Community visitors browsing a review request see only the clean, accessible public discussion thread without distraction or competitor intelligence leakage.
  - The project creator (and authorized moderators) see a prominent **"Creator Research Studio"** dock with a status badge (`🔒 Creator Research Studio (Private)`), toggle controls, and quick studio access.
  - On `MyActivityPage.tsx`, creators are provided direct **"Open Research Studio"** action buttons and review metrics for each of their published projects.
  - Server-side and client-side guards reject unauthorized access attempts (`HTTP 403 Forbidden` and client redirect).
* **Research Rationale**: Social translucence (Erickson & Kellogg, 2000) distinguishes between public social spaces and private reflective workspaces; Cho & Wash (2021) highlight the importance of low-clutter initial community landing views for newcomers.
* **Accessibility & Verification**: WCAG 2.2 AA compliant focus states, accessible button labels, and automated 403 authorization tests.

---

### Decision 12: Dual-Source RAG Grounding with Attached Project Documentation
* **Previous Friction**: Research inquiries were restricted exclusively to user feedback comments, meaning the AI could not compare user friction against the creator's intended architecture, PRD specifications, or pitch decks.
* **Implemented Design**:
  - Implemented creator document attachment capability supporting `.pdf`, `.md`, and `.txt` files up to 10 MB.
  - Extracted text via `pypdf` and UTF-8 decoders, indexed into paragraph chunks in `post_documents`.
  - Upgraded BM25 RAG engine (`DiscussionRetrievalService`) to index both community comments and attached specification paragraphs into a unified hybrid corpus.
  - The conversational assistant (`ResearchChatService`) and Evidence Inspector visually distinguish between **Community Feedback** and **Project Documentation** (`Doc: {filename}`) with source-specific provenance badges.
* **Research Rationale**: Google PAIR Guidebook on explainability and grounding; Amershi et al. (2019) Guideline 4 (Show contextually relevant information) and Guideline 11 (Make clear why the system did what it did).
* **Accessibility & Verification**: Zero-exception automated pytest coverage (`test_post_documents_and_workspace.py`) and clean production build.


