# 06 — Creator Space Page Specifications

> Creator is CONFIRMED as a distinct space. Its exact meaning is OPEN. The page definitions below are safe design proposals only; implement the relevant branch only after confirming what Creator means in this product.

## CRE-01 — Creator Home (`/creator`)

**Meaning:** Entry point to the creator-specific environment.  
**Goal:** Continue creator work or start one supported creator activity.  
**Dominant action:** `Create` / `Continue`—choose one based on the user's state.

### Layout
- Creator identity/space heading.
- Main work area: existing creator items or a single useful start action.
- Draft and published groups only if those statuses exist.
- Secondary profile/setup controls compact and discoverable.
- No vanity analytics by default.

### Button inventory
| ID | Label | Status | Action |
|---|---|---|---|
| CRE01-B01 | Create | CONDITIONAL | Start the approved creator workflow |
| CRE01-B02 | Continue editing | CONDITIONAL | Open selected creator item |
| CRE01-B03 | View public profile | CONDITIONAL | Open public profile |
| CRE01-B04 | Edit profile | CONDITIONAL | Open CRE-03 |
| CRE01-B05 | Filter | Proposed | Filter actual creator item states |
| CRE01-B06 | Sort | Proposed | Change order |
| CRE01-C01 | Creator item card | CONDITIONAL | Open CRE-02 |

### Empty state
Explain what Creator space is for using approved product language. One CTA only. Do not imply publishing or monetization if not supported.

---

## CRE-02 — Creator Workspace / Editor (`/creator/workspaces/:itemId`)

**Meaning:** Work on one creator-owned item.  
**Goal:** Save the creator's work.  
**Dominant action:** `Save` or `Continue` depending on actual editor behavior.  
**Status:** CONDITIONAL; this page assumes an editor exists.

### Layout
- Top bar: back, item title, save state and preview.
- Main canvas/content editor takes at least 65% of usable width on desktop.
- Left tool rail only for frequent tools; collapsed labels reveal on hover/focus.
- Right inspector panel for selected-item settings; collapsible.
- Do not show every property at once.
- Keep destructive and publish actions out of the primary editing toolbar.

### Candidate buttons
| ID | Label | Type | Action |
|---|---|---|---|
| CRE02-B01 | Back to Creator | Tertiary | Return to CRE-01 |
| CRE02-B02 | Save | Primary if manual save; otherwise status only | Persist editor state |
| CRE02-B03 | Undo | Icon | Revert last edit if supported |
| CRE02-B04 | Redo | Icon | Reapply reverted edit if supported |
| CRE02-B05 | Preview | Secondary | Open read-only preview |
| CRE02-B06 | Settings | Tertiary | Open contextual inspector |
| CRE02-B07 | Publish | CONDITIONAL | Open publication review, never publish silently |
| CRE02-B08 | More | Icon | Open secondary actions |

### Editor interaction
- Selected object/item gets a clear selection border.
- Inspector updates to the current selection.
- Drag operations must have keyboard alternatives where feasible.
- Autosave status must distinguish `Saving…`, `Saved` and `Couldn't save`.
- A failed save must preserve local edits and offer retry.

### Responsive
- Tablet: left tools collapse; inspector becomes drawer.
- Mobile: no tiny desktop-like canvas by default. Use a mobile editing mode or a full-screen focused editor. If full editing is not practical on mobile, provide a clear view/review experience rather than pretending the desktop editor is usable.

---

## CRE-03 — Creator Profile / Presentation (`/creator/profile`)

**Meaning:** Manage the creator's public-facing identity.  
**Goal:** Save approved profile changes.  
**Status:** CONDITIONAL on public creator profiles.

### Layout
- Main form: display name, bio, avatar, selected public links—only approved fields.
- Preview panel on desktop.
- Visibility explanation before public-facing fields.
- Do not expose email, private projects or personal account details.

### Button inventory
| ID | Label | Action |
|---|---|---|
| CRE03-B01 | Save profile | Validate and persist profile |
| CRE03-B02 | Preview profile | Open preview mode |
| CRE03-B03 | Change image | Open file picker, if avatar upload exists |
| CRE03-B04 | Remove image | Remove selected image after clear confirmation |
| CRE03-B05 | Cancel | Return without applying unsaved edits |
| CRE03-B06 | View public profile | Open public version if published |

## Publication flow — CONDITIONAL

If Creator supports publishing:
1. User selects `Publish`.
2. A review screen shows exactly what becomes public.
3. The visibility/access explanation is readable.
4. User confirms with `Publish publicly`.
5. The system reports the actual result.
6. The public item becomes accessible only after backend confirmation.

Never use a generic `Done` button for an action that changes visibility.
