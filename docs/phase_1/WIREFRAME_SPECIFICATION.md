# Wireframe Specification: Low-Fidelity Layouts

> **Document Type**: Phase 1 Core Deliverable  
> **Status**: `CONFIRMED / APPROVED FOR DESIGN`  
> **Version**: 1.0.0  
> **Date**: November 2, 2026  
> **Audience**: Product Designers, Frontend Engineers, QA Leads  

---

## 1. Wireframing Principles

1. **Anti-Clutter Mandate**: No arbitrary metric cards, decorative charts, or empty visual padding.
2. **Spatial Prioritization**: The primary task canvas occupies >= 70% of available viewport width on desktop.
3. **Disclosure Parity**: Information disclosed via hover on desktop is fully accessible via keyboard focus and tap on touch screens.
4. **Ergonomic Thumb Zones**: Mobile controls and dominant actions are pinned within bottom thumb reach.

---

## 2. MVP Screen Wireframes

---

### Screen 1 & 2: Authentication (`ACC-01` Sign In & `ACC-02` Sign Up)

#### Desktop Layout (1440px)
```
+-----------------------------------------------------------------------------------------+
| [Brand Logo: FeedbackAI]                                                   [Theme ☀/🌙]  |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|                               +-----------------------------------+                     |
|                               |       [ Brand Icon 48x48 ]        |                     |
|                               |                                   |                     |
|                               |           Welcome Back            |                     |
|                               |  Sign in to review your projects  |                     |
|                               |                                   |                     |
|                               | Email Address                     |                     |
|                               | [ name@company.com              ] |                     |
|                               |                                   |                     |
|                               | Password                          |                     |
|                               | [ ••••••••••••••                ] |                     |
|                               |                                   |                     |
|                               | [======== Sign In (CTA) ========] |                     |
|                               |                                   |                     |
|                               | [ Sign in as Demo Creator       ] |                     |
|                               |                                   |                     |
|                               | Don't have an account? Sign Up    |                     |
|                               +-----------------------------------+                     |
|                                                                                         |
+-----------------------------------------------------------------------------------------+
```

#### Mobile Layout (390px)
```
+---------------------------------------+
| [Brand Logo]             [Theme ☀/🌙]  |
+---------------------------------------+
|                                       |
|  Welcome Back                         |
|  Sign in to review your projects      |
|                                       |
|  Email Address                        |
|  [ name@company.com                 ] |
|                                       |
|  Password                             |
|  [ ••••••••••••••                   ] |
|                                       |
|  [======= Sign In (44px CTA) =======] |
|                                       |
|  [ Sign in as Demo Creator          ] |
|                                       |
|  Don't have an account? Sign Up       |
|                                       |
+---------------------------------------+
```

---

### Screen 3: Personal Home / My Projects (`PER-01`)

#### Desktop Layout (1440px)
```
+-----------------------------------------------------------------------------------------+
| Header: Personal > My Projects               [ Search ⌘K ]          [Theme] [Bell] [User] |
+------------------+----------------------------------------------------------------------+
| Sidebar (250px)  |  My Projects (PER-01)                           [ + New Project (CTA) ]|
|                  |  Manage your private projects and AI feedback reports.               |
| Space Switcher:  |  ------------------------------------------------------------------- |
| [Pub|Per*|Cre]   |  [ Search projects...       ]  [ Status: All ▾ ]  [ Category: All ▾ ]|
|                  |                                                                      |
| [+ New Project]  |  +-----------------------------------------------------------------+ |
|                  |  | Project Name       | Category    | Status      | Updated | ... | |
| Nav:             |  |--------------------+-------------+-------------+---------+-----| |
| • My Projects    |  | ReflectFlow        | Dev Tools   | [Reviewed]  | 2h ago  | [:] | |
| • Activity       |  | QueryLite          | Database    | [In Review] | 1d ago  | [:] | |
| • Saved          |  | AuthGuardian       | Security    | [Draft]     | 3d ago  | [:] | |
|                  |  +-----------------------------------------------------------------+ |
| Theme & Settings |  Showing 3 of 3 projects                                             |
+------------------+----------------------------------------------------------------------+
```

#### Tablet Layout (768px)
```
+-----------------------------------------------------------------------+
| [☰] Header: Personal > Projects              [Search ⌘K]  [Theme] [User]|
+-----------------------------------------------------------------------+
| My Projects                                   [ + New Project (CTA) ] |
| [ Search projects...                       ]  [ Filter Status ▾ ]     |
|                                                                       |
| +-------------------------------------------------------------------+ |
| | ReflectFlow  •  Dev Tools                     [Reviewed]    [:]   | |
| | Offline-first sync with CRDTs. 4 findings open. Updated 2h ago    | |
| +-------------------------------------------------------------------+ |
| | QueryLite  •  Database                        [In Review]   [:]   | |
| | Embedded visual inspector. Analyzing architecture. Updated 1d ago | |
| +-------------------------------------------------------------------+ |
+-----------------------------------------------------------------------+
```

#### Mobile Layout (390px)
```
+---------------------------------------+
| [☰] Personal > Projects  [🔍] [Theme] |
+---------------------------------------+
| My Projects                           |
| [ Search projects...                ] |
|                                       |
| +-----------------------------------+ |
| | ReflectFlow               [:]     | |
| | Dev Tools • [Reviewed]            | |
| | 4 findings. Updated 2h ago        | |
| +-----------------------------------+ |
| | QueryLite                 [:]     | |
| | Database • [In Review]            | |
| | Review in progress...             | |
| +-----------------------------------+ |
|                                       |
+---------------------------------------+
| [Home]  [Explore]  ( + New )  [Saved] |
+---------------------------------------+
```

---

### Screen 4: New Project Wizard (`PER-02`)

#### Desktop Layout (1440px)
```
+-----------------------------------------------------------------------------------------+
| Header: Personal > Projects > New Project                                               |
+------------------+----------------------------------------------------------------------+
| Sidebar (250px)  |  Create New Project                                                  |
|                  |  Establish your project record to prepare for AI evaluation.         |
| Space: Personal  |  ------------------------------------------------------------------  |
|                  |  +----------------------------------------------------------------+  |
|                  |  | Project Name *                                                 |  |
|                  |  | [ e.g. ReflectFlow                                           ] |  |
|                  |  |                                                                |  |
|                  |  | Tagline / Short Summary *                                      |  |
|                  |  | [ Distributed offline-first workspace with CRDT sync          ] |  |
|                  |  | Minimum 15 characters (48 / 200)                               |  |
|                  |  |                                                                |  |
|                  |  | Primary Category *                                             |  |
|                  |  | [ Developer Tools                                            ▾ ] |  |
|                  |  |                                                                |  |
|                  |  | [ Cancel ]                         [ Continue to Setup (CTA) ] |  |
|                  |  +----------------------------------------------------------------+  |
+------------------+----------------------------------------------------------------------+
```

---

### Screen 5 & 6: Project Setup & Review Readiness (`PER-03`)

#### Desktop Split Layout (1440px: 1fr / 320px)
```
+-----------------------------------------------------------------------------------------+
| Header: Personal > Projects > ReflectFlow > Setup            [Save Draft] [Start Review]|
+------------------+-------------------------------------------+--------------------------+
| Sidebar (250px)  |  Project Context & Input (PER-03)         | Review Readiness (Side)  |
|                  |                                           |                          |
| Space: Personal  |  Project Description *                    | READINESS CHECKLIST      |
|                  |  +-------------------------------------+  | [✓] Project Name valid   |
| Nav:             |  | Detailed explanation of architecture|  | [✓] Summary >= 15 chars  |
| • My Projects    |  | and problem statement...            |  | [✓] Category assigned    |
| • Setup          |  |                                     |  | [✓] Description >= 50 w  |
| • Feedback       |  | (184 words)                         |  | [✓] Repo link provided   |
|                  |  +-------------------------------------+  |                          |
|                  |                                           | Readiness Score: 5/5     |
|                  |  Repository URL                           | Ready for AI review.     |
|                  |  [ https://github.com/example/reflectflow]|                          |
|                  |                                           | [======================] |
|                  |  Live Demo URL (Optional)                 | [ Start AI Review (CTA)] |
|                  |  [ https://reflectflow.dev              ] | [======================] |
|                  |                                           |                          |
|                  |  Documentation & Specs (Attachments)      | Privacy Notice:          |
|                  |  [ Drop ARCHITECTURE.md, README.md here ] | Private to your account. |
|                  |  - ARCHITECTURE.md (42 KB)          [Trash| Never public without     |
|                  |                                           | your explicit consent.   |
+------------------+-------------------------------------------+--------------------------+
```

#### Mobile Layout (390px)
```
+---------------------------------------+
| [←] ReflectFlow: Setup     [Save Draft|
+---------------------------------------+
| Review Readiness: Ready (5/5)         |
| [======= Start AI Review (CTA) ======]|
|                                       |
| Project Description *                 |
| +-----------------------------------+ |
| | Problem statement and             | |
| | architecture overview...          | |
| +-----------------------------------+ |
|                                       |
| Repository URL                        |
| [ https://github.com/...            ] |
|                                       |
| Attachments                           |
| [ + Add Documentation File          ] |
| - ARCHITECTURE.md (42 KB)         [x] |
|                                       |
+---------------------------------------+
| [Home]  [Explore]  ( + New )  [Saved] |
+---------------------------------------+
```

---

### Screen 7: Review Processing Status (`PER-04`)

#### Desktop & Tablet Layout (Centered Work Surface)
```
+-----------------------------------------------------------------------------------------+
| Header: Personal > Projects > ReflectFlow > Review Processing                           |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|                       +-------------------------------------------+                     |
|                       |            [ Processing Spinner ]         |                     |
|                       |                                           |                     |
|                       |        AI Project Review in Progress      |                     |
|                       |   Evaluating ReflectFlow across 5 vectors |                     |
|                       |                                           |                     |
|                       | Stages:                                   |                     |
|                       | [✓] Ingesting project context and specs   |                     |
|                       | [✓] Analyzing Usability and Onboarding UX |                     |
|                       | [⟳] Auditing Architecture & Security...   |                     |
|                       | [ ] Synthesizing Actionable Findings      |                     |
|                       |                                           |                     |
|                       | Elapsed: 6.2s  •  Model: Gemini 2.5 Flash |                     |
|                       |                                           |                     |
|                       | [ Safe Return to Project ]                |                     |
|                       +-------------------------------------------+                     |
|                                                                                         |
+-----------------------------------------------------------------------------------------+
```

---

### Screen 8 & 9: AI Feedback Report & Finding Inspector (`PER-05` / `PER-06`)

#### Desktop Split Layout (1440px: 1fr / 320px)
```
+-----------------------------------------------------------------------------------------+
| Header: Personal > ReflectFlow > AI Feedback Report              [Export] [Inspector ◨] |
+------------------+-------------------------------------------+--------------------------+
| Sidebar (250px)  |  AI Feedback Report: ReflectFlow          | Finding Detail Inspector |
|                  |  Completed Nov 2, 2026 • 5 Findings       | (PER-06)                 |
| Space: Personal  |  ---------------------------------------  |                          |
|                  |  Executive Summary:                       | [Octagon ⯃] Blocker      |
| Nav:             |  Strong core CRDT sync protocol, but      | Category: Security/Auth  |
| • My Projects    |  critical gap in token expiration and     |                          |
| • Setup          |  onboarding multi-step friction.          | Unvalidated Token Expiry |
| • Feedback*      |                                           | in Client Cache          |
|                  |  FINDINGS (Select to inspect):            | ------------------------ |
|                  |  +-------------------------------------+  | Observation:             |
|                  |  | [⯃] Blocker  •  Security/Auth       |  | Auth tokens stored in    |
|                  |  | Unvalidated Token Expiry in Storage |  | localStorage without     |
|                  |  | Status: [ Open ▾ ]                  |  | rotation checks on sync. |
|                  |  +-------------------------------------+  |                          |
|                  |  | [▲] High  •  UX & Onboarding         |  | Evidence Cited:          |
|                  |  | 4-Step Mandatory Config Friction    |  | > "Client writes tokens  |
|                  |  | Status: [ In Progress ▾ ]           |  | > directly into storage" |
|                  |  +-------------------------------------+  |                          |
|                  |  | [■] Medium  •  Architecture         |  | Recommendation:          |
|                  |  | Missing Reconnection Backoff Strategy|  | Implement httpOnly       |
|                  |  | Status: [ Addressed ✓ ]             |  | cookies with exponential |
|                  |  +-------------------------------------+  | refresh jitter.          |
|                  |                                           |                          |
|                  |  [ Work on Improvements (Dominant CTA) ]  | Status: [ Open ▾ ]       |
+------------------+-------------------------------------------+--------------------------+
```

#### Mobile Layout with Bottom Sheet Inspector (390px)
```
+---------------------------------------+
| [←] Feedback: ReflectFlow         [◨] |
+---------------------------------------+
| ReflectFlow AI Review (5 Findings)    |
| 1 Blocker • 2 High • 2 Medium         |
|                                       |
| FINDINGS:                             |
| +-----------------------------------+ |
| | [⯃] Blocker • Security            | |
| | Unvalidated Token Expiry          | |
| | Status: Open                      | |
| +-----------------------------------+ |
| | [▲] High • UX                     | |
| | 4-Step Onboarding Friction        | |
| | Status: In Progress               | |
| +-----------------------------------+ |
|                                       |
| [====== Work on Improvements ======]  |
+---------------------------------------+
| [Home]  [Explore]  ( + New )  [Saved] |
+---------------------------------------+
```
*(Tapping any finding opens the accessible bottom drawer sheet displaying the full evidence citation and status toggle).*

