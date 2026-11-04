# 00 — Scope, Evidence and Assumptions

## Product scope

This specification is for the **AI Project Feedback** product: a product in which project-related work and AI-assisted feedback/review are central to the user experience. The exact project inputs, AI evaluation rubric, report structure and supported collaboration features must be confirmed from the product requirements.

Do not import unrelated product assumptions, screens, branding or technologies.

## Evidence labels

Use these labels in the product backlog, Figma file, code comments and implementation reports.

| Label | Meaning | Implementation rule |
|---|---|---|
| `CONFIRMED` | Explicitly present in the recovered product discussion | Preserve unless the user changes it |
| `PROPOSED BASELINE` | A recommended page, flow, layout or control introduced to make the design actionable | Use as a draft; obtain product approval before treating as final |
| `CONDITIONAL` | Only applies if the product supports the capability | Hide/remove it when unsupported; never fake functionality |
| `OPEN` | Product semantics are not known | Do not implement irreversible behavior until resolved |

## Confirmed product-design decisions

- Three spaces: Public, Personal, Creator.
- One screen = one meaning, one goal, one dominant action.
- The main product activity takes visual priority.
- Secondary features remain discoverable but compact/collapsible.
- Desktop hover, keyboard focus and touch tap receive equivalent disclosure behavior.
- Each page needs its own responsive plan.
- Motion and effects are explicitly specified.
- Light, dark and system theme support.
- Accessibility is designed in from the beginning.
- Previously accepted suggestions remain in scope.

## Proposed baseline user model

The pages in this package assume a common high-level journey:

1. A visitor understands what the product does.
2. A user signs in or creates an account.
3. The user enters Personal space.
4. The user creates or opens a project.
5. The user supplies whatever project context the product requires.
6. The product performs an AI-assisted review, if this is the approved core capability.
7. The user reads the feedback and can revisit the project.
8. Public or Creator experiences are used only when the user explicitly chooses them and the relevant capabilities are approved.

This is a **designing assumption**, not a claim that all these steps were finalized in the original discussion.

## Open product facts that must not be guessed

- Exact product name, promise and target audience.
- Exact sitemap from the original discussion.
- What a "project" consists of: text, repository URL, documents, images, video, code, links or a combination.
- Which project categories or domains are supported.
- What the AI evaluates and how it explains findings.
- Whether reports contain scores, grades, confidence values, risk flags or only written feedback.
- Whether feedback is generated once, regenerated, versioned or compared over time.
- Whether the product supports comments, mentors, teams, collaboration or public reactions.
- Whether Creator is a role, a distinct workspace, a publishing tool or another concept.
- Whether users can publish projects or feedback publicly.
- Whether Creator content can be monetized.
- Whether the product has plans, credits, usage limits or billing.
- Whether AI processing is synchronous or asynchronous.
- Actual framework, database, API, authentication and storage choices.

## Product integrity rules

- Never display a made-up AI score, progress percentage or review status.
- Never suggest that AI feedback is guaranteed correct.
- Clearly separate AI-generated observations from user-provided facts.
- Show the source/context behind a finding wherever the system has that information.
- Do not expose a Personal project just because the user visits Public or Creator space.
- Changing spaces must not change publication or access permissions.
- A visibility/publication change must be an explicit action with a clear consequence.
- Do not make unsupported menu items clickable. Remove them or label them as unavailable only when there is a valid product reason.

## Scope of this design specification

The detailed page names, routes and labels in documents 03–08 are **proposed implementation vocabulary**. They are intended to be concrete enough for wireframes and agent execution, while remaining easy to revise once the original feature list is available.
