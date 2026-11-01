# ResearchIntel Responsive Design Specification & Viewport Audit

This document details the responsive layout architecture, breakpoint strategies, touch ergonomics, and the formal verification audit across 10 target viewports.

---

## 1. Breakpoint Architecture

The application adopts a mobile-first responsive strategy built on standard modern device categories:

| Breakpoint | Min Width | Target Devices | Shell Layout | Navigation Experience |
| :--- | :--- | :--- | :--- | :--- |
| **`xs` (Mobile)** | `320px` | iPhone SE, small Android handsets | Full-width single column | Hamburger drawer, sticky top header |
| **`sm` (Compact)** | `390px` – `639px` | iPhone 13/14/15, Galaxy S23 | Full-width single column | Hamburger drawer, sticky top header |
| **`md` (Tablet)** | `768px` | iPad Mini, iPad 10th Gen portrait | Split layout / compact sidebar | Collapsible left rail or top nav |
| **`lg` (Desktop)**| `1024px` | iPad Pro landscape, MacBook Air | Persistent left sidebar (240px) | Full sidebar + Top header (64px) |
| **`xl` (Wide)** | `1280px` | 1080p Desktop displays, MacBooks | Persistent left sidebar (240px) | Full sidebar + Search + Actions |
| **`2xl` (Ultrawide)**| `1440px`+ | High-DPI 4K workstations | Wide content grids, pinned panels | Tailored reading containers |

---

## 2. Adaptive Content Widths

To avoid the common trap of forcing an arbitrary `max-w-7xl` or full-width sprawl across every screen:

* **Reading & Discussion Flows**: Capped at `max-w-4xl` (~896px) to maintain optimal typographic line lengths (65–75 characters per line for human reading comfort).
* **Community Feeds & Dashboards**: Capped at `max-w-6xl` (~1152px) with flexible 2-to-3 column card grids.
* **AI Research Studio Workspace**: Expands up to `max-w-[1600px]` with dual-pane comparison, side-by-side evidence inspectors, and interactive citation drawers.

---

## 3. Touch Ergonomics (< 768px Viewports)

* **44px Minimum Tap Targets**: All buttons, links, theme switches, and form inputs on mobile enforce `min-h-[44px]` with touch-friendly hit areas.
* **Drawer Sheet Dismissal**: The `MobileDrawer` supports one-tap backdrop dismissal, an explicit close button with `aria-label="Close navigation"`, and keyboard `Escape` key handling.
* **Zero Horizontal Overflow**: All flex containers and grids enforce `overflow-x-hidden` or `min-w-0` on children to eliminate accidental horizontal scrolling.

---

## 4. 10-Viewport Screenshot Verification Matrix

Comprehensive automated full-page screenshots were captured in headless Chromium via Chrome DevTools Protocol (CDP) for both Light and Dark modes.

| Viewport Width | Mode Tested | Verification Status | Artifact Path | Key Observations |
| :--- | :--- | :--- | :--- | :--- |
| **320px** | Light & Dark | **Verified** | `docs/screenshots/home_320_*.png` | Clean reflow, header brand + hamburger icon fits without wrapping |
| **360px** | Light & Dark | **Verified** | `docs/screenshots/home_360_*.png` | Touch targets clear, card gutters comfortably padded |
| **390px** | Light & Dark | **Verified** | `docs/screenshots/home_390_*.png` | Standard modern mobile view; clean typography and button spacing |
| **430px** | Light & Dark | **Verified** | `docs/screenshots/home_430_*.png` | iPhone Pro Max layout; excellent thumb reachability |
| **600px** | Light & Dark | **Verified** | `docs/screenshots/home_600_*.png` | Large mobile / foldable portrait; full-width card reflow |
| **768px** | Light & Dark | **Verified** | `docs/screenshots/home_768_*.png` | Tablet view; dual-column cards, drawer navigation active |
| **1024px** | Light & Dark | **Verified** | `docs/screenshots/home_1024_*.png` | Desktop transition; persistent 240px sidebar active, visual panel on auth |
| **1280px** | Light & Dark | **Verified** | `docs/screenshots/home_1280_*.png` | Standard desktop; balanced sidebar, header search, and feed layout |
| **1440px** | Light & Dark | **Verified** | `docs/screenshots/home_1440_*.png` | Wide desktop; comfortable breathing room, no layout stretching |
| **1920px** | Light & Dark | **Verified** | `docs/screenshots/home_1920_*.png` | Workstation display; content centered with bounded readable container |

---

## 5. Viewport-Specific Auth Layout Verification

Across all 5 dedicated authentication pages (`/login`, `/signup`, `/forgot-password`, `/verify-email`, `/auth/callback`):
* **320px – 768px**: Focused single-column form with centered brand logo and clean top navigation links (`Back` link responsive switch).
* **1024px – 1920px**: Dual-column layout with left form and right `AuthVisualPanel` highlighting Candid Anonymity, Bounded Threading, and Dual-Source RAG Grounding.

