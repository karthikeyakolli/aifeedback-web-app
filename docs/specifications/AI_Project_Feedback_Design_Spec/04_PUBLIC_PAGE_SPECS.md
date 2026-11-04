# 04 — Public and Visitor Page Specifications

All pages below are PROPOSED BASELINE. Public discovery, sharing and creator profiles are CONDITIONAL on the approved product scope.

---

## PUB-00 — Visitor landing page (`/`)

**Meaning:** What the product is and how to enter it.  
**Goal:** Help a first-time visitor understand the value and take the first step.  
**Dominant action:** `Get started` / `Create account` (choose one primary label).  
**Do not:** Turn the landing page into a full application dashboard.

### Desktop layout
1. Top navigation: product wordmark left; `How it works`, `Examples` (only if real), `Sign in`; primary `Get started` right.
2. Hero: clear product statement, one concise supporting sentence, one dominant CTA.
3. Product preview: a real or carefully labeled sample of a project-feedback report. Do not show fabricated performance claims.
4. How it works: 3-step explanation, not a wall of feature cards.
5. Trust/limitations section: explain what AI feedback can and cannot do.
6. Footer: legal/privacy/help links when available.

### Visual hierarchy
- Hero statement: largest type on the page.
- CTA: strongest button.
- Product preview: second strongest element.
- Supporting sections: neutral, consistent spacing.

### Button and link inventory
| ID | Label | Type | Action | Result |
|---|---|---|---|---|
| PUB00-B01 | Get started | Primary | Navigate to sign-up or the authenticated app | Begin entry flow |
| PUB00-B02 | Sign in | Secondary | Navigate to `/sign-in` | Existing user enters |
| PUB00-B03 | How it works | Text link | Scroll to explanation section | Reveal process |
| PUB00-B04 | View example | Secondary / conditional | Open a clearly labeled sample report | Understand report format |
| PUB00-B05 | Privacy | Footer link | Open privacy policy | Read data handling |
| PUB00-B06 | Terms | Footer link | Open terms | Read product terms |

### States
- Default landing.
- CTA loading only if account routing requires an async check.
- Signed-in visitor: replace `Get started` with `Open app`.
- Missing sample data: remove `View example`; never render placeholder metrics as real outcomes.

### Responsive
- Tablet: nav links collapse into a menu; keep primary CTA visible.
- Mobile: compact top bar, hero text first, preview below CTA, sections stack vertically.
- Do not autoplay a large video; use a static preview with explicit play action if video exists.

### Motion
- Hero: opacity + 8px upward reveal, 220ms, once.
- Product preview: subtle 120ms hover elevation on pointer devices.
- CTA hover: color shift and 1px upward movement, 140ms.
- No scroll-jacking, no parallax that harms reading, no animated background behind text.

---

## PUB-01 — Public Explore (`/public`)

**Meaning:** Discover content that is already public.  
**Goal:** Find one relevant public project/item.  
**Dominant action:** Open a result.  
**Status:** CONDITIONAL on public discovery being a product feature.

### Desktop layout
- Header row: `Explore` title, small explanatory description, optional search field.
- Filter strip: category/status/time filters only if those dimensions exist.
- Main area: content cards in a 2–3 column grid or a dense list based on the actual content type.
- Optional featured section must not displace search/results.
- Keep sort and filters compact; place advanced options in a popover.

### Project card anatomy
- Project title.
- One-sentence summary.
- Owner/creator label if public and appropriate.
- Approved category/status metadata.
- One obvious card click target.
- Overflow menu only for actions available to the signed-in user.

### Button/control inventory
| ID | Label | Action | Result |
|---|---|---|---|
| PUB01-B01 | Search | Submit query / update results | Matching public items |
| PUB01-B02 | Filters | Open filter popover/sheet | Show available filters |
| PUB01-B03 | Sort: Recent | Open sort menu | Change ordering |
| PUB01-B04 | Clear filters | Reset search filters | Restore unfiltered list |
| PUB01-B05 | Retry | Retry failed request | Reload results |
| PUB01-C01 | Project card | Open selected project | Navigate to PUB-02 |
| PUB01-C02 | Load more | Fetch next page | Append more results; only if pagination exists |

### Hover/focus
- Card: border contrast rises, shadow/elevation changes subtly, arrow/icon appears only if it does not create layout shift.
- Do not scale card significantly.
- Keyboard focus draws a visible outline around the whole card.
- On touch, the entire card has a clear pressed state; do not require hover to reveal the title.

### States
- Loading skeleton matching final card geometry.
- Empty: explain that no public items are available; do not expose private project examples.
- No results: show the query and `Clear filters`.
- Error: plain-language explanation + `Retry`.
- Populated list.

### Responsive
- Desktop 3 columns only when card content remains readable.
- Tablet 2 columns.
- Mobile 1 column; filters open as a bottom sheet; search stays visible.
- If a list is more useful than a grid, use list view at all breakpoints.

---

## PUB-02 — Public project detail (`/public/projects/:projectId`)

**Meaning:** Understand one public project.  
**Goal:** Inspect its content and any approved public feedback.  
**Dominant action:** OPEN — depends on whether the product supports saving, reacting, discussing or starting a review.

### Desktop layout
- Breadcrumb / Back to Explore.
- Main column: title, project summary, project content and any approved public feedback.
- Right contextual column: owner, approved metadata, public state and secondary actions.
- Keep the actual project content wider than the metadata panel.
- Collapse long metadata under `Project details`.

### Button inventory
| ID | Label | Status | Action / result |
|---|---|---|---|
| PUB02-B01 | Back to Explore | Proposed | Return to previous Explore state |
| PUB02-B02 | Share | Conditional | Open native share or copy/share dialog |
| PUB02-B03 | Copy link | Conditional | Copy canonical public URL; announce success |
| PUB02-B04 | Save project | Conditional | Save to user's Personal collection, if that concept exists |
| PUB02-B05 | Report | Conditional | Open report dialog only if moderation exists |
| PUB02-B06 | Project details | Proposed | Expand/collapse secondary metadata |
| PUB02-B07 | Primary project action | OPEN | Define only after public interaction semantics are confirmed |

### Safety and privacy
- Render only fields approved for public display.
- Do not expose private review notes, uploaded source files or personal contact details.
- The page must visibly say `Public` or equivalent.
- Share must share the public URL, never a private workspace URL.

### Responsive
- Mobile: one column; details become disclosure panels; overflow actions in a menu.
- Keep the main project content above secondary metadata.
- If a bottom action bar is needed, ensure it does not cover content or keyboard.

---

## PUB-03 — Public creator profile (`/public/creators/:creatorId`)

**Meaning:** View a creator's public presentation.  
**Goal:** Open one public project/item from that creator.  
**Status:** CONDITIONAL; do not build unless creator profiles are confirmed.

### Layout
- Compact profile header: avatar/identity, display name and approved bio.
- Main content: creator's public items/projects.
- Optional links/social links only with explicit permission and validation.
- Avoid vanity statistics unless the product actually collects and displays them.

### Buttons
| ID | Label | Action |
|---|---|---|
| PUB03-B01 | Back | Return to prior public page |
| PUB03-B02 | Share profile | Copy/share public profile URL, if supported |
| PUB03-C01 | Public item card | Open the selected public item |
| PUB03-B03 | Follow | CONDITIONAL; only if following exists |

### Motion and responsive
- Profile header elements appear without dramatic entrance animation.
- Cards use the same interaction as PUB-01.
- Mobile profile identity stacks above content; no cramped two-column header.
