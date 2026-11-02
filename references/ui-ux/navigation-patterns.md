# Navigation Patterns & Information Architecture

This document analyzes the primary navigation systems, app headers, sidebars, command palettes, and responsive drawer menus across the reference repositories.

---

## 1. Comparative Navigation Taxonomy

| Repository | Primary Shell Model | Header Architecture | Sidebar Model | Command Palette | Breadcrumb Strategy |
|---|---|---|---|---|---|
| **Open-Launch** | Top Navbar Only | Sticky, `backdrop-blur-md`, search input, user avatar | None (Full-width pages) | None | Category-based breadcrumbs |
| **Quackback** | Dual Header + Admin Sidebar | Sticky header with board switcher and auth bell | Collapsible icon + text sidebar for Admin workspace | `cmdk` (Quick actions & post search) | Hierarchical (Board > Status > Post) |
| **Fider** | Clean Minimal Header | Fixed top bar with logo, search icon, and login button | None | None | Simple back-link (`< Back to ideas`) |
| **Peerlist-Clone** | 3-Column Social Layout | Fixed top bar with search, notification bell, avatar | Left sidebar (Nav) + Right sidebar (Trending / Spotlight) | None | Flat page navigation |
| **Our Platform** | Hybrid Commercial App Shell | Sticky glassmorphic header + Command Palette (`Ctrl+K`) | Studio / Feedback Collapsible Sidebar | `cmdk` search + AI brief shortcut | Breadcrumbs with stage indicator |

---

## 2. Header Architecture & Glassmorphic Effects

In both **Quackback** (`apps/web/src/components/public/portal-header.tsx`) and **Open-Launch** (`components/header.tsx`):
- **Glassmorphism**: Header uses `bg-background/80 backdrop-blur-md border-b border-border/40`. As users scroll through product feeds, content softly blurs underneath the header, preserving spatial awareness while maintaining high contrast for navigation items.
- **Header Elements**:
  1. *Brand Identity*: Logo icon + wordmark linking to home.
  2. *Global Search Trigger*: Search box or keyboard shortcut button (`Search products... ⌘K`).
  3. *Primary Navigation Links*: Discover, Roadmaps, Changelog, Leaderboard.
  4. *Action Trigger*: Prominent `+ Launch Prototype` CTA button.
  5. *Notification Bell*: Unread count badge indicating new feedback or upvotes.
  6. *User Menu*: Dropdown showing profile, developer settings, theme toggle, and sign out.

---

## 3. Command Palette (`Ctrl+K` / `Cmd+K`) Engine

Quackback integrates the `cmdk` primitive library, delivering instant keyboard accessibility:
- **Shortcut Trigger**: Global keydown listener on `Ctrl+K` or `Cmd+K`.
- **Search Capabilities**:
  - Filter across feedback posts, bug reports, and roadmap items in real-time.
  - Direct action triggers (e.g., `> Submit new feedback`, `> Switch to Dark Theme`, `> View My Prototypes`).
  - Recent searches cache with keyboard arrow-key navigation.
- **Why Developers Love It**: Power users and developers avoid mouse travel, navigating the entire platform via keystrokes.

---

## 4. Admin & Creator Studio Sidebar Layout

For creators managing incoming feedback, roadmaps, and analytics, Quackback provides an optimized sidebar layout (`apps/web/src/components/admin/admin-sidebar.tsx`):
- **Structure**:
  - Top: Workspace name with dropdown switcher.
  - Core Navigation:
    - 📥 Feedback Inbox (with unread badge)
    - 🗺️ Public Roadmap
    - 🚀 Launches & Spotlight
    - 📢 Changelogs
    - 📊 Analytics & Impact
    - ⚙️ Settings & Team RBAC
  - Bottom: Current user card with collapse toggle (`[<]`).
- **Collapsible States**: Can collapse into icon-only mode (64px width) to maximize canvas width for wide Kanban boards and data tables.

---

## 5. Mobile Drawer & Navigation Patterns

On mobile viewports (< 768px):
- **Bottom Navigation Bar**: Peerlist-Clone and Quackback place core destinations (Home, Search, Notifications, Profile) within thumb reach at the bottom of the screen.
- **Sliding Drawer Menu**: The top-right hamburger icon opens a Radix `Sheet` sliding from the right, providing secondary links (Documentation, Legal, Settings) with smooth spring animations.

---

## 6. Recommendations for Our Platform

1. **Retain Glassmorphic Sticky Header**: Ensure content flows smoothly beneath the header without visual clipping.
2. **Standardize on Command Palette (`Ctrl+K`)**: Allow instant navigation across products, testing sessions, feedback cards, and audio briefs.
3. **Collapsible Studio Sidebar for Creators**: Ensure creators have a distraction-free workspace when reviewing feedback and organizing roadmaps.
4. **Thumb-Friendly Mobile Bottom Bar**: Guarantee developers can browse products and check feedback notifications effortlessly on mobile phones.

