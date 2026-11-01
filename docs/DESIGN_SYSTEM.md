# ResearchIntel Design System Specification

This document details the visual design language, design tokens, typography, spacing, radius, elevations, and reusable component APIs established in Phase 1 for the **ResearchIntel** application.

---

## 1. Design Token Architecture

The design system is implemented using CSS custom properties declared in `src/index.css` under `:root` (Light mode) and `.dark` (Dark mode). These tokens feed directly into Tailwind CSS and custom component styling.

### 1.1 Color Tokens

| Semantic Token | CSS Variable | Light Mode Value | Dark Mode Value | Usage Description |
| :--- | :--- | :--- | :--- | :--- |
| **App Background** | `--bg-app` | `#F7F8FC` | `#0D1321` | Base viewport background behind cards and layout shells |
| **Surface** | `--bg-surface` | `#FFFFFF` | `#151D2E` | Primary container, cards, modals, dropdowns |
| **Secondary Surface**| `--bg-secondary` | `#F1F3F9` | `#1B2638` | Subtle wells, active tab highlights, hover fills |
| **Primary Text** | `--text-primary` | `#172033` | `#EEF2FF` | Headings, body copy, active labels (contrast > 10:1) |
| **Muted Text** | `--text-muted` | `#667085` | `#A6B0C3` | Captions, metadata, placeholders (contrast > 4.5:1) |
| **Subtle Border** | `--border-subtle`| `#E6E8EF` | `#293449` | Card boundaries, dividers, table borders |
| **Primary Brand** | `--primary` | `#4F46E5` | `#818CF8` | Primary CTA buttons, focus rings, active navigation items |
| **Primary Hover** | `--primary-hover`| `#4338CA` | `#6366F1` | Interactive hover state for primary elements |
| **Community Evidence**| `--evidence-community`| `#0F766E` | `#2DD4BF` | Badges and borders for peer review feedback citations |
| **Document Evidence** | `--evidence-document` | `#2563EB` | `#60A5FA` | Badges and borders for uploaded document/spec citations |
| **AI Synthesis** | `--ai-synthesis` | `#7C3AED` | `#A78BFA` | Badges and indicators for LLM insights and summaries |
| **Danger / Error** | `--color-danger` | `#EF4444` | `#F87171` | Destructive buttons, error banners, validation alerts |
| **Success** | `--color-success` | `#10B981` | `#34D399` | Verification indicators, confirmation notices |
| **Warning** | `--color-warning` | `#F59E0B` | `#FBBF24` | Review warning states, attention alerts |

---

## 2. Typography & Scale

The system relies on high-legibility system sans-serif font stack with Inter optimization:
`font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;`

### 2.1 Typographic Scale

| Class | Font Size | Line Height | Tracking | Weight Options | Typical Application |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `text-xs` | 12px (0.75rem) | 16px (1.33) | `tracking-normal` | 400, 500, 600 | Metadata, timestamps, badges, microcopy |
| `text-sm` | 14px (0.875rem) | 20px (1.43) | `tracking-normal` | 400, 500, 600 | Secondary body, input fields, navigation links |
| `text-base` | 16px (1.00rem) | 24px (1.50) | `tracking-normal` | 400, 500 | Primary body text, readable discussion paragraphs |
| `text-lg` | 18px (1.125rem) | 28px (1.55) | `tracking-tight` | 600, 700 | Subsection headers, card titles |
| `text-xl` | 20px (1.25rem) | 28px (1.40) | `tracking-tight` | 600, 700, 800 | Section headers, modal titles |
| `text-2xl` | 24px (1.50rem) | 32px (1.33) | `tracking-tight` | 700, 800 | Page titles, auth headers |
| `text-3xl` | 30px (1.875rem) | 36px (1.20) | `tracking-tight` | 800 | Hero headers, marketing headers |

---

## 3. Spacing, Elevation & Corner Radius

### 3.1 Spacing Scale (4px Base Grid)
* `space-1` (4px), `space-2` (8px), `space-3` (12px), `space-4` (16px), `space-6` (24px), `space-8` (32px), `space-12` (48px).

### 3.2 Corner Radius Scale
* `rounded-md`: 6px — subtle badge corners, form input inner chips.
* `rounded-lg`: 8px — buttons, dropdown options.
* `rounded-xl`: 12px — inputs, icons, compact cards.
* `rounded-2xl`: 16px — feed cards, popovers, drawers.
* `rounded-3xl`: 24px — primary modal dialogs, authentication containers.
* `rounded-full`: 9999px — avatars, pill badges, floating action buttons.

### 3.3 Elevation & Shadows
* **Flat**: `shadow-none border border-[var(--border-subtle)]` — standard cards and sidebar.
* **Elevation 1 (Card Hover)**: `var(--card-shadow)` — `0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)`.
* **Elevation 2 (Dropdown / Popover)**: `shadow-lg border border-[var(--border-subtle)]`.
* **Elevation 3 (Modal / Dialog)**: `shadow-2xl border border-[var(--border-subtle)]`.

---

## 4. Reusable Core Component Specifications

### 4.1 Button (`src/components/common/Button.tsx`)
```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
```
* **Primary**: Filled with `bg-[var(--primary)]` (indigo-600 in light, indigo-500 in dark), white text, subtle shadow, touch-friendly `min-h-[44px]` on mobile.
* **Secondary**: Filled with `bg-[var(--bg-secondary)]`, bordered with `border-[var(--border-subtle)]`, text `[var(--text-primary)]`.
* **Outline**: Transparent background with explicit border `border-[var(--border-subtle)]`, hover fill `bg-[var(--bg-secondary)]`.
* **Ghost**: Minimal padding without border; ideal for toolbars and table row actions.
* **Danger**: Red fill or red outline for destructive deletion and reporting workflows.
* **Loading State**: Displays animated spinner in place of left icon, disables clicks, maintains exact button geometry to prevent cumulative layout shift (CLS).

### 4.2 Card (`src/components/common/Card.tsx`)
```tsx
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  variant?: 'default' | 'muted' | 'outline';
}
```
* Renders `bg-[var(--bg-surface)]` with `border border-[var(--border-subtle)]` and `rounded-2xl`.
* Smooth transition for hover effects: `transition: transform 0.15s ease, box-shadow 0.15s ease`.

### 4.3 Theme Switcher (`src/components/common/ThemeSwitcher.tsx`)
* Supports 3 modes: `light`, `dark`, and `system`.
* **Segmented Variant**: Pill container with 3 buttons showing icons (Sun, Moon, Monitor), `aria-pressed` states, and accessible tooltips.
* **Dropdown Variant**: Compact single button showing active icon; expands menu on click with keyboard arrow-key navigation.

### 4.4 Loading Skeletons (`src/components/common/LoadingSkeletons.tsx`)
* `Skeleton`: Base pulse block using `bg-[var(--border-subtle)]` with `rounded-md`.
* `CardSkeleton`: Simulates post header, title, description, and metadata pills.
* `FeedSkeleton`: Renders stacked card skeletons with staggered widths.
* `TableSkeleton`: Simulates tabular rows for documents or logs.
* `PageSkeleton`: Simulates full layout shell with sidebar and header placeholders.
* **Reduced Motion Compliance**: Automatically switches off `animate-pulse` and renders static low-opacity blocks when `prefers-reduced-motion: reduce` is enabled.

### 4.5 App Loading Screen (`src/components/common/AppLoadingScreen.tsx`)
* Branded full-screen loader shown exclusively on cold start during session restore.
* Features a 5-second fallback timeout offering **Retry** and **Continue as Guest** recovery buttons, ensuring users are never trapped in a permanent blank screen.

