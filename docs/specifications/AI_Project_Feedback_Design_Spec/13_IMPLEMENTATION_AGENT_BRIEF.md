# 13 — Design and Coding Agent Brief

## Mission

Design and implement the AI Project Feedback product using this specification as the current design baseline. Keep all work within this product's scope.

## Mandatory first steps

1. Read all Markdown files in this pack.
2. Read the actual product requirements and inspect the repository.
3. Identify which page proposals match real approved capabilities.
4. Produce a confirmed/proposed/conditional reconciliation table.
5. Inspect the current framework, routes, styles, components and state model.
6. Reuse existing conventions where sound; do not replace the whole stack because a design resource suggests another framework.
7. Ask no repeated questions already answered by the product requirements.

## Design workflow for every page

Before implementation, create a page brief containing:
- Page ID and route.
- Evidence label.
- One meaning.
- One goal.
- One dominant action.
- User journey entry and exit.
- Desktop layout with approximate widths.
- Tablet changes.
- Mobile changes.
- Component list.
- Exact button labels and outcomes.
- Hover/focus/pressed/selected/disabled/loading states.
- Loading/empty/error/success states.
- Theme behavior.
- Accessibility requirements.
- Motion specification.
- Privacy/visibility implications.

## Component implementation rules

- One semantic button system.
- One icon family.
- One tooltip/popover/dialog implementation system.
- One motion system.
- Use semantic tokens; no scattered magic colors.
- Avoid generic `onClick` placeholders with no real behavior.
- Icon-only buttons require accessible names.
- A tooltip must not be the only way to discover an essential action.
- Avoid nested interactive elements.
- All forms must preserve values on recoverable failures.

## AI-specific implementation rules

- Do not fabricate output or progress.
- Do not invent scores, confidence values or rubrics.
- Show AI-generated content as AI-generated.
- Keep evidence/source references near findings when available.
- Make uncertainty and missing context visible.
- Do not automatically apply suggested changes unless the user explicitly requests it and the product supports it.
- Preserve source project data when review fails.

## Navigation and privacy

- Space switch does not change permission.
- Public page shows only approved public content.
- Personal records remain private according to the approved access model.
- Creator publication must be explicit and previewable if supported.
- Back navigation preserves context.

## Required completion report

For every implemented page report:
1. Page ID and route.
2. Implemented components.
3. Primary and secondary buttons with their actual outcomes.
4. Responsive behavior.
5. Hover/focus/tap behavior.
6. Motion and reduced-motion handling.
7. Theme coverage.
8. Loading/empty/error/success states tested.
9. Accessibility checks.
10. Privacy/permission checks.
11. Tests run and results.
12. Deferred/unsupported actions removed from UI.
13. Known limitations.

## Definition of done

A page is complete only if the design, real interactions, responsive behavior, themes, accessibility, errors, permissions and tests all pass. A visually finished page with placeholder buttons is not complete.
