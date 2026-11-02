# Page Design Specifications: Approved MVP Screens

> **Document Type**: Phase 1 Core Deliverable  
> **Status**: `CONFIRMED / DETAILED SCREEN SPECIFICATIONS`  
> **Version**: 1.0.0  
> **Date**: November 2, 2026  
> **Audience**: Frontend Developers, UI Designers, QA Engineers  

---

## 1. Overview & Specification Index

This document details the exact layout, hierarchy, interaction states, and accessibility mandates for all approved MVP screens:

1. [`ACC-01`: Sign In](#1-acc-01-sign-in)
2. [`ACC-02`: Sign Up](#2-acc-02-sign-up)
3. [`PER-01`: Personal Home / My Projects](#3-per-01-personal-home--my-projects)
4. [`PER-02`: New Project Wizard](#4-per-02-new-project-wizard)
5. [`PER-03`: Project Setup & Context Input](#5-per-03-project-setup--context-input)
6. [`PER-03-CHK`: AI Review Preparation & Readiness Checklist](#6-per-03-chk-ai-review-preparation--readiness-checklist)
7. [`PER-04`: AI Review Processing Status](#7-per-04-ai-review-processing-status)
8. [`PER-05`: AI Feedback Report Work Surface](#8-per-05-ai-feedback-report-work-surface)
9. [`PER-06`: Finding Detail & Remediation Inspector](#9-per-06-finding-detail--remediation-inspector)
10. [`PUB-02`: Project Details View](#10-pub-02-project-details-view)

---

## 1. `ACC-01`: Sign In

- **Purpose**: Authenticate an existing developer securely to access private workspaces.
- **User Goal**: Enter credentials and immediately resume personal project review work.
- **Layout**: Centered card (`max-w-[420px]`) on subtle canvas; zero distraction.
- **Hierarchy**: Brand Icon → "Welcome Back" Heading → Email Input → Password Input → Primary Action → Demo Login → Sign Up Link.
- **Dominant Primary Action**: `Sign In` (Solid accent button).
- **Secondary Actions**: `Sign in as Demo Creator`, `Forgot password?`, `Create account`.
- **Components**: `<Button>`, `<Input>`, `<ThemeSwitcher>`.
- **States**:
  - *Default*: Clean empty inputs with clear labels.
  - *Loading*: Button displays spinner: *"Authenticating..."*; inputs disabled.
  - *Error*: Red banner above inputs: *"Invalid email or password"*; password field cleared.
  - *Success*: Immediate transition to `/personal` (or `returnUrl`).
- **Responsive**: Full-width padding on mobile; centered card on desktop.
- **Accessibility**: Form wrapped in `<form>`; inputs linked with labels; error announced with `role="alert"`.

---

## 2. `ACC-02`: Sign Up

- **Purpose**: Create a new verified user account.
- **User Goal**: Establish project ownership identity with minimal friction.
- **Layout**: Centered single-column card (`max-w-[440px]`).
- **Hierarchy**: Brand Icon → "Create Account" Heading → Display Name → Email → Password (min 8 chars) → Primary Action → Sign In Link.
- **Dominant Primary Action**: `Create Account` (Solid accent button).
- **Secondary Actions**: `Sign In` (for existing users).
- **Components**: `<Button>`, `<Input>`.
- **States**:
  - *Default*: Inputs empty with format requirements displayed beneath.
  - *Validation*: Password field shows inline meter: *"Minimum 8 characters"*.
  - *Loading*: Button spinner: *"Creating account..."*.
  - *Error*: Inline error: *"An account with this email already exists"*.
  - *Success*: Success screen: *"Account created. Redirecting to workspace..."*.
- **Responsive & A11y**: Standard single-column stacking; labeled inputs.

---

## 3. `PER-01`: Personal Home / My Projects

- **Purpose**: Central command center for private projects and review reports.
- **User Goal**: Review project status or start a new evaluation.
- **Layout**: Standard desktop shell (`Sidebar` + `Main Content Canvas`).
- **Hierarchy**: Breadcrumbs (`Personal > My Projects`) → Page Title & Subtitle → Search & Filter Bar → Project Cards/Table → Pagination.
- **Dominant Primary Action**: `+ New Project` (Solid accent button in header).
- **Secondary Actions**: Search input, status filter (`All`, `Reviewed`, `In Review`, `Draft`), project card context menu (Rename, Archive, Delete).
- **Components**: `<Button>`, `<Input>`, `<ProjectCard>`, `<Dropdown>`, `<SeverityPill>`.
- **States**:
  - *Empty State*: High-contrast card with illustration: *"No projects created yet. Start by adding your first project context for AI evaluation."* with large `Create Your First Project` button.
  - *Loading*: 3 animated shimmer skeleton cards matching table layout.
  - *Error*: *"Failed to load projects"* with an active `Retry` button.
- **Responsive**: Full desktop table collapses to touch-friendly cards on mobile with 44px tap targets.

---

## 4. `PER-02`: New Project Wizard

- **Purpose**: Create a clean project record with minimal cognitive load.
- **User Goal**: Supply core identity to establish draft.
- **Layout**: Focused single-column container (`max-w-[680px]`) centered on canvas.
- **Hierarchy**: Breadcrumbs (`Personal > Projects > New`) → Step Title → Name Field → Tagline Field → Category Selector → Action Footer.
- **Dominant Primary Action**: `Continue to Setup` (Primary Button).
- **Secondary Actions**: `Cancel` (returns safely to `PER-01`).
- **Components**: `<Input>`, `<Select>`, `<Button>`.
- **States**:
  - *Validation*: Inline validation enforces name (>= 3 chars) and tagline (>= 15 chars).
  - *Loading*: Spinner on button: *"Establishing project..."*.
- **Responsive**: 100% width on mobile with sticky bottom action footer.

---

## 5. `PER-03`: Project Setup & Context Input

- **Purpose**: Collect architectural specifications, code repository links, and context for AI review.
- **User Goal**: Provide comprehensive context and verify readiness.
- **Layout**: 2-Column Desktop Split (`1fr / 300px`). Left: Form inputs; Right: Readiness Checklist.
- **Hierarchy**: Page Title → Description Textarea → Repository URL → Live Demo URL → File Attachment Dropzone → Auto-save Indicator.
- **Dominant Primary Action**: `Start AI review` (Located in Checklist side panel).
- **Secondary Actions**: `Save Draft` (manual persist), `Add Link`, `Remove Attachment`.
- **Components**: `<Textarea>`, `<Input>`, `<Dropzone>`, `<ReadinessChecklist>`, `<Button>`.
- **States**:
  - *Draft Auto-Save*: Subtle pulse text: *"Draft saved locally just now"*.
  - *Loading*: Document upload displays progress bar (`0% -> 100%`).
  - *Error*: Invalid URL format triggers inline warning with click-to-fix hint.
- **Responsive**: Checklist transforms into a top summary pill on mobile; form stacks cleanly.

---

## 6. `PER-03-CHK`: AI Review Preparation (Readiness Checklist)

- **Purpose**: Gate review execution to prevent wasted compute on empty context.
- **User Goal**: Validate that the project meets all 5 review criteria.
- **Layout**: 300px side panel on desktop; sticky header summary on mobile.
- **Hierarchy**: Panel Title → 5-Criteria List → Progress Meter (e.g. 4/5 Ready) → Primary CTA.
- **Criteria Evaluated**:
  1. Project name & summary valid.
  2. Category assigned.
  3. Description >= 50 words detailing core problem & architecture.
  4. Repository URL or documentation excerpt attached.
  5. Target persona indicated.
- **Dominant Primary Action**: `Start AI review` (Disabled until all 5 pass).
- **Interaction**: Clicking an incomplete item jumps focus to that specific form field.

---

## 7. `PER-04`: AI Review Processing Status

- **Purpose**: Truthful display of review progress without fabricated animations.
- **User Goal**: Track review execution and transition to findings upon completion.
- **Layout**: Centered card (`max-w-[560px]`).
- **Hierarchy**: Status Spinner → Main Heading → Active Stage Description → Verified Timeline Stages → Elapsed Timer → Safe Return Link.
- **Timeline Stages**:
  1. `[✓]` Context ingestion & spec normalization.
  2. `[✓]` Usability & onboarding analysis.
  3. `[⟳]` Architecture, security, and performance audit (Active).
  4. `[ ]` Synthesis of grounded findings and recommendations.
- **Dominant Action**: `View Feedback Report` (Appears automatically upon completion).
- **Secondary Actions**: `Safe return to project` (Leaves job running in background safely).
- **Error State**: Honest error card with error code and `Retry Review` button.

---

## 8. `PER-05`: AI Feedback Report Work Surface

- **Purpose**: Main product work surface; presents categorized findings and improvements.
- **User Goal**: Review vulnerabilities and select improvements to resolve.
- **Layout**: 2-Column Split (`1fr / 320px`). Left: Report findings; Right: Contextual Inspector.
- **Hierarchy**: Report Header & Meta → Executive Summary → Strengths Card → Filter Tabs (`All`, `Blocker`, `UX`, `Architecture`, `Security`) → Finding Cards List.
- **Dominant Primary Action**: `Select Next Improvement` / `Work on Blockers`.
- **Secondary Actions**: Filter by severity, export report, toggle inspector panel.
- **Finding Card Anatomy**:
  - Header: Severity Pill (`Blocker`, `High`, `Medium`, `Low`) + Category Badge.
  - Title: Concise finding headline.
  - Observation: 2-line explanation.
  - Evidence Quote: Direct cited excerpt.
  - Footer: Status dropdown (`Open` / `In Progress` / `Addressed`).
- **Components**: `<SeverityPill>`, `<Card>`, `<Button>`, `<Dropdown>`, `<Drawer>`.

---

## 9. `PER-06`: Finding Detail & Remediation Inspector

- **Purpose**: Deep inspection of an individual finding with verifiable citations and implementation steps.
- **User Goal**: Understand exact cause and mark as addressed.
- **Layout**: 320px right panel on desktop; slide-up bottom sheet (`Drawer.tsx`) on mobile.
- **Hierarchy**: Header (Severity Icon + Category) → Finding Title → Observation → Cited Source Excerpt → Concrete Recommendation → Status Selector → Reopen/Close.
- **Dominant Action**: Status Toggle: `Mark as Addressed` (Transitions finding to green checkmark).
- **Secondary Actions**: `Copy citation`, `Close inspector`.
- **Accessibility**: Focus traps in mobile sheet; accessible keyboard navigation.

---

## 10. `PUB-02`: Public Project Details View

- **Purpose**: Public presentation of an intentionally published project.
- **User Goal**: Evaluate a maker's project, inspect public findings, and submit feedback.
- **Layout**: Centered 896px reading container (`max-w-4xl`).
- **Hierarchy**: Back to Explore Link → Project Header (Name, Category, Maker) → Tagline → Live Links (Repo/Demo) → Public Overview → Community Feedback Thread.
- **Dominant Action**: `Submit Community Feedback` (or `Upvote Project`).
- **Secondary Actions**: `Share project`, `Bookmark project`, `View Maker Profile`.
- **Privacy Assurance**: Displays explicit "Public Project" badge; personal draft data is strictly excluded.

