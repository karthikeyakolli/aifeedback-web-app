# 05 — Personal Space Page Specifications

Personal is treated as the user's focused project and feedback workspace. Specific project inputs, AI review mechanics and versioning remain subject to product confirmation.

---

## PER-01 — Personal Home (`/personal`)

**Meaning:** The user's private project workspace.  
**Goal:** Resume one project or start a new one.  
**Dominant action:** `New project` or `Continue project`—show one as dominant based on the user's state.

### Desktop layout
- Top: `My projects` title and concise description.
- Top-right: primary action `New project`.
- Main: recent projects list/table or card grid (choose based on content density).
- Each row/card: project name, concise descriptor, last updated, truthful state, one open action.
- Secondary filters: status and search.
- Optional quick links such as Drafts/Archived are compact navigation, not large dashboard cards.

### First-time/empty layout
- A single helpful message.
- One CTA: `Create your first project`.
- One small example of what information may be needed, only when known.
- Avoid fake activity charts or placeholder project cards.

### Button inventory
| ID | Label | Type | Action | Result |
|---|---|---|---|---|
| PER01-B01 | New project | Primary | Navigate to PER-02 | Begin project creation |
| PER01-B02 | Search projects | Input action | Filter personal project list | Narrow results |
| PER01-B03 | Filter | Secondary | Open filter popover/sheet | Select supported states |
| PER01-B04 | Sort | Secondary | Open sort menu | Change order |
| PER01-B05 | Clear filters | Tertiary | Reset list filters | Restore full list |
| PER01-C01 | Project row/card | Card action | Open project workspace/report | Continue work |
| PER01-B06 | More | Icon/overflow | Open project-specific menu | Archive/rename/delete only if supported |
| PER01-B07 | Retry | Secondary | Retry list fetch | Reload data |

### Project overflow menu (conditional)
- Rename — opens inline rename/dialog.
- Archive — asks for confirmation if it changes availability.
- Delete — destructive confirmation names the project; do not combine with archive.
- Duplicate — only if duplication semantics exist.

### States
- Loading skeleton.
- Empty account.
- Populated.
- Search with no results.
- Load error with retry.
- Deleted/archived project not silently presented as active.

### Responsive
- Desktop: table/list or cards.
- Tablet: hide low-value metadata first.
- Mobile: cards or stacked rows; search visible; filters in bottom sheet; `New project` fixed or in the page header without covering content.

---

## PER-02 — New Project (`/personal/projects/new`)

**Meaning:** Start a project record.  
**Goal:** Give the project enough identity to continue to setup.  
**Dominant action:** `Continue`.

### Layout
- Focused single-column form, max width approximately 680–760px.
- Short heading and one-sentence explanation.
- Required fields only at this stage.
- Secondary/optional fields visibly marked optional.
- Progress indicator only if there are multiple real steps.
- No sidebar of unrelated metrics.

### Proposed fields (OPEN to actual requirements)
- Project name.
- Short description.
- Project type/category only if categories exist.
- Optional starting context.

### Buttons and actions
| ID | Label | Type | Action | Result |
|---|---|---|---|---|
| PER02-B01 | Cancel | Tertiary | Return to Personal Home | Discard only unsaved form data after warning if needed |
| PER02-B02 | Continue | Primary | Validate and create draft project | Navigate to PER-03 |
| PER02-B03 | Save draft | Secondary/conditional | Persist an incomplete project | Return to Personal Home with Draft state |
| PER02-B04 | Clear | Conditional | Clear fields after confirmation | Empty form |

### Validation
- Validate in context, not only after submit.
- Keep field values after errors.
- Show a specific message under the relevant input.
- Do not add validation constraints that are not required by the product.

### Motion
- Invalid field: subtle focus/scroll to first error, no aggressive shake.
- On continue: button spinner + label `Creating…`; prevent double submission.
- Successful step transition: short crossfade/slide, 180–220ms.

---

## PER-03 — Project Setup / Context (`/personal/projects/:projectId/setup`)

**Meaning:** Prepare the project information that the AI review needs.  
**Goal:** Provide adequate context and begin a review or preserve a draft.  
**Dominant action:** `Start AI review` if all prerequisites are met.

### Layout
- Header: project name and draft/saved indicator.
- Main column: project inputs and context.
- Secondary side panel: review readiness/checklist and optional guidance.
- Keep upload/link/text input as the largest element only if those input modes are supported.
- Advanced options under `Additional review settings`.

### Input areas — conditional
- Project description/context.
- Repository or live URL.
- Document/file attachment.
- Goals, target audience or constraints.
- Review focus/categories.
- Additional notes.

Do not display an input type unless the backend actually accepts it. File size/type limits must come from the API, not a designer guess.

### Button inventory
| ID | Label | Type | Action | Result |
|---|---|---|---|---|
| PER03-B01 | Back to project | Tertiary | Return to project details/home | Preserve current form state |
| PER03-B02 | Save draft | Secondary | Persist current inputs | Show saved timestamp/status |
| PER03-B03 | Add link | Secondary/conditional | Add another supported URL field | Add one input row |
| PER03-B04 | Upload files | Secondary/conditional | Open system file picker | Add valid files to input list |
| PER03-B05 | Remove file | Icon/destructive | Remove selected attachment | Update list; undo toast where safe |
| PER03-B06 | Review settings | Tertiary | Expand secondary settings | Reveal optional controls |
| PER03-B07 | Start AI review | Primary | Validate prerequisites and submit review request | Navigate to PER-04 |
| PER03-B08 | Cancel review setup | Secondary | Leave setup | Preserve draft or ask before discarding |

### Readiness panel
Display explicit checklist items such as:
- Project title provided.
- Required project context present.
- Required sources attached.
- Inputs successfully saved.

Only show requirements actually enforced by the product. Do not display a percentage unless it is derived from real criteria.

### Error and progress behavior
- Uploading: show each file's real transfer state.
- Failed upload: preserve successful files and allow retry/remove.
- Review submit error: keep every field and attachment; explain the failure.
- If a review is accepted asynchronously, show the returned status.

### Responsive
- Desktop: main form + optional 300px readiness panel.
- Tablet: readiness panel collapses below the form.
- Mobile: one column; upload and advanced settings become clearly labeled sections; sticky bottom CTA only when it does not obscure fields or keyboard.

---

## PER-04 — Review Processing (`/personal/projects/:projectId/review`)

**Meaning:** Show the current state of a submitted AI review.  
**Goal:** Know whether the review is running, complete or needs action.  
**Dominant action:** `View feedback` when complete; otherwise no false primary action.

### Layout
- Project identity and submitted time.
- Main status area: truthful state and brief explanation.
- Timeline/stage list only when the system exposes real stages.
- Secondary actions: open project, retry, cancel, or contact support only if those operations exist.

### Status model
Use only statuses mapped from the backend. Example mapping proposal:
- Queued.
- Preparing inputs.
- Reviewing.
- Generating feedback.
- Completed.
- Failed / action required.

Do not animate an invented percentage. If stage-level progress is unavailable, use an indeterminate progress indicator with text.

### Button inventory
| ID | Label | Condition | Action |
|---|---|---|---|
| PER04-B01 | View feedback | Review completed | Navigate to PER-05 |
| PER04-B02 | Back to project | Always, if route exists | Open source project |
| PER04-B03 | Retry review | Failed and backend permits retry | Submit a new attempt |
| PER04-B04 | Cancel review | Queued/running and backend supports cancellation | Confirm and request cancellation |
| PER04-B05 | Refresh status | If polling is not automatic | Fetch current status |
| PER04-B06 | Get help | If support exists | Open help/support channel |

### Motion
- Status icon changes with a restrained crossfade.
- Indeterminate progress uses a subtle continuous indicator.
- Do not run a celebratory animation until the backend confirms completion.
- Completion: one calm success transition; expose `View feedback`.

---

## PER-05 — AI Feedback Report (`/personal/projects/:projectId/feedback`)

**Meaning:** Understand the AI's review of one project.  
**Goal:** Decide what to improve next.  
**Dominant action:** `Work on improvements` or the approved equivalent.

### Desktop layout
- Header: project title, review date/version and truthful review state.
- Main summary: concise overall synthesis; do not let a score card dominate unless a validated score is central to the product.
- Feedback sections/findings: highest-priority actionable findings first.
- Each finding: title, why it matters, evidence/context, recommended next step and confidence/limitations when available.
- Right rail (collapsible): review context, rubric, source list, or status.
- Bottom/side action: continue to improvement workflow.

### Report design requirements
- Separate strengths, concerns and suggestions if the AI output supports those categories.
- Prioritize actions by severity/impact only if there is a defined rule.
- Clearly distinguish observations from recommendations.
- Show missing context and uncertainty.
- If feedback refers to code/document sections, link to the exact location only when such references are grounded in input data.

### Button inventory
| ID | Label | Type | Action | Result |
|---|---|---|---|---|
| PER05-B01 | Work on improvements | Primary | Open improvement mode or return to project with findings | Begin next iteration |
| PER05-B02 | Back to project | Secondary | Open project context | Review source |
| PER05-B03 | Review history | Secondary/conditional | Open PER-07 | Compare earlier reviews |
| PER05-B04 | Expand all | Tertiary | Expand all feedback sections | Scan details |
| PER05-B05 | Collapse all | Tertiary | Collapse details | Return to overview |
| PER05-B06 | Copy report link | Conditional | Copy authorized report URL | Share only within allowed access |
| PER05-B07 | Export report | Conditional | Generate supported export | Download report |
| PER05-B08 | Regenerate review | Conditional | Open confirmation/settings then request new review | New review attempt |
| PER05-C01 | Finding card | Card action | Open PER-06 or expand inline | Inspect finding |

### AI trust and integrity
- Label the output as AI-generated.
- Do not show fabricated grades, scores, confidence bars or rankings.
- A user should be able to identify which parts are advice, which are source-backed evidence and which need verification.
- If the system has citations/source spans, keep them near the claim.
- Do not present recommendations as automatically applied changes.

### Responsive
- Desktop: overview + main findings + collapsible right rail.
- Tablet: hide right rail into a drawer.
- Mobile: overview first, then vertically stacked findings; use collapsible sections; primary action available after the summary and at the end if useful.

---

## PER-06 — Feedback Finding Detail (`/personal/projects/:projectId/feedback/:findingId`)

**Meaning:** Understand one specific finding.  
**Goal:** Decide what to do about it.  
**Status:** CONDITIONAL if findings have their own detail view.

### Layout
- Finding title and priority/severity label only if the system defines one.
- Explanation.
- Evidence/source context.
- Why it matters.
- Suggested next action.
- Related project content side panel on desktop.

### Buttons
| ID | Label | Action |
|---|---|---|
| PER06-B01 | Back to feedback | Return to PER-05 preserving scroll |
| PER06-B02 | Mark as addressed | Update status if tracking exists |
| PER06-B03 | Reopen | Reopen a previously addressed finding if allowed |
| PER06-B04 | Copy finding | Copy finding text and source reference |
| PER06-B05 | Open related project section | Navigate/scroll to grounded source location |
| PER06-B06 | Ask for clarification | CONDITIONAL; only if conversational follow-up is part of the product |

Do not add a dismiss/ignore action unless its meaning and persistence are defined.

---

## PER-07 — Project / Review History (`/personal/projects/:projectId/history`)

**Meaning:** See prior saved versions or reviews for this project.  
**Goal:** Open a particular historical version.  
**Status:** CONDITIONAL on actual version/review history.

### Layout
- Chronological version/review list.
- Each entry: date, version identifier, title/description and true state.
- Comparison mode only if comparable report data exists.
- Current version is clearly distinguished.

### Buttons
| ID | Label | Action |
|---|---|---|
| PER07-B01 | Back to project | Return to current project |
| PER07-B02 | Open version | Open selected historical snapshot |
| PER07-B03 | Compare versions | Enter comparison if supported |
| PER07-B04 | Restore version | Conditional; confirmation and explicit semantics required |
| PER07-B05 | Filter history | Filter by real version/review attributes |

Do not use "Restore" when the operation merely opens an old report. These are different actions.
