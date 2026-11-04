# 14 — Decision Register

## Confirmed product-design decisions recovered from the Project Review Feedback discussion

| ID | Decision | Status |
|---|---|---|
| D-01 | Product/task receives maximum screen priority | CONFIRMED |
| D-02 | One screen has one meaning, one goal and one dominant action | CONFIRMED |
| D-03 | Product has Public, Personal and Creator spaces | CONFIRMED |
| D-04 | Supporting content remains identifiable but compact/collapsible | CONFIRMED |
| D-05 | Hover/focus/tap can reveal labels or supporting details | CONFIRMED |
| D-06 | Each screen must be individually responsive | CONFIRMED |
| D-07 | Effects, motion and animations must be specified | CONFIRMED |
| D-08 | Light, dark and system-adaptive themes | CONFIRMED |
| D-09 | Accessibility is a design requirement | CONFIRMED |
| D-10 | Preserve all previously accepted suggestions | CONFIRMED |

## Proposed design baseline in this pack

| ID | Proposal | Status |
|---|---|---|
| P-01 | Public/Personal/Creator use a consistent shared navigation shell | PROPOSED |
| P-02 | Personal Home is the user's project workspace | PROPOSED |
| P-03 | New Project → Setup → AI Review → Feedback Report journey | PROPOSED |
| P-04 | Public Explore and Public Project Detail routes | CONDITIONAL |
| P-05 | Creator Home, Workspace and Profile routes | CONDITIONAL |
| P-06 | Shared page-level button catalog | PROPOSED |
| P-07 | Motion timings and interaction tokens | PROPOSED |
| P-08 | shadcn/ui + Radix + Tailwind + Lucide + Motion candidate implementation set | PROPOSED |
| P-09 | WCAG 2.2 AA as target baseline | PROPOSED |
| P-10 | Suggested page route names in document 03 | PROPOSED |
| P-11 | Suggested visual design tokens in document 10 | PROPOSED |

## Open decisions requiring source product requirements

- Exact product name, target audience and promise.
- Exact finalized page list.
- Exact meaning/permissions of Public, Personal, Creator.
- Whether Public includes discovery, comments, follows, reactions or sharing.
- Whether Personal includes projects, drafts, saved reports, version history or archiving.
- What Creator actually means and whether it includes an editor, profile or publishing.
- Exact AI inputs and accepted file/URL types.
- Exact review stages, feedback rubric, report structure and trust indicators.
- Whether users can regenerate, compare or export reviews.
- Whether users can mark feedback addressed or ask follow-up questions.
- Exact onboarding steps, auth methods, privacy settings and support options.
- Existing implementation stack and technical constraints.

## Change log template

| Date | Decision ID | Old value | New value | Reason | Approved by |
|---|---|---|---|---|---|
| YYYY-MM-DD | D-XX/P-XX | — | — | — | — |

## Governance rule

A proposal becomes confirmed only after an explicit product decision. A capability is removed from the UI when it is not supported; it is not left as a disabled fake feature just because it appears in this document.
