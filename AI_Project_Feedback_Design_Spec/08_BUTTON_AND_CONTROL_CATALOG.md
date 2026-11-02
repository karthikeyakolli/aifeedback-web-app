# 08 — Button and Control Catalog

This document defines the expected behavior of every class of action and indexes the page-specific buttons from documents 04–06.

## 1. Button hierarchy

### Primary
- Maximum one primary action per screen or tightly related task region.
- Filled semantic primary surface.
- Verb-first label: `Start AI review`, `Save`, `Continue`.
- Use only for the page's dominant action.
- Loading state prevents duplicate submission.
- Disabled state must be understandable; where possible, explain the missing prerequisite beside it.

### Secondary
- Important alternative that does not compete visually with the primary.
- Outline or restrained filled surface.
- Examples: `Preview`, `Back to project`.

### Tertiary / ghost
- Low-emphasis actions: `Expand all`, `Clear filters`, `Cancel`.
- Must still have sufficient hit area and contrast.

### Destructive
- Use semantic danger styling.
- Confirm permanent deletion, public removal or other high-impact actions.
- Dialog must describe exactly what is lost or changed.
- Cancel action is the safe default.

### Icon-only
- Only for universally recognizable compact actions (Back, Close, Search, More, Undo).
- Always include accessible name/tooltip.
- Do not use ambiguous abstract icons for critical actions.
- Target 40–44px minimum practical control size; WCAG 2.2 target-size criteria still apply to the complete design.

## 2. Shared control behavior

| Control | Default | Hover | Focus | Press | Disabled/loading |
|---|---|---|---|---|---|
| Primary button | Filled | Slightly brighter/darker + 1px lift | 2px visible focus ring | 1px down, no bounce | Muted; spinner + truthful label on load |
| Secondary button | Outline/subtle | Surface tint | Focus ring | Background deepen | Reduced contrast but still legible |
| Ghost button | Text/icon | Subtle surface | Focus ring | Surface deepen | Non-interactive |
| Destructive | Danger surface/text | Slight emphasis | Focus ring | Darker danger | Disabled until safe prerequisite |
| Card link | Neutral surface | Border/shadow shift | Outline around card | Slight press | No hover if non-interactive |
| Toggle | Current state clear | Surface change | Focus ring | Animate thumb | State must be announced |
| Menu item | Neutral | Selection tint | Clear focus | Selected highlight | Disabled reason where feasible |

## 3. Page-specific button index

### PUB-00 Landing
- `Get started` — begin sign-up/app entry.
- `Sign in` — open authentication.
- `How it works` — scroll to explanation.
- `View example` — conditional; open explicitly labeled sample.
- Footer links — open real legal/help pages.

### PUB-01 Public Explore
- `Search` — query public content.
- `Filters` — open available filters.
- `Sort: Recent` — open sort menu.
- `Clear filters` — reset.
- Project card — open detail.
- `Load more` — conditional pagination.
- `Retry` — reload after error.

### PUB-02 Public Project Detail
- `Back to Explore` — preserve Explore context.
- `Share` / `Copy link` — conditional; share public URL.
- `Save project` — conditional; save to a user collection.
- `Report` — conditional moderation.
- `Project details` — disclosure.
- Primary project action — OPEN; must be determined by product scope.

### PUB-03 Creator Profile
- `Back`, `Share profile`, project card, `Follow` — only implement supported actions.

### ACC-01 Sign in (proposed)
- `Sign in` — validate credentials and authenticate.
- `Forgot password?` — start recovery, if supported.
- `Create account` — navigate to sign-up.
- `Show password` — toggle visibility, never alter value.
- Provider sign-in buttons — conditional on configured providers.
- Error banner — no action; offer retry or recovery.

### ACC-02 Sign up (proposed)
- `Create account` — validate and create.
- `Already have an account? Sign in` — navigate.
- `Show password` — toggle visibility.
- Terms/privacy links — open approved legal pages.
- Email verification resend — only after verification is actually required.

### ACC-03 Onboarding (proposed)
- `Continue` — validate and progress.
- `Back` — return to prior step preserving data.
- `Skip for now` — only for optional steps.
- `Finish setup` — save essential preferences and enter Personal Home.

### PER-01 Personal Home
- `New project` — create project.
- Search — narrow project list.
- `Filter`, `Sort`, `Clear filters` — list controls.
- Project row/card — open project.
- `More` — contextual project actions.
- `Retry` — reload list.

### PER-02 New Project
- `Cancel` — return; guard unsaved input if needed.
- `Continue` — create draft and proceed.
- `Save draft` — conditional persist.
- `Clear` — conditional, confirm before clearing.

### PER-03 Project Setup
- `Back to project` — return preserving input.
- `Save draft` — persist.
- `Add link` — conditional add source field.
- `Upload files` — conditional open file picker.
- `Remove file` — remove attachment.
- `Review settings` — expand secondary options.
- `Start AI review` — validate and submit.
- `Cancel review setup` — leave safely.

### PER-04 Review Processing
- `View feedback` — only when complete.
- `Back to project` — view source.
- `Retry review` — only if backend permits and review failed.
- `Cancel review` — only if backend supports cancellation.
- `Refresh status` — only if no automatic update.
- `Get help` — only if support exists.

### PER-05 Feedback Report
- `Work on improvements` — proceed to next approved workflow.
- `Back to project` — open source project.
- `Review history` — conditional.
- `Expand all`, `Collapse all` — report disclosure.
- `Copy report link`, `Export report`, `Regenerate review` — conditional.
- Finding card — open/expand a finding.

### PER-06 Finding Detail
- `Back to feedback` — return while preserving position.
- `Mark as addressed` / `Reopen` — conditional tracking.
- `Copy finding` — copy text/reference.
- `Open related project section` — navigate to source.
- `Ask for clarification` — conditional conversational feature.

### PER-07 History
- `Back to project` — current project.
- `Open version` — historical read-only view.
- `Compare versions` — conditional.
- `Restore version` — separate explicit operation and confirmation.
- `Filter history` — supported fields only.

### CRE-01 Creator Home
- `Create`, `Continue editing`, `View public profile`, `Edit profile` — conditional.
- `Filter`, `Sort` — supported creator item fields.
- Creator item card — open workspace.

### CRE-02 Creator Workspace
- `Back to Creator` — return.
- `Save` — persist.
- `Undo`, `Redo` — conditional editor history.
- `Preview` — read-only preview.
- `Settings` — open inspector.
- `Publish` — conditional; open publication review.
- `More` — secondary actions.

### CRE-03 Creator Profile
- `Save profile` — persist.
- `Preview profile` — preview public presentation.
- `Change image`, `Remove image` — conditional upload controls.
- `Cancel` — discard only after warning where needed.
- `View public profile` — open public profile.

### SET-01 Settings
- Theme selector: `Light`, `Dark`, `System`.
- Preference toggles — apply and persist individually or use a clear Save action.
- `Save changes` — only when settings are staged.
- `Reset to defaults` — confirm; identify exactly which settings reset.

## 4. Button label rules

Prefer:
- `Start AI review` over `Submit`.
- `Save draft` over `Save` when the saved state is incomplete.
- `Publish publicly` over `Publish` if the visibility change is meaningful.
- `Discard changes` over `No`.
- `Keep editing` over `Cancel` when the alternative is leaving the editor.
- `Retry upload` or `Retry review` over generic `Retry` when the operation is known.

Avoid:
- `Click here`, `OK`, `Yes`, `No`, `Done` for meaningful state changes.
- Multiple adjacent buttons with identical visual priority.
- Labels that claim a result before the action has succeeded.

## 5. Dialog templates

### Delete project
Title: `Delete this project?`
Body: State what will be deleted and whether it can be recovered.
Actions: `Keep project` (safe) and `Delete project` (destructive).

### Publish publicly
Title: `Publish this item publicly?`
Body: State exactly which content and metadata become visible.
Actions: `Review content`, `Publish publicly`.

### Leave unsaved work
Title: `You have unsaved changes`
Body: Explain whether the changes are saved or will be lost.
Actions: `Keep editing`, `Save draft` (if supported), `Discard changes`.
