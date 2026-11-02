# 10 — Visual Design System and Layout Rules

> These are proposed starting tokens, not final brand decisions. Confirm the product identity and reference direction before locking colors or typography.

## 1. Design direction

Recommended direction: **calm, precise, modern product workspace**. The AI feedback itself should feel trustworthy and readable. Avoid excessive gradients, glassmorphism everywhere, noisy backgrounds, oversized dashboard metrics or novelty animation that distracts from project work.

Possible visual ingredients:
- neutral foundation;
- one memorable primary accent;
- clear semantic feedback colors;
- soft elevation reserved for interactive layers;
- restrained accent gradients only for the landing hero or AI-related highlight, not every card.

## 2. Layout grid

### App shell
- Desktop sidebar: 224–256px expanded; 68–72px collapsed.
- Header: 60–68px height.
- Main content horizontal padding: 24–32px desktop.
- Comfortable content max width: 1200–1360px for overview pages.
- Text/report reading width: 680–820px.
- Optional contextual inspector: 280–340px.
- Main/inspector split: approximately 1fr / 300px, not two equally weighted columns.

### Spacing scale
Use a consistent 4px base:
- 4px: icon/text micro-gap.
- 8px: tight related controls.
- 12px: compact form group.
- 16px: standard component gap.
- 20px: card internal rhythm.
- 24px: section rhythm.
- 32px: page section gap.
- 40–48px: major page separation.
- 64–80px: marketing section spacing.

Do not use all spacing values everywhere. Use semantic aliases such as `space-control`, `space-card`, `space-section`.

## 3. Typography

Proposed hierarchy:
- Display/hero: 44–60px desktop; 34–42px mobile.
- Page title: 28–36px desktop; 24–30px mobile.
- Section heading: 18–22px.
- Body: 14–16px; 16px for long-form reading.
- Metadata: 12–13px, but never make essential content tiny.
- Button: 14–15px medium/semibold.
- Line height: 1.45–1.65 for paragraphs; 1.2–1.35 for headings.

Candidate free/open font sources are in document 12. Choose one body family and at most one display family. Verify font license and load performance.

## 4. Color tokens

Do not hardcode hex colors in individual components. Define semantic roles:
- `canvas`
- `surface`
- `surface-raised`
- `surface-hover`
- `text-primary`
- `text-secondary`
- `text-muted`
- `border-default`
- `border-strong`
- `accent`
- `accent-foreground`
- `focus-ring`
- `success`, `warning`, `danger`, `info`
- `overlay`

The final palette must pass contrast tests in all themes. Status colors need accompanying text/icons.

## 5. Corner radius and elevation

Proposed radii:
- Small control: 8px.
- Input/button: 10px.
- Card: 12–16px.
- Dialog/sheet: 16–20px.
- Pill: full radius, only for tags/chips.

Elevation:
- Base surface: no shadow or minimal.
- Hover card: subtle elevation.
- Popover: clear surface separation.
- Dialog: stronger shadow + scrim.
- Avoid nested shadows on every child.

## 6. Buttons
- Default height: 40px.
- Compact: 32–36px for dense toolbar only.
- Large primary CTA: 44–48px.
- Horizontal padding: 14–18px.
- Icon gap: 8px.
- Icon-only hit box: at least 40px practical; aim for 44px on touch.
- Keep labels verb-first and action-specific.

## 7. Inputs
- Standard input height: 42–44px.
- Label stays visible; do not rely on placeholder as label.
- Helper text under field.
- Error text immediately adjacent to input.
- File inputs show filename, size if available, processing state and remove action.
- Large project-context text area grows to a reasonable maximum and preserves the user's draft.

## 8. Cards and report findings
- Card header: title + state/metadata.
- Body: concise explanation.
- Footer/action: one clear interaction.
- Report finding cards should prioritize finding title and recommendation over decorative score badges.
- Distinguish severity/status through shape, icon and text—not color alone.

## 9. Icons
- Use one coherent outline icon family.
- Recommended candidate: Lucide.
- Keep default icon size around 18–20px for controls, 20–24px for navigation.
- Do not combine filled, outlined and emoji icons arbitrarily.
- Use labels for unfamiliar icons.

## 10. Visual density rule

When deciding whether to add a panel, metric or toolbar:
1. Does it support the current screen's one goal?
2. Is it needed continuously?
3. Could it be a compact inline element?
4. Could it be a collapsible panel?
5. Could it live on a dedicated settings/detail page?

Default to the least distracting option that preserves discoverability.
