# Component and State Inventory

> **Document Type**: Phase 1 Core Deliverable  
> **Status**: `CONFIRMED / COMPONENT CATALOG`  
> **Version**: 1.0.0  
> **Date**: November 2, 2026  
> **Audience**: Frontend Engineers, Design Systems Architects, QA  

---

## 1. Component Philosophy & Inventory Rules

1. **State Completeness**: Every component must document all valid operational states: Default, Hover, Focus, Active/Pressed, Disabled, Loading, and Error.
2. **Honest Signals**: Loading states must present truthful descriptions of active tasks; decorative or fake states are strictly forbidden.
3. **Accessibility Parity**: Components built upon Radix UI primitives guarantee full ARIA attributes and keyboard compliance.

---

## 2. Buttons (`<Button>`)

Supported Variants: `primary`, `secondary`, `outline`, `ghost`, `destructive`, `icon`.

| State | Visual Manifestation | Keyboard / Interaction Trigger | ARIA / Accessibility |
|---|---|---|---|
| **Default** | Resting elevation, high-contrast text (`bg-[var(--accent)] text-white`). | None (at rest). | `role="button" tabindex="0"` |
| **Hover** | Elevation rises slightly (`translateY(-1px) shadow-xs`). | Pointer enters hit target. | Visual cue only. |
| **Focus-Visible**| 2px high-contrast ring with 2px offset (`ring-2 ring-[var(--focus-ring)]`). | `Tab` key navigation into button. | Keyboard focus maintained. |
| **Pressed / Active**| Tactile compression (`translateY(1px) shadow-none`). | Mouse click or `Space` / `Enter` held down. | Immediate feedback. |
| **Disabled** | 40% opacity, pointer-events disabled, grayed out. | Unmet condition (e.g. form invalid). | `aria-disabled="true"` |
| **Loading** | Interactive state suppressed; displays animated spinner + truthful task label. | Async request dispatched (e.g. "Saving draft..."). | `aria-busy="true"` |

---

## 3. Form Inputs & Textareas (`<Input>`, `<Textarea>`)

| State | Visual Manifestation | Validation Condition | Error / Helper Text |
|---|---|---|---|
| **Default** | Resting border (`border-[var(--border-default)]`), subtle placeholder text. | Empty field at rest. | Optional helper text beneath. |
| **Focus** | High-contrast border (`border-[var(--accent)]`), 2px focus ring. | User clicks or tabs into input. | Helper text remains visible. |
| **Filled** | High-contrast text, clear button visible if supported. | Value entered by user. | Character counter updates. |
| **Invalid** | Heavy red border (`border-rose-500`), focus ring tinted red. | Validation rule fails (e.g. word count < 50). | Red error text adjacent to input with Alert icon. |
| **Disabled** | Dimmed background (`bg-[var(--surface-raised)]`), cursor not-allowed. | Editing locked by server status. | `disabled aria-disabled="true"` |
| **Read-Only** | Standard text rendering without interactive edit border. | Historical report view. | `readonly` |

---

## 4. Project Cards & Rows (`<ProjectCard>`, `<ProjectRow>`)

| State | Visual Manifestation | Available Actions |
|---|---|---|
| **Default** | Surface card with subtle border, project title, category tag, status pill. | Click to open project setup/report. |
| **Hover** | 1px border highlight (`border-[var(--border-strong)]`), subtle elevation. | Overflow menu button becomes prominent. |
| **Selected** | Subtle accent tint (`bg-[var(--accent)]/5 border-[var(--accent)]`). | Keyboard active row. |
| **In Review** | Amber status pill with active spinner (`Analyzing architecture...`). | Click opens review processing screen (`PER-04`). |
| **Reviewed** | Indigo status pill (`Reviewed`), display of open vs. addressed findings. | Click opens feedback report (`PER-05`). |
| **Archived** | Muted slate border, dimmed opacity (60%), "Archived" pill. | Context menu offers `Restore` or `Delete`. |
| **Loading Skeleton**| Shimmering geometric blocks matching title, tagline, and badge sizes. | Non-interactive. |
| **Error / Empty** | High-contrast card explaining failure to fetch projects with `Retry` action. | Click `Retry List`. |

---

## 5. Severity & Category Pills (`<SeverityPill>`)

Findings are categorized across 5 severity levels using shape, icon, and text:

| Severity Level | Geometric Shape | Icon Component | Text Label | ARIA Status |
|---|---|---|---|---|
| **Blocker** | `rounded-md` (Octagon) | `OctagonAlert` | **Blocker** | `role="status" aria-label="Severity: Blocker"` |
| **High** | `rounded-md` (Triangle) | `TriangleAlert` | **High Priority** | `role="status" aria-label="Severity: High"` |
| **Medium** | `rounded-sm` (Square) | `AlertCircle` | **Medium Priority** | `role="status" aria-label="Severity: Medium"` |
| **Low** | `rounded-full` (Pill) | `Info` | **Low Priority** | `role="status" aria-label="Severity: Low"` |
| **Resolved** | `rounded-full` (Capsule)| `CheckCircle2` | **Addressed** | `role="status" aria-label="Status: Addressed"` |

---

## 6. AI Review Execution States (`PER-04`)

| State | Visual Manifestation | Permitted User Action |
|---|---|---|
| **Ready** | Review Readiness Checklist passes (5/5); `Start AI review` button is enabled. | Click `Start AI review`. |
| **Submitting** | Button displays spinner with text: *"Dispatching review..."*. | Button disabled against double-clicks. |
| **Processing** | Timeline renders active stage: `Ingesting context` → `Analyzing UX` → `Auditing Security`. | User can wait or click `Safe return to project`. |
| **Completed** | Full checkmark displayed: *"Review complete"*; navigates to `PER-05`. | Auto-redirects or click `View Feedback Report`. |
| **Failed** | Honest error card: *"AI Provider Timeout"*; preserves user draft context. | Click `Retry Review` or `Edit Context`. |

---

## 7. Review Readiness Checklist (`<ReadinessChecklist>`)

| Item State | Visual Manifestation | Action on Click |
|---|---|---|
| **Pending** | Empty gray circle icon (`○`), gray item text. | Clicks jump focus to corresponding input field. |
| **Completed** | Solid emerald check icon (`✓`), strikethrough/dimmed title. | Shows verified criterion. |
| **Invalid** | Red warning icon (`⚠`), red hint text explaining requirement. | Focuses input and highlights error. |

---

## 8. Accessible Overlays

- **Modal Dialog (`<Modal>`)**: Traps focus within modal container; dims background with `backdrop-blur-xs`; dismissed via `Escape` key or explicit close button.
- **Drawer / Sheet (`<Drawer>`)**: Multi-sided sheet supporting desktop contextual inspector (320px) and mobile bottom sheet; supports smooth slide transition.
- **Tooltip (`<Tooltip>`)**: Discloses contextual label; immediate on keyboard focus; 250ms dwell delay on pointer hover to prevent visual flashing.
- **Dropdown Menu (`<Dropdown>`)**: Full arrow key navigation (`ArrowDown`, `ArrowUp`, `Enter`, `Space`); auto-focuses first item on open; closes on `Escape` or selection.

