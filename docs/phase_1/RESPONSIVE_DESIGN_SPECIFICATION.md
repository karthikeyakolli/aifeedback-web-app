# Responsive Design Specification

> **Document Type**: Phase 1 Core Deliverable  
> **Status**: `CONFIRMED / APPROVED FOR IMPLEMENTATION`  
> **Version**: 1.0.0  
> **Date**: November 2, 2026  
> **Audience**: Frontend Engineers, UX Designers, QA Leads  

---

## 1. Responsive Philosophy

Responsive design in this product follows the constitutional rule:
> **"Design every screen individually for desktop, tablet, and mobile. Do not simply shrink desktop layouts."**

Each viewport tier receives dedicated layout restructuring, touch hit target calibration, and interaction adaptation.

---

## 2. Breakpoint Architecture

| Viewport Tier | Width Range | Target Devices | Layout Strategy |
|---|---|---|---|
| **Desktop Wide** | `>= 1280px` | Laptops, Desktop Monitors | Full 3-pane layout (Sidebar + Main Work Canvas + Right Inspector). |
| **Desktop Standard** | `1024px - 1279px` | Compact Laptops, iPad Landscape | Collapsible sidebar (72px rail default), main canvas with drawer inspector. |
| **Tablet Portrait** | `640px - 1023px` | iPad Portrait, Surface tablets | 2-column project grids, top app bar with mobile menu toggle. |
| **Mobile Standard** | `390px - 639px` | Modern Smartphones (iPhone 14/15, Pixel) | Single-column stack, bottom navigation bar, bottom sheet drawers. |
| **Mobile Narrow** | `320px - 389px` | iPhone SE, compact Androids | Dense typography, stacked form controls, full-screen dialogs. |

---

## 3. Viewport-by-Viewport Layout Transformations

### A. Navigation Shell Transformation

```
Desktop (>= 1024px)               Mobile (< 640px)
+----------+--------------------+  +-----------------------------+
| Sidebar  | Main Work Canvas   |  | [☰] Header         [User 👤] |
| [Logo]   |                    |  +-----------------------------+
| [Spaces] |                    |  | Main Work Canvas (1 Col)    |
| [Nav]    |                    |  |                             |
|          |                    |  +-----------------------------+
|          |                    |  | Bottom Bar:                 |
+----------+--------------------+  | [Home] [Explore] (+) [Saved]|
                                   +-----------------------------+
```

1. **Desktop**: Left fixed sidebar (250px or 72px rail); global sticky header with breadcrumbs.
2. **Mobile**:
   - Sidebar converts to an off-canvas **Slide-Over Drawer** (`MobileDrawer.tsx`).
   - Sticky top bar retains brand, search trigger, theme switcher, and avatar.
   - Fixed **Bottom Navigation Bar** (`MobileNav.tsx`) pins core destinations and the dominant `+ New` button directly under user thumb reach.

---

### B. Project Setup & Context Input (`PER-03`)

- **Desktop (>= 1024px)**:
  - 2-column split layout.
  - Left column (`1fr`): Form fields (description textarea, repository URL, document uploads).
  - Right column (`300px`): Persistent **Review Readiness Checklist** showing live completion badges.
  - Dominant CTA `Start AI review` pinned at the bottom of the checklist.
- **Mobile (< 640px)**:
  - Form fields stack vertically in a clean single column.
  - **Readiness Checklist** is summarized as a compact sticky banner at the top (`Readiness: 5/5 Ready`).
  - Dominant CTA `Start AI review` is pinned to the bottom of the screen above the mobile nav bar.

---

### C. Feedback Report & Finding Inspector (`PER-05` / `PER-06`)

- **Desktop (>= 1024px)**:
  - Side-by-side split (`1fr / 320px`).
  - Left: Executive summary, strengths overview, and interactive finding cards.
  - Right: **Contextual Right Inspector** displays full cited evidence quotes and status toggles for the selected finding.
- **Tablet (640px - 1023px)**:
  - Main report occupies full width.
  - Clicking a finding opens the inspector as an off-canvas right sheet.
- **Mobile (< 640px)**:
  - Findings display as full-width cards with large touch targets.
  - Tapping a finding opens an accessible **Bottom Drawer Sheet** (`Drawer.tsx`), sliding up from the bottom with full evidence and status options.

---

## 4. Touch Ergonomics & Hit Targets

1. **Practical Hit Boxes**:
   - Every interactive control (button, tab, select, checkbox, menu trigger) has a minimum physical bounding box of **44x44px** on touch devices.
   - For compact icon buttons on desktop (e.g. 32px), pseudo-elements (`::after`) expand the interactive hit area to 44px on mobile devices via `@media (pointer: coarse)`.
2. **Thumb Zone Prioritization**:
   - Destructive or secondary actions are placed in upper screen zones to prevent accidental activation.
   - Primary forward-advancing actions (`Start AI review`, `Continue to Setup`, `Work on Improvements`) are anchored in the natural lower thumb arc.

---

## 5. Form & Keyboard Behavior on Mobile

- Text inputs employ appropriate HTML5 input types (`type="email"`, `type="url"`, `enterkeyhint="next"`).
- Virtual keyboard appearance does not break layout: fixed action bars use `position: sticky` and accommodate dynamic viewport height (`100dvh`).
- When inputs receive focus, the field scrolls cleanly into view with comfortable breathing room above the virtual keyboard.

