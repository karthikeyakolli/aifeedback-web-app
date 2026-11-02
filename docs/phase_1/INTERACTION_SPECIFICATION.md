# Interaction and Motion Specification

> **Document Type**: Phase 1 Core Deliverable  
> **Status**: `CONFIRMED / APPROVED FOR IMPLEMENTATION`  
> **Version**: 1.0.0  
> **Date**: November 2, 2026  
> **Audience**: Frontend Engineers, Motion Designers, QA  

---

## 1. Motion Principles & Timing Tokens

Animation in this product serves functional communication—never decorative distraction. Motion exists solely to:
1. Signal spatial relationships (e.g. inspector expanding from right).
2. Confirm user agency and tactile feedback on interactive controls.
3. Guide attention to state changes (e.g. readiness checklist item completing).

### Standard Motion Tokens (`index.css`):
- `--motion-instant`: `80ms` (Micro button presses, checkbox toggles).
- `--motion-fast`: `140ms` (Dropdown entrance, tooltip fade, hover shifts).
- `--motion-standard`: `200ms` (Page transitions, card selections, tab switching).
- `--motion-panel`: `240ms` (Sidebar collapse/expand, contextual right inspector slide).
- `--ease-standard`: `cubic-bezier(0.2, 0, 0, 1)` (Decelerated spring-like exit).

---

## 2. Interactive States & Micro-Interactions

### A. Button & Clickable Controls
- **Hover**:
  - Transform: `translateY(-1px)`.
  - Box Shadow: Rises to `var(--shadow-xs)`.
  - Duration: `var(--motion-fast) ease-out`.
- **Pressed / Active**:
  - Transform: `translateY(1px)`.
  - Box Shadow: Flattens to `none`.
  - Duration: `var(--motion-instant) ease-in`.
- **Focus-Visible**:
  - 2px solid ring: `var(--focus-ring)` with 2px offset.
  - Native browser outline suppressed (`outline: none`).

### B. Tooltip Trigger Behavior
- **Pointer Hover**:
  - 250ms dwell delay before appearing (prevents visual flicker when passing cursor over dense lists).
  - Fades in with scale: `opacity: 0 -> 1`, `scale: 0.95 -> 1` over `140ms`.
- **Keyboard Focus**:
  - **Immediate display** (0ms delay) when focused via `Tab` key.
  - Positioned relative to origin with arrow pointing to target element.

### C. Sidebar Spring Collapse / Expand
- **Trigger**: Click collapse chevron button in sidebar footer or header toggle.
- **Motion**:
  - Expanded (`250px`) ↔ Collapsed Rail (`72px`).
  - Duration: `220ms` using `cubic-bezier(0.4, 0, 0.2, 1)`.
  - Content labels fade out before width snaps to avoid horizontal line wrapping.

---

## 3. Contextual Right Inspector (320px Panel)

- **Trigger**: Selecting a finding card on `PER-05 Feedback Report` or clicking the inspector toggle icon in the header.
- **Motion**:
  - Desktop: Slides in smoothly from the right margin: `width: 0 -> 320px`, `opacity: 0 -> 1` over `240ms`.
  - Main work canvas smoothly flex-shrinks to accommodate the panel with zero abrupt page reflow.
  - Close: Slides right and transitions to `width: 0` over `200ms`.
- **Mobile Viewport**: Transforms into a bottom drawer sheet (`Drawer.tsx`), sliding up from screen bottom with a touch-dismiss grab handle.

---

## 4. Modal Dialogs & High-Impact Confirmation Flows

### A. Modal Entrance & Exit
- Backdrop: Fades from `opacity: 0` to `rgba(0, 0, 0, 0.6) backdrop-blur-xs` over `150ms`.
- Modal Dialog: Enters with subtle zoom-in: `scale: 0.95 -> 1.0`, `translateY: 8px -> 0px` over `150ms`.
- Focus Management: Focus is immediately trapped inside the modal; first focusable element (or primary action) receives focus.
- Dismissal: Pressing `Escape` key or clicking outside on the scrim backdrop dismisses modal with smooth fade-out.

### B. Destructive Confirmation Flows (Project Deletion / Unpublish)
- **Visual Design**: High-contrast rose border, explicit warning banner.
- **Copy**: Never vague ("Are you sure?"); must name the object and consequence:
  > *"Are you sure you want to permanently delete 'ReflectFlow'? This action cannot be undone and will delete all 5 associated AI review findings."*
- **Action Button**: Primary action is styled with `destructive` red variant; requires single decisive click with immediate loading state.

---

## 5. Reduced-Motion Compliance (`prefers-reduced-motion`)

For users with vestibular disorders or motion sensitivities, the application enforces complete reduced-motion overrides:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  ::before,
  ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- When active, all slide-ins, spring expansions, and translations are bypassed.
- Elements transition instantaneously between states, preserving state clarity without spatial motion.

