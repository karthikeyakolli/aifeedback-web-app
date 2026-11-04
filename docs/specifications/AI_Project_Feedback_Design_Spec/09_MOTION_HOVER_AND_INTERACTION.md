# 09 — Motion, Hover, Focus and Interaction Specification

All timings below are PROPOSED starting values. Tune them against actual usability tests; never prioritize animation over responsiveness.

## 1. Motion principles

Motion should be:
- fast enough to feel responsive;
- small enough to keep attention on the task;
- consistent across the application;
- state-based rather than decorative;
- interruptible where possible;
- reduced or removed when the user requests reduced motion.

Prefer opacity, color, border, shadow and small transforms. Avoid large zooms, elastic bounce, background parallax and animations that delay task completion.

## 2. Timing tokens

| Token | Duration | Use |
|---|---:|---|
| `motion-instant` | 80ms | pressed color / icon feedback |
| `motion-fast` | 120–160ms | button hover, focus, small tooltip |
| `motion-standard` | 180–220ms | popover, tab underline, content transition |
| `motion-panel` | 220–280ms | sidebar, drawer, sheet |
| `motion-complex` | 280–360ms | only for a multi-part transition with clear meaning |

Suggested easing:
- Standard: `cubic-bezier(0.2, 0, 0, 1)`.
- Enter: `cubic-bezier(0, 0, 0.2, 1)`.
- Exit: `cubic-bezier(0.4, 0, 1, 1)`.

Avoid linear easing for most interface transitions.

## 3. Button states

### Primary button
- Hover: semantic fill changes slightly; translateY(-1px); 120–150ms.
- Focus-visible: clear 2px ring with offset; no motion required.
- Pressed: translateY(0) or 1px; 80ms.
- Loading: spinner replaces leading icon; label changes to operation-specific present tense (`Saving…`, `Starting review…`); lock duplicate submission.
- Success: return to normal button and show a separate status/toast only after server confirmation.
- Disabled: no hover movement; cursor/state communicates unavailable.

### Secondary / ghost
- Hover: subtle surface tint and border contrast; no size change.
- Pressed: slightly stronger tint.
- Focus: same clear ring.
- Disabled: remain readable, avoid opacity so low that label becomes illegible.

## 4. Sidebar and hover-to-reveal labels

### Expanded sidebar
- Icon and text visible at all times.
- Hover: background tint and icon/text contrast.
- Active item: persistent background or indicator + text weight; not color alone.

### Collapsed sidebar
- Width proposal: 68–72px.
- Hover/focus: reveal tooltip with full label after 250–350ms pointer dwell; keyboard focus reveals immediately.
- Tooltip: opaque enough for contrast, maximum two lines, no essential instructions.
- Do not make the tooltip shift the page layout.
- On touch: tap opens a navigation drawer or expands the rail; no hover dependency.

## 5. Cards and list rows

- Hover: border color rises one step; shadow increases subtly; optional 1–2px elevation.
- Avoid scaling an entire content card because it can cause neighboring elements to appear unstable.
- The card title and action remain visible before hover.
- Focus: visible outline around the interactive card.
- Press: subtle surface change; no delayed navigation.
- If only a small button within the card is interactive, do not make the entire card clickable too.

## 6. Tooltip, popover, menu

- Tooltip: 120–160ms fade + 2–4px movement; delay only for pointer hover.
- Keyboard focus: immediate.
- Popover: 160–200ms opacity + scale from 0.98 to 1; origin-aware placement.
- Menu: 140–180ms; selected and focused item clearly distinct.
- Close on Escape; maintain expected keyboard focus.
- On touch, open by tap and dismiss via explicit close, outside tap or back behavior.

## 7. Drawer / right panel / bottom sheet

- Desktop side panel: 220–260ms horizontal transition.
- Mobile bottom sheet: 220–280ms vertical transition.
- Backdrop opacity changes during entry.
- Focus stays inside modal sheets when modal; focus returns to trigger on close.
- Support swipe-to-dismiss only as a supplementary gesture, not the sole method.
- Do not animate a huge panel if it makes the primary work surface jump unexpectedly.

## 8. Tabs and segmented controls

- Active indicator moves or fades within 140–180ms.
- Content crossfade 100–160ms only when it helps orient the user.
- Do not animate between tabs if the content is large or causes layout instability.
- Tab selection is immediate; no wait for animation.

## 9. Expand/collapse

- Chevron rotates 90° or 180° in 120–160ms.
- Content opacity/height transition 160–220ms.
- Preserve scroll position where reasonable.
- Prefer CSS grid/clip techniques that avoid layout jank.
- Respect reduced motion by switching to instant reveal/hide.

## 10. AI review processing animation

- Use a visible status title and explanatory sentence.
- If the backend exposes stages, update the stage list using actual events.
- If the backend exposes no percentage, use indeterminate progress.
- Never animate 0% to 100% just to keep the UI looking busy.
- Each real stage can receive a checkmark once confirmed.
- Failed review should transition to a stable error panel with recovery actions.

## 11. Feedback report micro-interactions

- Finding disclosure: 160–200ms.
- "Copy" action: icon changes to check briefly after clipboard success.
- Mark addressed: state changes with short fade; undo available only if persistence semantics support it.
- Source jump: subtle highlight around the target section; avoid flashing.
- Do not animate score/count changes unless actual data has changed and the animation helps comprehension.

## 12. Toasts and notifications

- Enter: 160ms fade/slide.
- Exit: 120ms fade.
- Success messages disappear after a reasonable period.
- Errors that require action remain until dismissed or fixed.
- Toasts must not be the only place a critical error appears.
- Do not stack an unbounded number of notifications.

## 13. Reduced motion

When `prefers-reduced-motion: reduce`:
- remove nonessential transform and parallax;
- stop auto-playing decorative loops;
- use instant or low-motion state changes;
- never remove progress/status information;
- keep all functionality unchanged.

## 14. Motion QA

Test:
- mouse hover;
- keyboard focus and activation;
- touch tap;
- reduced motion;
- high zoom;
- slow network;
- loading and failure;
- nested dialogs and sheets;
- repeated clicks / duplicate submissions.
