# 07 — End-to-End User Flows

The flows here are PROPOSED BASELINE for design and prototyping. Remove or adapt a flow if it is not part of the approved product behavior.

## FLOW-01 — First visit to first useful action

**Visitor → account → onboarding → Personal Home**

1. Visitor opens landing page.
2. Reads the product's concise purpose and limitations.
3. Selects `Get started`.
4. Creates an account or signs in.
5. Completes only essential onboarding fields.
6. Arrives in Personal Home.
7. Sees one dominant next action: `New project` or `Continue project`.

**Failure/edge cases**
- Existing authenticated session: route directly to the app.
- Account creation fails: preserve form input and explain recovery.
- Onboarding interrupted: return to the incomplete step without losing data.
- User declines optional preferences: continue with defaults.

## FLOW-02 — Create project and request AI feedback

**Personal Home → New Project → Project Setup → Review Processing → Feedback Report**

1. Select `New project`.
2. Enter required project identity.
3. Select `Continue`.
4. Supply the supported project content/context.
5. Save a draft automatically or explicitly according to product behavior.
6. Read the readiness checklist.
7. Select `Start AI review` only when prerequisites pass.
8. Show a pending state while the backend accepts the request.
9. Navigate to Review Processing.
10. Show actual status.
11. When complete, reveal `View feedback`.
12. Open Feedback Report.

**Do not**
- fabricate progress percentages;
- clear form data on failed submission;
- imply review is complete before server confirmation;
- silently resubmit when a user refreshes.

## FLOW-03 — Read and act on feedback

**Feedback Report → Finding Detail (optional) → Improvement/next iteration**

1. User opens report.
2. Sees concise review summary.
3. Scans the highest-priority actionable finding.
4. Opens a finding for evidence/context when needed.
5. Chooses an appropriate next step.
6. Returns to report without losing position.
7. Updates the project or starts a new review only if that operation exists.

**Important:** "Mark as addressed" must not imply the AI independently verified the change. The state means the user marked it, unless the system performs a separate verification.

## FLOW-04 — Revisit previous work

**Personal Home → Project → History → Historical item**

1. User opens a project.
2. Selects `Review history`.
3. Selects one historical version/review.
4. Opens a read-only historical view.
5. Returns to current project.

Restoration is a separate action and requires a separate confirmation.

## FLOW-05 — Discover public work

**Public Explore → Public Project Detail**

1. User enters Public space.
2. Searches or filters only on supported fields.
3. Opens a public item.
4. Reads only fields authorized for public display.
5. Uses optional share/save/report interactions only when those product capabilities exist.

A public page must never leak personal notes, private source files or internal review data.

## FLOW-06 — Creator work

**Creator Home → Creator Workspace → Preview → Publish review (conditional)**

1. User enters Creator.
2. Opens or creates one supported creator item.
3. Edits in a focused workspace.
4. Saves and previews.
5. If public publishing exists, selects `Publish`.
6. Reviews the exact content/visibility change.
7. Confirms explicitly.
8. Receives an accurate success/failure result.

## FLOW-07 — Change theme

**Any page → Account/Settings → Appearance**

1. Open settings.
2. Select Light, Dark or System.
3. Apply immediately if theme setting is instant.
4. Show the updated theme without a full-page reload.
5. Persist preference according to account/local settings policy.

## FLOW-08 — Leave with unsaved changes

1. User edits a project/profile/editor item.
2. User selects Back, space switcher or closes a modal.
3. If changes are saved, navigate normally.
4. If save is in progress, prevent accidental duplicate operation and explain.
5. If unsaved changes exist, show a dialog with clear choices:
   - `Keep editing` (safe default)
   - `Discard changes` (destructive; only if recoverability is defined)
   - `Save draft` (if supported)

Do not use ambiguous buttons such as `Yes` and `No`.

## Flow quality rules

- Every transition has a clear destination.
- Browser Back returns to the previous useful context.
- Form values survive recoverable failures.
- Success is reported only after persistence is confirmed.
- Cancellation has a defined result.
- A flow never depends on hover.
