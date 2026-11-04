# 01 — Product Design Constitution

## 1. One screen, one meaning

Every screen must answer these questions in its header or design brief:

- What is this screen?
- What is the user's primary goal here?
- What is the one dominant action?

A screen can contain secondary tools, but it must not show two unrelated primary actions with equal prominence. If two goals are genuinely independent, separate them into pages, tabs or explicit modes.

## 2. Product-first visual hierarchy

The work surface is the product. Navigation, metadata, usage summaries and decorative elements must support it, not compete with it.

Recommended priority:
1. Main project/review/content surface.
2. One dominant action.
3. Essential status and context.
4. Supporting controls.
5. Secondary metadata and advanced settings.

Do not use a large dashboard of decorative metrics if the user came to review or improve a project.

## 3. Three spaces

The product has Public, Personal and Creator spaces. Their exact permission semantics remain OPEN. The UI must still make the current space unmistakable and avoid implying that switching spaces changes content visibility.

## 4. Discoverable, collapsible secondary UI

Secondary content should be:
- identifiable through an icon, label, section title or visible affordance;
- compact when not needed;
- expandable without losing the user's current task;
- available through hover, focus and tap as appropriate.

Never hide an essential action behind hover. A tooltip is not a substitute for a label on a high-risk action.

## 5. Every page gets its own responsive design

For each page, specify the desktop composition, tablet simplification and mobile transformation. Mobile is not desktop at 390px.

## 6. Motion is functional

Motion should explain:
- selection;
- expansion/collapse;
- navigation;
- progress;
- completion;
- error/recovery;
- relationship between a card and its detail view.

Motion must never make the user wait for an animation before interacting.

## 7. Accessible by default

Keyboard support, focus visibility, screen-reader names, contrast, error messaging, touch targets and reduced-motion behavior are required acceptance criteria.

## 8. Theme independence

Light, dark and system themes must share the same semantic design tokens. Do not build a separate, inconsistent dark theme with arbitrary colors.

## 9. Honest AI presentation

AI is an assistant, not an infallible authority. Use language such as "AI suggestion", "Potential issue" or "Needs verification" when appropriate. Do not label unverified output as a fact. Preserve user work if a request fails.

## 10. Consistency without sameness

Use one design system, but optimize each page for its specific task. The public discovery page, personal review workspace and creator editor should not be forced into one identical card-grid template.

## 11. Design integrity

Do not copy a reference site's brand identity or proprietary artwork. Extract the pattern (hierarchy, spacing, interaction, density) and adapt it to this product.

## 12. Status and completion

Every interactive element must have a real outcome. A visible button with no behavior is a defect. Every asynchronous action must show pending, success and failure states. Every destructive action must communicate its consequence.
