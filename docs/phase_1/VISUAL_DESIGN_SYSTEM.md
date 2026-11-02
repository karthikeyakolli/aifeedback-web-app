# Visual Design System Specification

> **Document Type**: Phase 1 Core Deliverable  
> **Status**: `CONFIRMED / APPROVED DESIGN SYSTEM`  
> **Version**: 1.0.0  
> **Date**: November 2, 2026  
> **Audience**: Design Systems Engineers, Frontend Engineers, QA  

---

## 1. Design Token Architecture

The design system is engineered around **Semantic CSS Custom Properties** declared in `index.css`. All tokens adapt automatically to **Light**, **Dark**, and **System** themes while guaranteeing WCAG 2.2 Level AA contrast ratios (>= 4.5:1 for body copy; >= 3.0:1 for large headings and UI borders).

---

## 2. Color Palette & Semantic Tokens

| Token Name | Light Theme Value | Dark Theme Value | Semantic Intent |
|---|---|---|---|
| `--canvas` | `#f8fafc` (Slate 50) | `#0b0f17` (Deep Navy) | Global application background canvas |
| `--surface` | `#ffffff` (Pure White) | `#111827` (Gray 900) | Standard card, sidebar & header surface |
| `--surface-raised` | `#f1f5f9` (Slate 100) | `#1e293b` (Slate 800) | Elevated modals, dropdowns, hovered items |
| `--surface-hover` | `#e2e8f0` (Slate 200) | `#334155` (Slate 700) | Hovered list rows and button states |
| `--border-default` | `#cbd5e1` (Slate 300) | `#334155` (Slate 700) | Subtle container & card outlines |
| `--border-strong` | `#94a3b8` (Slate 400) | `#475569` (Slate 600) | High-contrast input and focused borders |
| `--accent` | `#4f46e5` (Indigo 600) | `#6366f1` (Indigo 500) | Primary dominant actions and branding |
| `--accent-foreground` | `#ffffff` | `#ffffff` | Text rendered on top of accent surfaces |
| `--focus-ring` | `#6366f1` (Indigo 500) | `#818cf8` (Indigo 400) | 2px accessible keyboard focus outline |
| `--text-primary` | `#0f172a` (Slate 900) | `#f8fafc` (Slate 50) | High-contrast body copy and headings |
| `--text-secondary` | `#475569` (Slate 600) | `#94a3b8` (Slate 400) | Descriptions, subtitles, and labels |
| `--text-muted` | `#64748b` (Slate 500) | `#64748b` (Slate 500) | Timestamps, metadata, keyboard shortcuts |
| `--status-danger` | `#dc2626` (Red 600) | `#f87171` (Red 400) | Blocker severity, destructive deletion |
| `--status-warning` | `#d97706` (Amber 600) | `#fbbf24` (Amber 400) | High/Medium severity, review caveats |
| `--status-success` | `#16a34a` (Green 600) | `#4ade80` (Green 400) | Addressed status, checklist validated |
| `--status-info` | `#0284c7` (Sky 600) | `#38bdf8` (Sky 400) | Low severity, helpful hints |

---

## 3. Typography Scale

Font Family: `Inter`, system-ui, -apple-system, sans-serif; Monospace: `JetBrains Mono`, `Fira Code`, monospace.

| Style Name | Size | Line Height | Weight | Tracking | Typical Use |
|---|---|---|---|---|---|
| **Display Hero** | `32px` (2.0rem) | `40px` (1.25) | `800` (Extra Bold) | `-0.03em` | Landing page hero (`PUB-00`) |
| **Page Title** | `24px` (1.5rem) | `32px` (1.33) | `700` (Bold) | `-0.02em` | Workspace and report headers (`PER-01`, `PER-05`) |
| **Section Heading** | `18px` (1.125rem) | `26px` (1.44) | `600` (Semi Bold) | `-0.015em` | Card groups, checklist headers |
| **Subheading** | `15px` (0.9375rem) | `22px` (1.46) | `600` (Semi Bold) | `-0.01em` | Finding titles, project row headers |
| **Body (Default)** | `14px` (0.875rem) | `20px` (1.42) | `400` / `500` | `0` | Form labels, descriptions, report copy |
| **Small / Metadata** | `12px` (0.75rem) | `16px` (1.33) | `500` (Medium) | `+0.01em` | Badges, timestamps, status pills |
| **Micro / Code** | `11px` (0.6875rem) | `14px` (1.27) | `500` (Mono) | `+0.02em` | Citations, kbd shortcuts (`⌘K`) |

---

## 4. Spacing Scale (4px Base System)

```
4px   (0.25rem)  -- spacing-1 : Icon gaps, dense badge padding
8px   (0.50rem)  -- spacing-2 : Small margins, button icon gap
12px  (0.75rem)  -- spacing-3 : Input padding, card internal spacing
16px  (1.00rem)  -- spacing-4 : Standard gutter, form group gap
20px  (1.25rem)  -- spacing-5 : Medium container padding
24px  (1.50rem)  -- spacing-6 : Section separators, modal padding
32px  (2.00rem)  -- spacing-8 : Page title bottom margin
40px  (2.50rem)  -- spacing-10: Large section spacing
48px  (3.00rem)  -- spacing-12: Desktop hero vertical rhythm
```

---

## 5. Border Radius & Shadows

### Border Radius:
- `radius-sm` (`4px`): Micro badges, checklist indicators.
- `radius-md` (`8px`): Form inputs, standard buttons, dropdown items.
- `radius-lg` (`12px`): Cards, project rows, command palette modal.
- `radius-xl` (`16px`): Dialogs, slide-over panels, floating inspector.
- `radius-full` (`9999px`): Avatars, resolved status pills.

### Elevation & Shadows:
- `shadow-2xs`: Subtle border reinforcement (`0 1px 2px 0 rgb(0 0 0 / 0.05)`).
- `shadow-xs`: Interactive cards at rest (`0 1px 3px 0 rgb(0 0 0 / 0.08)`).
- `shadow-md`: Hovered cards and small popovers (`0 4px 6px -1px rgb(0 0 0 / 0.1)`).
- `shadow-lg`: Modals and slide-over sheets (`0 10px 15px -3px rgb(0 0 0 / 0.15)`).
- `scrim-overlay`: Backdrop blur (`rgba(0, 0, 0, 0.6) backdrop-blur-xs`).

---

## 6. Layout Grid & Container Widths

- **Desktop Shell Split**: `1fr / 320px` (Main work canvas with collapsible contextual inspector).
- **Narrow Focused Flow** (`max-w-[680px]`): New Project Wizard (`PER-02`), Authentication forms (`ACC-01`).
- **Standard Reading Canvas** (`max-w-4xl` / `896px`): Project Details (`PUB-02`), Discussion detail.
- **Report & Workspace Canvas** (`max-w-[1400px]`): Feedback Report (`PER-05`), Setup Canvas (`PER-03`).
- **Full Ultra-Wide Canvas** (`max-w-[1600px]`): AI Testing Lab Matrix (`DEV-01`).

---

## 7. Button Hierarchy & Hit Box Standards

| Variant | Visual Appearance | Hover / Active State | Minimum Practical Hit Target |
|---|---|---|---|
| **Primary (Dominant CTA)** | Solid Accent (`bg-[var(--accent)] text-white font-semibold`) | TranslateY -1px / Active +1px | `44px` height (40px compact) |
| **Secondary** | Raised Surface (`bg-[var(--surface-raised)] border border-[var(--border-default)]`) | Surface Hover / Active +1px | `40px` height |
| **Outline** | Transparent (`border border-[var(--border-default)] text-[var(--text-primary)]`) | Subtle background fill | `40px` height |
| **Ghost** | Borderless (`text-[var(--text-secondary)] hover:text-[var(--text-primary)]`) | `bg-[var(--surface-hover)]` | `36px` desktop / `44px` mobile |
| **Destructive** | Rose Accent (`text-rose-600 hover:bg-rose-500/10`) | Red glow / Active +1px | `40px` height |
| **Icon-Only** | Centered icon wrapped in button element | Circular ring focus | `40x40px` desktop / `44x44px` touch |

---

## 8. Form Patterns

- **Inputs**: Standard height `42–44px`, 12px horizontal padding, visible labels above fields (never placeholder-only).
- **Inline Validation**: Error text rendered directly beneath input with an AlertCircle icon and high-contrast red styling (`text-rose-600 dark:text-rose-400`).
- **Textareas**: Minimum height `120px`, expands gracefully to `360px` with persistent draft counter.
- **Checklists**: 24px check targets with clear green check / pending circle visual indicators.

---

## 9. Non-Color Severity Differentiation (WCAG 2.2 AA)

To guarantee access for colorblind and low-vision users, findings **NEVER** communicate severity by color alone:

| Severity Level | Shape | Outline Style | Icon Component | Text Label |
|---|---|---|---|---|
| **Blocker** | `rounded-md` (Octagon) | 2px solid heavy border | `OctagonAlert` (8-sided) | **Blocker** |
| **High** | `rounded-md` (Triangle) | 1.5px solid border | `TriangleAlert` (3-sided) | **High Priority** |
| **Medium** | `rounded-sm` (Square) | 1px border | `AlertCircle` (Circle) | **Medium Priority** |
| **Low** | `rounded-full` (Pill) | 1px dashed/subtle | `Info` (Info symbol) | **Low Priority** |
| **Resolved** | `rounded-full` (Capsule)| 1px solid green | `CheckCircle2` (Checkmark) | **Addressed** |

