# ResearchIntel Project UX Rules & Interaction Constitution

This document defines the overarching UX rules, accessibility standards, and interaction invariants for the **ResearchIntel** platform. All subsequent feature development across Phases 2 through 5 must adhere to this constitution.

---

## 1. Core Principles

1. **Social Translucence over Opaque Tracking**: Make participation, authorship, peer feedback, review status, and moderation actions visible and accountable without exposing sensitive or private personal details (Erickson & Kellogg, 2000).
2. **Dual-Evidence Grounding**: Never present an AI synthesis as unverified ground truth. Every AI claim must be traceable to community discussion excerpts or uploaded product documents (PAIR, Hong & Park, 2025).
3. **Structured Discussion Flow**: Preserve clear conversation topography. Favor bounded threading (max 2 levels) over infinitely deep nests, and maintain chronological readability for screen readers and mobile viewports (Aragón et al., 2017).
4. **Post Guidance without Coercion**: Guide authors toward clear titles, relevant problem categories, and constructive product feedback without turning post creation into an intimidating multi-page bureaucratic form (Ribeiro et al., 2025).
5. **Universal Accessibility (WCAG 2.2 AA)**: Every screen, form, overlay, and control must be operable by keyboard alone, legible across light and dark modes with high contrast ratios, and responsive down to 320px viewport width without horizontal scrolling.

---

## 2. Accessibility & Interaction Standards (WCAG 2.2 AA)

### 2.1 Contrast & Color Accessibility
* **Text Contrast**: Normal text (< 18pt or < 14pt bold) must maintain a minimum contrast ratio of **4.5:1** against its background in both Light and Dark modes. Large text (≥ 18pt or ≥ 14pt bold) must maintain at least **3:1**.
* **UI Component & Border Contrast**: Interactive component boundaries, active icons, and focus indicators must maintain at least **3:1** against adjacent background colors.
* **Non-Color Dependence**: Information conveyed with color (e.g., error banners, evidence badges, status indicators) must also include an accompanying icon, textual label, or distinctive shape.

### 2.2 Focus Indicators & Keyboard Navigation
* **Global Focus Ring**: Any focused element must display a visible outline: `outline: 2px solid var(--primary); outline-offset: 2px;` via `:focus-visible`.
* **No Focus Traps**: Dialogs, slide-overs, and dropdown menus must trap keyboard focus while open, release focus upon dismissal, and return focus to the triggering element.
* **Keyboard Shortcuts**:
  * `/`: Focus global search input from anywhere in the app (when not typing in an input or textarea).
  * `Escape`: Close open drawers, modals, dropdowns, and search overlays.
  * `Tab` / `Shift+Tab`: Logical tab order following visual reading direction (left-to-right, top-to-bottom).

### 2.3 Touch Targets & Responsive Reflow
* **Touch Targets (Mobile)**: All interactive buttons, icon buttons, links, and form fields must measure at least **44 × 44 CSS pixels** on viewports `< 768px`.
* **Desktop Controls**: Desktop interactive controls must maintain a minimum height of **40px** (`sm` button min 36px with adequate padding).
* **Reflow (No Horizontal Scroll)**: The layout must dynamically reflow without horizontal scrolling at viewports from 320px up to 1920px.

### 2.4 Motion & Vestibular Safety
* **Respect Reduced Motion**: Always wrap continuous animations, pulses, or transitions in `@media (prefers-reduced-motion: no-preference)` or use Tailwind `motion-safe:`.
* Skeletons under reduced motion must render as static muted blocks rather than cycling pulses.

---

## 3. Social Translucence Rules (Erickson & Kellogg, 2000)

* **Mutual Visibility**: Reviewers and product creators must have clear visibility into who is providing feedback. When reviews are anonymous, clearly designate them as *"Verified Reviewer (Candid Mode)"* with verified reputation scores rather than mysterious untracked avatars.
* **Author Accountability**: Badges indicate creator role:
  * `Product Owner`: Founder or maintainer of the reviewed product.
  * `Top Contributor`: Reviewer with high community upvote ratio.
  * `Staff / Moderator`: System moderators handling policy enforcement.
* **Visible Discussion Status**: Post headers must clearly indicate state: `Open for Review`, `Under Investigation`, `Addressed in Roadmap`, or `Closed`.
* **Public Moderation Trace**: Moderated or flagged content must display neutral context (e.g., *"Comment removed by moderator for violating community guidelines"*) rather than silently disappearing.

---

## 4. Conversation Threading Rules (Aragón et al., 2017)

* **Bounded Hierarchy**: Discussion comments allow root level and **1 nested reply level** (max depth = 2). Beyond depth 2, replies are anchored with an `@Username` reference at depth 2 to prevent extreme horizontal indentation collapse on mobile devices.
* **Contextual Anchor**: Clicking a reply link jumps to and temporarily highlights the parent comment with a smooth scroll.
* **Collapsible Sub-Threads**: Threads with more than 3 nested replies include an accessible expand/collapse toggle displaying remaining reply counts (e.g., *"Show 4 more replies"*).

---

## 5. Human-AI Interaction & Grounding Rules (PAIR / Amershi et al., 2019 / Hong & Park, 2025)

* **Strict Visual Separation**:
  * **Community Evidence**: Styled with teal badge and border (`--evidence-community: #0F766E` / `#2DD4BF`).
  * **Document Evidence**: Styled with blue badge and border (`--evidence-document: #2563EB` / `#60A5FA`).
  * **AI Synthesis / Insight**: Styled with purple badge and border (`--ai-synthesis: #7C3AED` / `#A78BFA`).
* **Citation Chips**: Every AI-synthesized finding must provide interactive citation pills (`[C-1]`, `[D-2]`). Clicking an evidence chip opens the source comment or highlights the cited document excerpt.
* **Uncertainty & Boundaries**: When AI has insufficient evidence, it must explicitly state: *"No conclusive community evidence found"* rather than speculating.
* **User Control**: Users must have the ability to copy findings, filter evidence sources, regenerate analyses, and export markdown reports.

---

## 6. Post Guidance & Composition Rules (Ribeiro et al., 2025)

* **Non-Blocking Assistance**: Post creation guides users with gentle tips (e.g., *"Clear titles get 3x more peer reviews"*) without disabling the submit button or forcing strict schemas.
* **Real-Time Duplicate Awareness**: As users type a title, suggest similar existing discussions asynchronously to prevent duplicate threads.
* **Tag & Category Guidance**: Automatically suggest 2-3 relevant categories based on draft content with a one-click apply button.

---

## 7. Responsive Breakpoint Rules

| Viewport Range | Breakpoint | Shell Layout | Content Max Width | Touch Target |
| :--- | :--- | :--- | :--- | :--- |
| **320px – 639px** | Mobile (`< sm`) | Collapsible Drawer, Single Column | 100% full-width (`px-4`) | ≥ 44px |
| **640px – 767px** | Large Mobile (`sm`) | Collapsible Drawer, Reflowing Cards | 100% full-width (`px-6`) | ≥ 44px |
| **768px – 1023px** | Tablet (`md`) | Compact Sidebar, Multi-column | `max-w-4xl` / `max-w-6xl` | ≥ 40px |
| **1024px – 1279px** | Desktop (`lg`) | Persistent Sidebar (240px), Top Header | `max-w-6xl` | ≥ 40px |
| **1280px – 1599px** | Large Desktop (`xl`) | Persistent Sidebar (240px), Top Header | `max-w-6xl` (Studio: `max-w-[1600px]`) | ≥ 40px |
| **≥ 1600px** | Ultra-wide (`2xl`) | Persistent Sidebar (240px), Centered Content | Tailored max-width to avoid line length bloat | ≥ 40px |

---

## 8. Anti-Regression Invariants

1. Never remove or bypass Supabase authentication session management.
2. Never hardcode colors; always use semantic CSS variables (`var(--bg-app)`, `var(--text-primary)`, `var(--primary)`, etc.).
3. Never use raw `window.alert` or `window.confirm`; use accessible toast or dialog components.
4. Always support both Light and Dark modes across all newly introduced UI components.

