# ResearchIntel Community Responsive Layouts Specification

This document details the responsive layout design, breakpoint behavior, and touch ergonomics across all community pages established in Phase 2.

---

## 1. Responsive Viewport Strategy

The community interface enforces fluid, accessible reflow across all target viewports:

| Viewport Category | Width Range | Layout Shell | Feed Strategy | Product Grid |
| :--- | :--- | :--- | :--- | :--- |
| **Mobile (`xs`)** | `320px` – `389px` | Sticky Header + Slide Drawer | Single column cards, full width (`px-3`) | 1 column full width |
| **Standard Mobile (`sm`)** | `390px` – `639px` | Sticky Header + Slide Drawer | Single column cards, comfortable gutters (`px-4`) | 1 column full width |
| **Tablet (`md`)** | `768px` – `1023px` | Collapsible Rail + Drawer | Single column feed with wider reading space | 2 columns responsive |
| **Desktop (`lg`)** | `1024px` – `1279px` | Persistent Sidebar (240px) + Header | 2-col feed + 1-col Contextual Discovery Panel | 3 columns responsive |
| **Large Desktop (`xl`)** | `1280px` – `1599px` | Persistent Sidebar (240px) + Header | 2-col feed + 1-col Contextual Discovery Panel | 3 columns responsive |
| **Workstation (`2xl`)** | `1600px`+ | Persistent Sidebar (240px) + Header | Centered content capped at `max-w-6xl` | 3 columns with roomy gutters |

---

## 2. Page-by-Page Layout Reflow

### 2.1 Community Feed (`/`)
* **Desktop (≥ 1024px)**: Uses a 3-column CSS grid (`lg:grid-cols-3 gap-6`).
  * Left 2 columns: Main discussion stream, sorting tabs, search bar, intent pills.
  * Right 1 column: Contextual Discovery Panel featuring "Featured Products Seeking Feedback", "Trending Topic Tags", and "Reviewer Guidelines".
* **Mobile (< 1024px)**: The discovery panel is cleanly omitted (`hidden lg:block`), focusing 100% of the mobile screen on the content stream with zero awkward horizontal wrapping.

### 2.2 Product Catalog (`/explore`)
* Employs CSS grid reflow:
  * Mobile: `grid-cols-1`
  * Tablet: `sm:grid-cols-2`
  * Desktop: `lg:grid-cols-3`
* Product cards maintain uniform card heights and tactile hover elevation.

### 2.3 Product Detail Page (`/products/:id`)
* **Desktop (≥ 1024px)**:
  * Hero banner spans full width with creator link and visit website CTA.
  * 4-column metric tiles (`grid-cols-4`).
  * Split content: Left 2 columns contain Product Overview, Description, and Features; Right 1 column displays recent community review quotes and privacy guidelines.
* **Mobile (< 1024px)**:
  * Metric tiles reflow into a 2 × 2 grid (`grid-cols-2`).
  * Description, Features, and Feedback stack linearly in a natural thumb-scroll hierarchy.

### 2.4 Discussion Details (`/posts/:id`)
* Capped at `max-w-4xl` (~896px) to maintain comfortable typographic line lengths (65–75 characters per line).
* Comment threads feature bounded visual indentation (`MAX_VISUAL_DEPTH = 2`), ensuring nested replies never squash horizontally on 320px screens.

---

## 3. Touch Ergonomics & Accessibility

* **Minimum Hit Targets**: All voting pills, bookmark buttons, category chips, and drawer links enforce a minimum of **44 × 44 CSS pixels** on mobile viewports.
* **Overflow Immunity**: All text containers and badge clusters enforce `truncate` or `break-words` with `min-w-0` on flex items, preventing horizontal scrollbars.
* **Keyboard Invariants**: Focus rings (`outline: 2px solid var(--primary)`) remain visible across all viewport sizes when tabbing with assistive technologies.

