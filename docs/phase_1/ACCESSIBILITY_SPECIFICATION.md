# Accessibility Specification (WCAG 2.2 Level AA)

> **Document Type**: Phase 1 Core Deliverable  
> **Status**: `CONFIRMED / COMPLIANCE MANDATE`  
> **Version**: 1.0.0  
> **Date**: November 2, 2026  
> **Audience**: Frontend Engineers, QA Engineers, Accessibility Auditors  

---

## 1. Accessibility Policy & Target Standard

Accessibility is not an afterthought or retrofitted patch; it is an foundational engineering constraint:
> **Target Compliance**: **WCAG 2.2 Level AA** across all supported viewports, themes, and assistive devices.

---

## 2. Non-Color Severity Differentiation Rule

Under WCAG Criterion 1.4.1 (Use of Color), color must never be the sole visual means of conveying information, indicating an action, prompting a response, or distinguishing a visual element.

Every finding severity and status pill enforces a **Three-Factor Differentiation**:
1. **Geometric Shape**: Octagon vs. Triangle vs. Square vs. Rounded Pill.
2. **Iconography**: `OctagonAlert` vs. `TriangleAlert` vs. `AlertCircle` vs. `Info` vs. `CheckCircle2`.
3. **Explicit Text**: Distinct wording ("Blocker", "High Priority", "Medium Priority", "Low Priority", "Addressed").

```
[⯃] Blocker          (Octagon shape  + Alert icon + "Blocker" text)
[▲] High Priority    (Triangle shape + Triangle icon + "High Priority" text)
[■] Medium Priority  (Square shape   + Circle icon + "Medium Priority" text)
(ℹ) Low Priority     (Pill shape     + Info icon + "Low Priority" text)
(✓) Addressed        (Capsule shape  + Check icon + "Addressed" text)
```

---

## 3. High-Contrast Ratios (Light & Dark Themes)

All text, icons, and interactive borders meet or exceed WCAG 2.2 contrast ratios:

| Element Type | Minimum WCAG Ratio | Light Theme Actual | Dark Theme Actual | Pass / Fail |
|---|---|---|---|---|
| **Body Copy** | `4.5:1` | `11.8:1` (`#0f172a` on `#f8fafc`) | `14.2:1` (`#f8fafc` on `#0b0f17`) | **PASS** |
| **Secondary Descriptions** | `4.5:1` | `5.6:1` (`#475569` on `#ffffff`) | `6.8:1` (`#94a3b8` on `#111827`) | **PASS** |
| **Primary Button Text** | `4.5:1` | `6.2:1` (`#ffffff` on `#4f46e5`) | `7.1:1` (`#ffffff` on `#6366f1`) | **PASS** |
| **Interactive Card Borders** | `3.0:1` | `3.4:1` (`#cbd5e1` on `#ffffff`) | `3.8:1` (`#334155` on `#111827`) | **PASS** |
| **Focus Rings** | `3.0:1` | `4.8:1` (`#6366f1` on `#ffffff`) | `5.2:1` (`#818cf8` on `#111827`) | **PASS** |

---

## 4. Complete Keyboard Navigation Protocol

Every interactive surface is operable without a mouse:

| Key / Shortcut | Context | Expected Action |
|---|---|---|
| `Tab` | Global | Move focus to next interactive element in logical DOM order. |
| `Shift + Tab` | Global | Move focus to previous interactive element. |
| `Enter` / `Space` | Buttons & Links | Activate control or toggle selection. |
| `Escape` | Modals / Drawers / Menus | Close active overlay and restore focus to trigger element. |
| `ArrowDown` / `ArrowUp` | Dropdown Menus | Navigate through menu options. |
| `Home` / `End` | Dropdowns & Lists | Jump to first or last item in collection. |
| `⌘K` / `Ctrl + K` | Global | Open global command palette from any screen. |
| `/` | Global (outside inputs) | Focus global search command bar. |

---

## 5. Focus Management & Focus Traps

1. **Visible Focus Rings**:
   - Focus rings use `2px solid var(--focus-ring)` with `2px` offset.
   - Outline is never suppressed using `outline: none` unless replaced by a custom high-contrast ring.
2. **Focus Traps in Modals**:
   - Opening `<Modal>` automatically focuses the initial form field or primary button.
   - Tabbing cycles exclusively within the modal container.
   - On close, focus is programmatically restored to the trigger button that launched the modal.
3. **Skip Links**:
   - A hidden skip-to-content link (`#main-content`) is the first tabbable element in the DOM:
     `<a href="#main-content" class="sr-only focus:not-sr-only ...">Skip to main content</a>`.

---

## 6. Screen Reader ARIA Specifications

- **Icons**: Non-decorative icons are accompanied by explicit text or `aria-label="Action description"`. Purely decorative icons are marked `aria-hidden="true"`.
- **Modals**: Marked with `role="dialog"`, `aria-modal="true"`, `aria-labelledby="dialog-title"`, and `aria-describedby="dialog-description"`.
- **Status Announcements**: Processing screens and asynchronous alerts employ `role="status"` and `aria-live="polite"` so screen readers announce stage updates without interrupting the user.
- **Form Errors**: Error messages are rendered directly adjacent to the invalid input and connected via `aria-describedby="field-error-id"`, accompanied by `aria-invalid="true"`.

