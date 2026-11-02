# 16 — Phase-Wise Implementation Build Plan

> **Governance Notice:** This build plan organizes the implementation of the AI Project Feedback product into discrete, verifiable engineering phases. Each phase has strict entry criteria, implementation tasks, testing mandates, and exit criteria based on `01_PRODUCT_DESIGN_CONSTITUTION.md` through `15_PAGE_QA_AND_ACCEPTANCE.md`.
> **Rule:** Never execute multiple phases simultaneously. Complete and verify one phase before requesting progression to the next.

---

## Phase Matrix Overview

| Phase | Title | Scope & Routes | Primary Objective |
|---|---|---|---|
| **Phase 1** | **Design Tokens, Typography, Themes & Core Primitives** | Design System, `styles/`, Base Controls | Establish semantic design tokens, WCAG 2.2 contrast, light/dark/system themes, and core button/overlay primitives. |
| **Phase 2** | **Global Application Shell & 3-Space Navigation** | Shell, Sidebar, Header, 3-Space Switcher | Build desktop sidebar (expanded/collapsed rail with tooltips), header (`⌘K` palette), 3-space switcher, and mobile drawer/bottom bar. |
| **Phase 3** | **Public Space (`PUB-00` to `PUB-03`)** | `/`, `/public`, `/public/projects/:id`, `/public/creators/:id` | Implement public discovery, landing page with grounded preview, explore feed, and public project detail. |
| **Phase 4** | **Personal Space: Project Workspace & Setup (`PER-01` to `PER-04`)** | `/personal`, `/personal/projects/new`, `.../setup`, `.../review` | Build private project management, new project wizard, project context setup with readiness checklist, and honest review processing. |
| **Phase 5** | **AI Feedback Report & Grounded Review Studio (`PER-05` to `PER-07`)** | `.../feedback`, `.../feedback/:findingId`, `.../history` | Implement AI feedback report work surface, evidence citations, severity tags, collapsible inspector, finding detail, and version diffing. |
| **Phase 6** | **Creator Space, Account Flows & System Hardening (`CRE-01` to `CRE-03`, `ACC`, `SET`)** | `/creator/*`, `/sign-in`, `/sign-up`, `/onboarding`, `/settings` | Implement creator studio/workspace, account authentication & onboarding, WCAG 2.2 AA audit, responsive verification, and QA sign-off. |

---

## Detailed Phase Specifications

### Phase 1: Design Tokens, Typography, Theme Engine & Core Primitives

#### 1. Entry Criteria
- Design specification documents `01` through `15` reviewed and accepted.
- Current repository dependencies inspected (React 19, Vite, Tailwind CSS v4, Lucide).

#### 2. Key Tasks
1. **Semantic Color & Elevation Tokens (`10_VISUAL_DESIGN_SYSTEM.md`)**:
   - Define semantic CSS variables in `frontend/src/index.css`: `--canvas`, `--surface`, `--surface-raised`, `--surface-hover`, `--text-primary`, `--text-secondary`, `--text-muted`, `--border-default`, `--border-strong`, `--accent`, `--accent-foreground`, `--focus-ring`, `--status-success`, `--status-warning`, `--status-danger`, `--status-info`.
   - Ensure all tokens pass contrast checks in light, dark, and system themes.
2. **Typography & Spacing Scale**:
   - Implement 4px spacing scale and strict typography hierarchy (Display, Page Title, Section Heading, Body, Metadata, Button).
3. **Button & Control Primitive System (`08_BUTTON_AND_CONTROL_CATALOG.md`)**:
   - Implement unified `<Button>` component supporting variants: `primary`, `secondary`, `ghost`, `destructive`, and `icon-only`.
   - Enforce states: default, hover (translateY -1px), focus-visible (2px ring), pressed (translateY 1px), disabled, and loading (spinner with truthful active text).
   - Practical 40–44px minimum hit targets.
4. **Accessible Overlays (Radix + Tailwind)**:
   - Dialog / Modal with focus trap and Escape key dismiss.
   - Sheet / Drawer (for collapsible side panels and mobile sheets).
   - Tooltip (immediate on keyboard focus, 250ms dwell on pointer hover).
   - Popover & Dropdown Menu.
5. **Motion Tokens (`09_MOTION_HOVER_AND_INTERACTION.md`)**:
   - Standardize animation durations: `motion-instant` (80ms), `motion-fast` (140ms), `motion-standard` (200ms), `motion-panel` (240ms).
   - Implement `prefers-reduced-motion` bypass.

#### 3. Verification & Exit Criteria
- [ ] Theme switcher switches seamlessly between Light, Dark, and System without style flash.
- [ ] Button component exhibits all documented interaction states.
- [ ] Dialog and Tooltip primitives pass keyboard navigation and ARIA checks.
- [ ] `npm run build` passes with zero errors.

---

### Phase 2: Global Application Shell & 3-Space Navigation Architecture

#### 1. Entry Criteria
- Phase 1 tokens and core primitives verified and operational.

#### 2. Key Tasks
1. **3-Space Switcher (`02_SPACES_AND_NAVIGATION.md`)**:
   - Switcher for `Public`, `Personal`, and `Creator` with distinct section indicators.
   - Enforce that space switching changes view context only and never alters content publication permissions.
2. **Collapsible Desktop Sidebar (`02_SPACES_AND_NAVIGATION.md`)**:
   - Expanded state: 224–256px with icon + text labels.
   - Collapsed rail: 68–72px with icon only, displaying full label on focus and 250ms hover dwell.
   - Collapse/expand toggle with spring motion (220ms).
3. **Global App Header**:
   - Breadcrumb navigation, current page title, global search command palette trigger (`⌘K`), theme selector, notifications bell, and user avatar.
4. **Contextual Right Inspector (Collapsible)**:
   - 280–340px right panel layout (`1fr / 300px` split) with smooth toggle.
5. **Responsive Mobile Shell**:
   - Bottom navigation bar for primary destinations on mobile (< 640px).
   - Sliding sheet drawer for space switcher and secondary links.

#### 3. Verification & Exit Criteria
- [ ] Sidebar collapses and expands cleanly with zero layout flicker.
- [ ] Tooltips on collapsed rail reveal correctly on keyboard focus and pointer hover.
- [ ] Mobile bottom navigation and drawer function smoothly on touch viewports (390px).
- [ ] Space switching is immediate and preserves active draft states.

---

### Phase 3: Public Space Implementation (`PUB-00` to `PUB-03`)

#### 1. Entry Criteria
- Phase 2 Shell and navigation operational.

#### 2. Key Tasks
1. **`PUB-00` Product Landing Page (`/`)**:
   - One dominant action: `Get started` / `Create account`.
   - Real, grounded product preview showing sample AI feedback findings (no fake claims).
   - 3-step explanation of the feedback workflow.
   - Honest trust & limitations section explaining what AI can and cannot do.
2. **`PUB-01` Public Explore (`/public`)**:
   - Search bar with debounced query.
   - Category filter popover and sorting menu (Recent, Most Feedback).
   - Responsive project cards (title, summary, category pills, review count).
   - Skeletons, empty states, and no-results states with reset action.
3. **`PUB-02` Public Project Detail (`/public/projects/:projectId`)**:
   - Back to explore button preserving filters.
   - Project overview, maker credentials, live repository/demo links.
   - Public community reviews and feedback thread.
4. **`PUB-03` Public Creator Profile (`/public/creators/:creatorId`)**:
   - Conditional creator showcase displaying public projects, bio, and technical credentials.

#### 3. Verification & Exit Criteria
- [ ] Landing page hero renders cleanly with 1 dominant CTA.
- [ ] Explore page filters and sorts dynamically with live search.
- [ ] Project detail page renders without dashboard clutter.
- [ ] Passes all `15_PAGE_QA_AND_ACCEPTANCE.md` checks for Public space.

---

### Phase 4: Personal Space: Project Workspace & Setup (`PER-01` to `PER-04`)

#### 1. Entry Criteria
- Public space verified; user authentication state accessible.

#### 2. Key Tasks
1. **`PER-01` Personal Home / My Projects (`/personal`)**:
   - Work surface: recent projects list/table with status pills (`Draft`, `In Review`, `Reviewed`, `Archived`).
   - One dominant action: `New project` (or `Continue project` if draft active).
   - Project overflow menu: Rename, Archive, Delete with high-impact danger confirmation dialog.
2. **`PER-02` New Project Wizard (`/personal/projects/new`)**:
   - Single-column form (680–760px) with inline validation.
   - Required fields: Project Name, Summary, Category.
   - Dominant action: `Continue` (creates project record and advances to setup).
3. **`PER-03` Project Setup & Context (`/personal/projects/:projectId/setup`)**:
   - Inputs for project description, repository/demo URL, and document attachments with upload progress.
   - Review Readiness Checklist side panel (validates actual criteria; no fake percentages).
   - Dominant action: `Start AI review` (disabled until prerequisites pass).
4. **`PER-04` Review Processing (`/personal/projects/:projectId/review`)**:
   - Truthful review progress indicator based on real server events (no animated fake counters).
   - Actions to cancel or return to project draft safely.

#### 3. Verification & Exit Criteria
- [ ] User can create, edit, and delete personal projects.
- [ ] Form values are preserved in local draft storage on unexpected navigation.
- [ ] Review readiness checklist correctly enables `Start AI review` only when valid.
- [ ] Passes `15_PAGE_QA_AND_ACCEPTANCE.md` checks for Personal space.

---

### Phase 5: AI Feedback Report & Grounded Review Studio (`PER-05` to `PER-07`)

#### 1. Entry Criteria
- Phase 4 setup and backend review processing endpoints connected.

#### 2. Key Tasks
1. **`PER-05` AI Feedback Report (`/personal/projects/:projectId/feedback`)**:
   - Work surface: categorized feedback findings (UX, Performance, Architecture, Security, Code Quality).
   - Finding cards: title, severity badge (Icon + Text), concise observation, and recommendation.
   - Grounded citations: each finding links to specific reviewer comments or code files.
   - Collapsible 300px right inspector for finding summary and quick actions.
   - Dominant action: `Select next improvement` / `Add to Roadmap`.
2. **`PER-06` Finding Detail (`/personal/projects/:projectId/feedback/:findingId`)**:
   - Deep dive into individual finding with full evidence quotes and suggested implementation steps.
   - Action to `Mark as addressed` or `Export finding`.
3. **`PER-07` History & Version Evolution (`/personal/projects/:projectId/history`)**:
   - Timeline comparing v1.0 feedback vs v1.1 improvements.
   - Code and report visual diffs confirming resolved issues.

#### 3. Verification & Exit Criteria
- [ ] AI feedback findings render with explicit source citations.
- [ ] Severity badges use text + icon (never color alone).
- [ ] Collapsible inspector operates smoothly at 60 FPS without layout shift.
- [ ] Version history compares iterations accurately.

---

### Phase 6: Creator Space, Account Flows & System Hardening (`CRE-01` to `CRE-03`, `ACC`, `SET`)

#### 1. Entry Criteria
- Phase 5 feedback studio operational.

#### 2. Key Tasks
1. **Creator Space (`CRE-01`, `CRE-02`, `CRE-03`)**:
   - `CRE-01` Creator Home: Creator workspace and public release status overview.
   - `CRE-02` Creator Workspace / Editor: Main creation canvas with tools palette and preview.
   - `CRE-03` Creator Profile / Presentation: Manage public creator branding and portfolio links.
   - Explicit publication guard: moving items to public requires two-step confirmation.
2. **Account & Settings (`ACC-01`, `ACC-02`, `ACC-03`, `SET-01`)**:
   - `ACC-01` Sign In & `ACC-02` Sign Up with password toggle and inline validation.
   - `ACC-03` Onboarding setup for first-run preferences.
   - `SET-01` Global Settings: theme selection, notification triggers, and API integrations.
3. **Comprehensive Hardening & Quality Assurance**:
   - Full automated test suite run (FastAPI backend pytest + frontend unit tests).
   - WCAG 2.2 AA accessibility audit (axe-core, keyboard trap test, contrast audit).
   - Multi-device responsive test (360px mobile, 768px tablet, 1440px desktop).
   - Final verification sign-off using `15_PAGE_QA_AND_ACCEPTANCE.md`.

#### 3. Verification & Exit Criteria
- [ ] All 16 routes in `03_ROUTE_MAP_AND_PAGE_INDEX.md` render without placeholder dead controls.
- [ ] Full test suite passes with zero regressions.
- [ ] Final QA sign-off completed across all 10 inspection categories.

