# 03 — Proposed Route Map and Page Index

> All routes are PROPOSED BASELINE routes. Rename or remove them to match the approved sitemap. A route must not be implemented merely because it appears here.

## Route map

| Space | Route | Page ID | Page name | Dominant action |
|---|---|---|---|---|
| Public / visitor | `/` | PUB-00 | Product landing | Start / enter product |
| Account | `/sign-in` | ACC-01 | Sign in | Sign in |
| Account | `/sign-up` | ACC-02 | Create account | Create account |
| Account | `/onboarding` | ACC-03 | First-time setup | Finish setup |
| Public | `/public` | PUB-01 | Explore | Open a public project |
| Public | `/public/projects/:projectId` | PUB-02 | Public project detail | Primary project action (OPEN) |
| Public | `/public/creators/:creatorId` | PUB-03 | Public creator profile (CONDITIONAL) | Open creator item |
| Personal | `/personal` | PER-01 | Personal home | Open or create a project |
| Personal | `/personal/projects/new` | PER-02 | New project | Continue to project setup |
| Personal | `/personal/projects/:projectId/setup` | PER-03 | Project setup/context | Start review or save draft |
| Personal | `/personal/projects/:projectId/review` | PER-04 | Review processing/status | Return to project/report |
| Personal | `/personal/projects/:projectId/feedback` | PER-05 | AI feedback report | Select next improvement |
| Personal | `/personal/projects/:projectId/feedback/:findingId` | PER-06 | Finding detail (CONDITIONAL) | Mark/revisit finding |
| Personal | `/personal/projects/:projectId/history` | PER-07 | Project/review history (CONDITIONAL) | Open a version |
| Creator | `/creator` | CRE-01 | Creator home | Open or create creator work |
| Creator | `/creator/workspaces/:itemId` | CRE-02 | Creator workspace/editor (CONDITIONAL) | Save creator work |
| Creator | `/creator/profile` | CRE-03 | Creator profile/presentation (CONDITIONAL) | Save profile |
| Global | `/settings` | SET-01 | Settings | Save/apply preference |

## Page purpose index

### Public
- PUB-00: Explain the product clearly and invite the visitor into the product.
- PUB-01: Discover public projects or public items, if public discovery is a product feature.
- PUB-02: Understand one public project without dashboard clutter.
- PUB-03: View a creator's public presentation only if creator profiles exist.

### Account
- ACC-01: Authenticate an existing user.
- ACC-02: Create an account.
- ACC-03: Collect only the minimum first-run preferences needed to make the product usable.

### Personal
- PER-01: Resume personal work or start one project.
- PER-02: Establish a new project record.
- PER-03: Supply project information and configure the review request.
- PER-04: Show truthful AI review status and recovery actions.
- PER-05: Present the resulting feedback as the main work surface.
- PER-06: Explain one feedback finding in depth, if findings have separate detail.
- PER-07: Show history/version changes only if they exist.

### Creator
- CRE-01: Entry point to the Creator space.
- CRE-02: Focused creation/editor environment, if that capability is confirmed.
- CRE-03: Profile/presentation management, if public creator profiles are confirmed.

### Global
- SET-01: Change preferences without polluting task-specific pages.

## Navigation rules
- Browser Back should preserve the prior list position, filters and scroll where feasible.
- Opening a report should not destroy the source project state.
- A modal/sheet deep link should be dismissible and return to its parent page.
- Do not make space switching a visibility toggle.
- Avoid duplicate routes for the same semantic object.
