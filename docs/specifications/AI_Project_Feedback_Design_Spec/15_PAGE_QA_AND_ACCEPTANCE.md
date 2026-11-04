# 15 — Page QA and Acceptance Checklist

Use this checklist for every route and for all three spaces.

## A. Product meaning
- [ ] Page has one clear meaning.
- [ ] Page has one user goal.
- [ ] Exactly one dominant action is visually strongest.
- [ ] Main product/task surface receives maximum screen priority.
- [ ] Secondary information is identifiable but compact/collapsible.
- [ ] No unapproved capability has been introduced.

## B. Layout
- [ ] Page hierarchy is obvious within a few seconds.
- [ ] Header/navigation does not compete with the task.
- [ ] Main work surface has appropriate width.
- [ ] Secondary panel is collapsible when not essential.
- [ ] Long content remains readable.
- [ ] Empty state is useful and not decorative.
- [ ] No visual element exists only to fill whitespace.

## C. Buttons and controls
- [ ] Every button has a verb-led, understandable label.
- [ ] Every button performs its documented outcome.
- [ ] No placeholder or dead button.
- [ ] Primary action is unique and clear.
- [ ] Destructive action is clearly distinguished.
- [ ] Loading disables duplicate submissions.
- [ ] Disabled controls have a valid reason.
- [ ] Icon-only controls have accessible names.
- [ ] Dialog labels explain consequences.

## D. Interaction states
- [ ] Default.
- [ ] Hover.
- [ ] Focus-visible.
- [ ] Pressed.
- [ ] Selected/active.
- [ ] Disabled.
- [ ] Loading.
- [ ] Error.
- [ ] Success.
- [ ] Touch behavior tested without hover.

## E. Motion
- [ ] Motion has a clear purpose.
- [ ] Timing/easing follows shared tokens.
- [ ] No animation blocks user input.
- [ ] No layout shifts on hover.
- [ ] Loading/progress is truthful.
- [ ] Reduced-motion mode works.
- [ ] Focus is preserved through dialogs and drawers.

## F. Responsive
- [ ] Wide desktop.
- [ ] Standard laptop.
- [ ] Tablet portrait/landscape.
- [ ] Large mobile.
- [ ] Small mobile (320px).
- [ ] No accidental horizontal overflow.
- [ ] Navigation is touch-friendly.
- [ ] Main action remains reachable.
- [ ] Drawers/sheets fit screen and keyboard.
- [ ] No desktop-only hover dependency.

## G. Accessibility
- [ ] Keyboard-only use passes.
- [ ] Screen-reader names and landmarks are meaningful.
- [ ] Focus ring is visible and not obscured.
- [ ] Contrast passes.
- [ ] Status is not color-only.
- [ ] Form errors are actionable.
- [ ] Zoom at 200% remains usable.
- [ ] Reduced motion is respected.
- [ ] Touch targets are practical.

## H. Theme
- [ ] Light theme.
- [ ] Dark theme.
- [ ] System mode.
- [ ] No flash of wrong theme.
- [ ] All layers (dialogs, menus, tooltips, charts, code) are themed.

## I. Trust and privacy
- [ ] Public content is explicitly authorized.
- [ ] Personal content is not leaked.
- [ ] Creator publication (if present) has an explicit review/confirmation.
- [ ] AI output is identified as AI-generated.
- [ ] No invented score/progress/status.
- [ ] Evidence and limitations are shown where available.
- [ ] Errors do not destroy user input.

## J. Final sign-off
- [ ] Page brief and implementation match.
- [ ] Visual regression checks completed.
- [ ] Functional tests completed.
- [ ] Accessibility checks completed.
- [ ] Known limitations documented.
- [ ] Unsupported proposed controls removed.
