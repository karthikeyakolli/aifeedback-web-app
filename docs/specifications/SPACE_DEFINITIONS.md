# Space Definitions: Public, Personal, Creator

> **Document Type**: Phase 0 Core Deliverable  
> **Status**: `CONFIRMED SPECIFICATION`  
> **Version**: 1.0.0  
> **Date**: November 2, 2026  
> **Audience**: Product Management, Engineering, Security Architecture, QA  

---

## 1. Architectural Philosophy of the Three Spaces

The product is fundamentally structured around three confirmed spaces:
1. **`PUBLIC`**
2. **`PERSONAL`**
3. **`CREATOR`**

### Inviolable Boundary Rules:
- **Rule 1 (Privacy Invariant)**: Space switching changes view context only. Switching to Public or Creator space **NEVER** silently alters the publication status or privacy permissions of personal projects.
- **Rule 2 (Consent Invariant)**: Publishing any project or feedback report from Personal to Public or Creator requires an explicit, intentional user action accompanied by a confirmation dialog with full consequence disclosure.
- **Rule 3 (Role Separation)**: Every user account has an active Personal space. Access to Creator or Moderator tools is contextual or granted based on explicit user state, not an unvetted cosmetic badge.

---

## 2. Dedicated Space Specifications

### A. The Public Space

#### 1. Actual Purpose
A discovery and scrutiny hub where visitors and community members inspect products that have been intentionally published by their makers, read verified project summaries, evaluate public AI reviews, and contribute community feedback.

#### 2. Intended Users
- Unauthenticated visitors exploring new tools.
- Registered community reviewers and developers.
- Product creators gathering public feedback.

#### 3. Available Information
- Public project name, summary, category, and screenshots.
- Verified repository and demo URLs (if supplied).
- Creator public username and profile.
- Community reviews, comments, and upvotes.
- *Strictly Excluded*: Private drafts, unreleased architecture documents, raw API keys, private AI findings.

#### 4. Project Visibility Rules
- A project is visible in Public space **if and only if** its `is_public` flag is set to `true` by the project owner.

#### 5. Permitted Actions
- Search, filter, and sort public projects.
- Read project details and public feedback reports.
- Upvote projects (authenticated users; server-enforced rate limiting).
- Submit public reviews or feedback comments (authenticated users).
- Bookmark/save public projects to personal collection.

#### 6. Access Restrictions
- Unauthenticated users have read-only access.
- Non-owners cannot edit or archive public projects.

#### 7. Relationship to Personal & Creator
- Public projects originate from Personal space via explicit publication.
- Public project pages link back to the maker's public Creator profile (if public profile exists).

---

### B. The Personal Space

#### 1. Actual Purpose
A private, encrypted, user-owned workbench for organizing software project context, validating review readiness, executing deep AI evaluations, inspecting structural findings, and methodically tracking code and UX improvements.

#### 2. Intended Users
- The individual developer, solo founder, or project owner.

#### 3. Available Information
- All projects owned by the authenticated user (Draft, In Review, Reviewed, Archived).
- Complete project context: repository links, internal documentation, architecture specs, draft notes.
- Full AI Feedback Reports, complete finding details, evidence quotes, and severity tags.
- Historical review runs, version comparisons, and improvement backlogs.

#### 4. Project Visibility Rules
- **100% Private by Default**: Row-Level Security (RLS) ensures only the project owner (or assigned collaborators if approved) can query or read these records.
- Invisible to search engines and public explore feeds.

#### 5. Permitted Actions
- Create, rename, edit, archive, and delete personal projects.
- Input and edit project descriptions, target audience, and repository links.
- Upload supporting documentation (PDF, TXT, Markdown).
- Validate Review Readiness Checklist and trigger "Start AI review".
- Inspect findings in the Contextual Right Inspector.
- Update finding resolution status (`Open`, `In Progress`, `Addressed`).
- Explicitly initiate "Publish to Public Space" (opens confirmation modal).

#### 6. Access Restrictions
- Strictly requires authenticated session (`JWT`).
- No public URL routes access personal projects directly.

#### 7. Relationship to Public & Creator
- Acts as the incubator. Projects are refined, reviewed, and improved here before being published to Public or assembled into a Creator showcase.

---

### C. The Creator Space

#### 1. Actual Purpose
A specialized maker environment for preparing public presentations, managing portfolio showcases, and running developer diagnostics in the **AI Review Lab**.

> **Audit Status on Creator Space**:
> - *Confirmed Core*: The existence of the Creator space as a distinct top-level context is CONFIRMED.
> - *Confirmed Sub-capabilities*: The AI Review Testing Lab (`/developer` / `/creator/lab`) is fully functional in the codebase.
> - *Proposed Capabilities*: Public creator portfolio showcase and template generation are PROPOSED BASELINE.
> - *Open Decisions*: Creator monetization and paid review tiering are marked `OPEN`.

#### 2. Intended Users
- Product creators and makers preparing showcase launches.
- Developers auditing prompt variations and AI model evaluations.

#### 3. Available Information
- Creator's published showcases and portfolio items.
- AI Lab execution metrics (Run ID, latency, model selection, prompt evaluation matrix).
- Public profile information (bio, technical stack, verified maker handles).

#### 4. Visibility & Permission Requirements
- Creator Studio is private to the creator.
- Published Showcase items are visible publicly under `/public/creators/:id`.
- AI Lab diagnostic tooling is restricted to developer/creator accounts.

#### 5. Permitted Actions
- Assemble public showcases from reviewed personal projects.
- Edit public creator profile and maker bio.
- Execute synthetic reviews and benchmark models in the AI Testing Lab.
- Track showcase views and community feedback engagement.

---

## 3. Comprehensive Space Comparison Matrix

| Dimension | Public Space (`PUB`) | Personal Space (`PER`) | Creator Space (`CRE`) |
|---|---|---|---|
| **Primary Meaning** | Open Community Discovery & Review | Private Engineering & Feedback Workbench | Showcase Studio & AI Testing Lab |
| **Dominant Goal** | Discover & Scrutinize Public Work | Improve Project Quality via AI Feedback | Present Creator Work & Evaluate AI |
| **Target Audience** | Visitors, Community Reviewers, Makers | Solo Developers, Technical Founders | Verified Makers, Architects, Evaluators |
| **Default Data Privacy** | 100% Public (Global Read) | 100% Private (Owner-Only RLS) | Mixed: Studio (Private), Showcase (Public) |
| **Authentication Req.** | Optional for Read; Req. for Interaction | Mandatory for All Actions | Mandatory for All Actions |
| **Dominant CTA** | `Get Started` / `Explore Projects` | `New Project` / `Start AI Review` | `New Showcase` / `Open Lab` |
| **Primary Work Surface** | Filterable Grid of Project Cards | Project Workspace & Finding Inspector | Studio Editor & AI Benchmark Matrix |
| **AI Capabilities** | Read-Only Public Summary | Full Multi-Angle Review & Deep Findings | Prompt Tuning & AI Model Benchmarking |
| **Destructive Actions** | None (Public cannot delete projects) | Archive / Delete Project (Protected) | Unpublish Showcase / Delete Run Logs |
| **Space Switch Consequence** | View context changes only | View context changes only | View context changes only |

---

## 4. Unresolved / Open Items

1. **`OPEN-SPC-01`**: Does the Creator space have distinct team or monetization capabilities, or is it strictly an individual portfolio showcase?  
   *Current Status*: Restricted to individual showcase + AI lab. Monetization postponed to Post-MVP.
2. **`OPEN-SPC-02`**: Can an unauthenticated user request an AI review without creating a Personal account?  
   *Current Status*: **No**. Authentication is mandatory for generating and saving AI reviews to prevent server abuse and ensure data ownership.
