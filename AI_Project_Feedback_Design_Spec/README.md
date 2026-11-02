# AI Project Feedback — Detailed Product Design Specification

> **Purpose:** A practical, page-by-page design and implementation contract for the AI Project Feedback product. It describes layouts, visual hierarchy, button behavior, navigation, user flows, responsive changes, animation, hover/focus/tap behavior, and free design resources.

## Read this first

This pack is intentionally limited to the **AI Project Feedback product**. It does not import requirements from any other project.

The recovered discussion confirms the design principles below, but not a complete message-by-message sitemap or every AI capability. Therefore:

- **CONFIRMED** means supported by the recovered product discussion.
- **PROPOSED BASELINE** means a concrete design recommendation to make the product implementable. It is not claimed to be an earlier user-approved decision.
- **CONDITIONAL** means only implement it if the product actually supports that capability.
- **OPEN** means the correct behavior depends on an unresolved product decision.

Do not turn a proposed or conditional item into a product promise without confirming it.

## Confirmed design rules

1. There are three spaces: **Public, Personal and Creator**.
2. Every screen has **one meaning, one goal and one dominant action**.
3. The product's actual task/work surface receives the maximum screen priority.
4. Supporting content stays identifiable but compact or collapsible.
5. Labels and supporting context can be revealed on hover, keyboard focus or tap.
6. Each screen is individually responsive; do not simply shrink desktop.
7. Effects, transitions and animations must be specified.
8. Support light, dark and system-adaptive themes.
9. Accessibility is part of the design, not a later patch.
10. Preserve every previously accepted suggestion unless it conflicts with an explicit confirmed decision.

## How to use this pack

| Order | File | Purpose |
|---|---|---|
| 1 | `00_SCOPE_AND_EVIDENCE.md` | Product boundary, confidence labels and assumptions |
| 2 | `01_PRODUCT_DESIGN_CONSTITUTION.md` | Non-negotiable design rules |
| 3 | `02_SPACES_AND_NAVIGATION.md` | Public, Personal and Creator structure |
| 4 | `03_ROUTE_MAP_AND_PAGE_INDEX.md` | Proposed sitemap and page IDs |
| 5 | `04_PUBLIC_PAGE_SPECS.md` | Public-facing pages, layouts and exact proposed actions |
| 6 | `05_PERSONAL_PAGE_SPECS.md` | Personal project, review and feedback pages |
| 7 | `06_CREATOR_PAGE_SPECS.md` | Creator pages; conditional functionality is clearly marked |
| 8 | `07_USER_FLOWS.md` | End-to-end flows and decision points |
| 9 | `08_BUTTON_AND_CONTROL_CATALOG.md` | Shared button rules and page-by-page action inventory |
| 10 | `09_MOTION_HOVER_AND_INTERACTION.md` | Timing, hover, focus, tap, transitions and micro-interactions |
| 11 | `10_VISUAL_DESIGN_SYSTEM.md` | Grid, spacing, typography, color, surfaces and component recipes |
| 12 | `11_RESPONSIVE_ACCESSIBILITY_AND_THEMES.md` | Breakpoints, mobile transformations, WCAG and themes |
| 13 | `12_FREE_REFERENCE_AND_ASSET_LIBRARY.md` | Free design inspiration, UI kits, components, fonts and assets |
| 14 | `13_IMPLEMENTATION_AGENT_BRIEF.md` | Instructions for design/coding agents |
| 15 | `14_DECISION_REGISTER.md` | Confirmed decisions, proposed decisions and unresolved questions |
| 16 | `15_PAGE_QA_AND_ACCEPTANCE.md` | Review checklist for each implemented page |

## Important implementation boundary

This is a design contract, not a backend specification. It does not authorize inventing scoring algorithms, AI models, project file limits, supported file types, pricing, moderation policies, account roles, permissions or publication rules. Those must come from product requirements and the actual implementation.

## Suggested working method

For each page, first approve the *purpose and dominant action*, then its wireframe, then its component-level behavior, then the visual treatment. Do not polish an unapproved workflow. Keep a page's primary task visible and place optional functions in a clearly discoverable secondary layer.
