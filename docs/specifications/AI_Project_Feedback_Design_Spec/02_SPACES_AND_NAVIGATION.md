# 02 — Spaces and Navigation

> The existence of Public, Personal and Creator is CONFIRMED. The descriptions and page models below are proposed interpretations pending confirmation of exact permissions and features.

## 1. Public space

**Proposed meaning:** A place to discover and inspect content that its owner has intentionally made public.

### Layout
- Space header and short explanation.
- Search/discovery control only if public content can be searched.
- Main content list/grid.
- Compact filter/sort row when the content volume justifies it.
- Optional featured content, not a mandatory marketing carousel.
- Empty and no-results states that explain what can be done next.

### Visibility indicator
Every public item should have a visible "Public" state on its detail view. Avoid implying that a user's entire account or all projects are public.

### Candidate destinations
- Public Explore.
- Public Project Detail.
- Creator/Public Profile, only if public profiles exist.

## 2. Personal space

**Proposed meaning:** A private, user-owned environment for projects and feedback history.

### Layout
- Personal header.
- Primary project list/recent work area.
- One clear create/resume action.
- Search and filters close to the list, not in a large dashboard panel.
- Draft, in-progress and completed states where these statuses exist.
- Account-level settings outside the main project work surface.

### Privacy rule
Personal content is private by default as a design recommendation. The exact access policy must be confirmed. The interface must never silently publish personal content.

### Candidate destinations
- Personal Home.
- New Project.
- Project Setup/Context.
- Review Processing.
- Feedback Report.
- Feedback Finding Detail.
- Project History/Versions.
- Settings.

## 3. Creator space

**Proposed meaning:** A distinct context for a user acting as a creator. Its exact purpose is OPEN.

Potential interpretations—do not implement all at once:
- managing a public creator profile;
- preparing content/projects for public presentation;
- maintaining a portfolio;
- producing creator-oriented resources or templates.

### Proposed layout principles
- Keep creator work separate from personal project records.
- Put the creator's main work canvas first.
- Put profile, presentation and publication controls in a secondary panel.
- Show publication state before any publish/unpublish action.
- Do not assume that Creator is simply a role badge or that entering it makes work public.

### Candidate destinations
- Creator Home.
- Creator Workspace/Editor.
- Creator Profile/Presentation.
- Preview/Publish Review, only if publication is confirmed.

## 4. Global application shell

### Desktop
- Left navigation: 224–256 px expanded; 64–76 px collapsed.
- Main content: flexible, with a readable max width when it is text-heavy.
- Contextual right panel: 280–340 px only on pages that benefit from it.
- Header: current page title, breadcrumb where useful, contextual actions.
- Account controls remain stable and separate from space navigation.

### Sidebar behavior
- Expanded sidebar uses icon + text.
- Collapsed sidebar uses icons and reveals text on hover/focus.
- Current space is shown as a section identity, not only by a subtle color.
- Current page receives a clear active state.
- Tooltips appear after a short hover delay and immediately on keyboard focus.
- On touch screens, the sidebar opens as a drawer with visible text labels.

### Space switcher
Candidate labels: `Public`, `Personal`, `Creator`.
- Current space is visibly selected.
- Switching opens the destination space; it does not change content visibility.
- If the user has unsaved work, preserve it or present a clear leave-page guard.
- On mobile, show the current space label in the top bar and put switching in an accessible menu/sheet.

## 5. Navigation hierarchy proposal

Do not show every nested route at once. Use a small number of top-level items:

- Public: Explore (and optional Profiles).
- Personal: My Projects (plus optional Recent).
- Creator: Studio (and optional Profile).
- Global: Settings, Help, Account.

The words in this list are proposals. If the finalized product vocabulary differs, preserve the structure but use approved terminology.
