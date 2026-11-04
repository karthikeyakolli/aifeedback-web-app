# 11 — Responsive Design, Accessibility and Themes

## 1. Breakpoint proposal

These are implementation starting points; test against actual content widths rather than treating the numbers as universal laws.

| Range | Design mode | Typical behavior |
|---|---|---|
| 1440px+ | Wide desktop | Full sidebar, main work surface, optional inspector |
| 1024–1439px | Desktop/tablet landscape | Sidebar compact or collapsible; inspector may collapse |
| 768–1023px | Tablet | Two-column layouts simplify; side panels become drawers |
| 480–767px | Large mobile | Single column; top navigation compact |
| Below 480px | Small mobile | Full single-column flow; bottom sheet or full-screen secondary task |

## 2. Per-page responsive rules

### Landing
- Desktop: wide hero with preview beside or beneath copy.
- Tablet: stack preview under CTA if columns become narrow.
- Mobile: one column; CTA visible without excessive scroll; no tiny nav links.

### Public Explore
- Desktop: 2–3 columns or list.
- Tablet: 2 columns.
- Mobile: 1 column; filters as bottom sheet.

### Personal Home
- Desktop: table/list if metadata matters.
- Mobile: project cards/rows with title first; move timestamps/status into secondary text.

### Project Setup
- Desktop: form + readiness panel.
- Tablet: readiness collapses below form.
- Mobile: form only; secondary options as disclosures; action remains reachable without covering keyboard.

### Feedback Report
- Desktop: main report + collapsible inspector.
- Tablet: inspector becomes drawer.
- Mobile: findings stack; metadata moves into collapsible sections; report remains readable.

### Creator Editor
- Desktop: large canvas + tools + inspector.
- Tablet: inspector as drawer.
- Mobile: dedicated mobile editor or view-first mode. Do not shrink a desktop canvas until controls become unusable.

## 3. Accessibility baseline

Target **WCAG 2.2 AA** as the proposed baseline. Validate against the current official standard and product context.

### Keyboard
- All actionable UI reachable using Tab/Shift+Tab.
- Logical DOM and focus order.
- Enter/Space activates appropriate controls.
- Escape closes dismissible overlays.
- Focus returns to the triggering control when a dialog/popover closes.
- No keyboard traps outside modal dialogs.

### Focus
- Visible focus indicator at all times.
- Focus not obscured by sticky headers/footers.
- Hover and focus states communicate the same useful information.
- Do not remove browser focus outline without a clear replacement.

### Screen readers
- Semantic landmarks and heading hierarchy.
- Every icon-only button has an accessible name.
- Form labels are programmatically associated.
- Async status changes use an appropriate live region.
- Error summary links to invalid fields when forms are long.
- Do not announce decorative animation repeatedly.

### Contrast and color
- Meet text and non-text contrast requirements.
- Never use color as the only indication of status, severity or selection.
- Test light, dark and high-contrast environments.

### Touch
- Aim for 44×44px practical touch targets where feasible.
- Provide spacing between adjacent destructive and safe actions.
- Avoid hover-dependent menus and tooltips.

### Motion
- Respect `prefers-reduced-motion`.
- Do not flash or pulse high-frequency effects.
- Keep progress understandable without animation.

## 4. Light, dark and system theme

### Required modes
- Light.
- Dark.
- System (follows OS preference).

### Behavior
- Apply theme instantly.
- Persist user choice using the approved preference store.
- Avoid flash of incorrect theme on initial load.
- Theme all layers: canvas, card, popover, modal, form, chart, tooltip, toast, code block and skeleton.
- Do not invert brand images blindly; provide appropriate variants where needed.

## 5. Responsive acceptance
For each page verify:
- no horizontal overflow at 320px width unless the data genuinely requires it;
- reading order remains logical;
- primary action is reachable;
- overlays fit within viewport and keyboard;
- text remains readable at 200% zoom;
- navigation can be opened and closed without hover;
- no content is lost when a side panel collapses.
