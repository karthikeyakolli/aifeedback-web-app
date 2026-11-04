# Route and Screen Inventory

> **Document Type**: Phase 0 Core Deliverable  
> **Status**: `CONFIRMED / AUDITED`  
> **Version**: 1.0.0  
> **Date**: November 2, 2026  
> **Audience**: Frontend Engineers, UX Architects, QA Leads  

---

## 1. Route Map Overview & Classification

Routes are categorized into:
- **`MVP`**: Essential for the end-to-end feedback workflow.
- **`CONDITIONAL`**: Implemented when supporting sub-capabilities are confirmed.
- **`FUTURE`**: Post-MVP expansion.

| Space | Route | Page ID | Page Name | Primary Action | Classification |
|---|---|---|---|---|---|
| **Public** | `/` | `PUB-00` | Product Landing | `Get Started` / `Explore` | **MVP** |
| **Public** | `/public` (or `/explore`) | `PUB-01` | Public Explore | Open project card | **MVP** |
| **Public** | `/public/projects/:id` | `PUB-02` | Public Project Detail | Read project / upvote | **MVP** |
| **Public** | `/public/creators/:id` | `PUB-03` | Public Creator Profile | Open creator item | `CONDITIONAL` |
| **Account** | `/login` / `/sign-in` | `ACC-01` | Sign In | Sign In | **MVP** |
| **Account** | `/signup` / `/sign-up` | `ACC-02` | Create Account | Create Account | **MVP** |
| **Account** | `/onboarding` | `ACC-03` | First-Time Setup | Complete Setup | `CONDITIONAL` |
| **Personal** | `/personal` | `PER-01` | Personal Home / Projects | `New Project` | **MVP** |
| **Personal** | `/personal/projects/new` | `PER-02` | New Project Wizard | `Continue to Setup` | **MVP** |
| **Personal** | `/personal/projects/:id/setup` | `PER-03` | Project Setup & Context | `Start AI review` | **MVP** |
| **Personal** | `/personal/projects/:id/review` | `PER-04` | Review Processing Status | Return / Retry | **MVP** |
| **Personal** | `/personal/projects/:id/feedback` | `PER-05` | AI Feedback Report | Select next improvement | **MVP** |
| **Personal** | `/personal/projects/:id/feedback/:findingId` | `PER-06` | Finding Deep-Dive | `Mark as Addressed` | `CONDITIONAL` (In Inspector) |
| **Personal** | `/personal/projects/:id/history` | `PER-07` | Review History & Diff | Open prior version | `CONDITIONAL` |
| **Creator** | `/creator` | `CRE-01` | Creator Studio | `New Showcase` / `Open Lab` | **MVP** |
| **Creator** | `/creator/workspaces/:id` | `CRE-02` | Creator Editor | `Save Showcase` | `CONDITIONAL` |
| **Creator** | `/creator/profile` | `CRE-03` | Creator Profile Presentation | `Save Profile` | `CONDITIONAL` |
| **Global** | `/settings` | `SET-01` | Preferences & Settings | `Save Preferences` | **MVP** |
| **Global** | `/developer` | `DEV-01` | Developer Workspace & AI Lab | Run Benchmark | **MVP** |
| **Global** | `/moderation` | `MOD-01` | Staff Moderation Queue | Approve / Flag | `CONDITIONAL` |

---

## 2. Detailed Screen Specifications (MVP Core)

### 1. `PUB-00` Product Landing Page (`/`)
- **Purpose**: Explain the product value honestly and invite the visitor to get started.
- **Access**: Public / Unauthenticated.
- **Dominant CTA**: `Get Started` (Navigates to `/login` or `/personal`).
- **Required Components**:
  - Hero with clear value proposition and primary CTA.
  - Interactive sample finding preview (demonstrating grounded observation + cited excerpt).
  - 3-step workflow diagram (`Submit Context` → `AI Review` → `Improve Product`).
  - Honest capabilities & limitations disclosure.
- **Responsive Plan**:
  - Desktop: Multi-column feature showcase with floating sample finding card.
  - Mobile (< 640px): Stacked single-column, 44px touch CTA, simplified preview.

---

### 2. `PUB-01` Public Explore Feed (`/public`)
- **Purpose**: Allow discovery of community projects intentionally published by creators.
- **Access**: Public / Read-Only.
- **Dominant CTA**: Project Card click (Opens `PUB-02`).
- **Required Components**:
  - Debounced search bar with clear button.
  - Category filter pills (`Developer Tools`, `Productivity`, `AI/ML`, etc.).
  - Project Cards displaying Name, Tagline, Category Pill, Review Count, and Upvote counter.
  - Skeletons and empty state with `Reset Filters` action.
- **Responsive Plan**:
  - Desktop: 3-column responsive grid (`grid-cols-3`).
  - Tablet: 2-column grid (`grid-cols-2`).
  - Mobile: Single-column cards with sticky search header.

---

### 3. `PER-01` Personal Home / My Projects (`/personal`)
- **Purpose**: Central hub for private projects; resume recent work or create a new project.
- **Access**: Authenticated (`Project Owner`).
- **Dominant CTA**: `New Project` (Primary Button).
- **Required Components**:
  - Projects table/list with Status Pills (`Draft`, `In Review`, `Reviewed`, `Archived`).
  - Project Overflow Menu (`Dropdown.tsx`): Rename, View Report, Archive, Delete.
  - Quick Search and filter by status.
  - Empty state with clear prompt to create the first project.
- **Responsive Plan**:
  - Desktop: Dense, structured list view with metadata columns.
  - Mobile: Stacked project cards with 44px tap targets; `New Project` pinned to bottom nav.

---

### 4. `PER-02` New Project Wizard (`/personal/projects/new`)
- **Purpose**: Establish project record with minimal cognitive load.
- **Access**: Authenticated (`Project Owner`).
- **Dominant CTA**: `Continue to Setup` (Advances to `PER-03`).
- **Required Components**:
  - Single-column form (max-w-[680px]).
  - Name input, Tagline input, Category selector dropdown.
  - Inline error messages adjacent to inputs.
  - Secondary action: `Cancel` (returns to `PER-01`).
- **Responsive Plan**:
  - Clean vertical stacking across all screen sizes.

---

### 5. `PER-03` Project Setup & Context Input (`/personal/projects/:id/setup`)
- **Purpose**: Supply context, architecture specs, and code links for AI evaluation.
- **Access**: Authenticated (`Project Owner`).
- **Dominant CTA**: `Start AI review` (Disabled until checklist passes).
- **Required Components**:
  - Multi-line Project Description text area with character counter.
  - Repository URL input (GitHub/GitLab) and Live Demo URL input.
  - Document attachment upload zone with file size & type validation.
  - **Review Readiness Checklist** side panel: Real-time validation of required fields.
- **Responsive Plan**:
  - Desktop: 2-column layout (Form 1fr, Checklist 300px).
  - Mobile: Single column; Checklist sticky at top or bottom sheet.

---

### 6. `PER-04` Review Processing Status (`/personal/projects/:id/review`)
- **Purpose**: Truthful display of review execution progress.
- **Access**: Authenticated (`Project Owner`).
- **Dominant CTA**: `View Feedback Report` (Appears upon completion).
- **Required Components**:
  - Real status timeline: `Ingesting context` → `Analyzing Usability` → `Auditing Architecture` → `Synthesizing Findings`.
  - Secondary action: `Back to project` (safe return).
  - Error recovery banner with `Retry Review` if job fails.
- **Responsive Plan**: Centered focused status card across all viewports.

---

### 7. `PER-05` AI Feedback Report Work Surface (`/personal/projects/:id/feedback`)
- **Purpose**: Main product work surface; presents findings and improvement actions.
- **Access**: Authenticated (`Project Owner` or Public if published).
- **Dominant CTA**: `Select next improvement` / `Work on blockers`.
- **Required Components**:
  - Executive summary and strengths card.
  - Categorized findings list (UX, Architecture, Security, Performance, Bugs).
  - Finding cards with Severity Pills (non-color shape + icon + text).
  - **Contextual Right Inspector (320px)**: Displays full evidence quotes, deep citations, and resolution status toggles (`Open` → `In Progress` → `Addressed`).
- **Responsive Plan**:
  - Desktop: Split layout (Report surface 1fr, Inspector 320px).
  - Tablet/Mobile: Full-width report; Inspector opens as slide-up drawer (`Drawer.tsx`).
