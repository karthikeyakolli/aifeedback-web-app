# Phase 8: Public Space Specification

## 1. Executive Summary & Purpose
The **Public Space** is an unauthenticated and authenticated discovery and technical scrutiny hub for projects that creators explicitly choose to publish.

### Approved Purpose & Boundaries
- **Primary Objective**: Allow external developers, peer engineers, and evaluators to discover projects, examine technical specifications, inspect verified AI review findings, and express appreciation via upvotes.
- **Strict Boundary**: Public Space is **not** a general social network, unmoderated forum, marketplace, or directory of private user activity. Projects and their feedback reports appear in Public Space only through deliberate, explicit creator consent.
- **Privacy by Default**: All projects created in Personal Space are strictly private (`is_public = False`).
- **Anonymity & Security**: Private project identifiers cannot be probed. Any direct request to a private project via public endpoints responds with an unambiguous `404 Not Found`.

---

## 2. Information Architecture & Navigation

```
Public Discovery Hub (/explore, /public)
  │
  ├── Discovery Grid (Public Projects with upvote counts, review badges, categories)
  │     ├── Category Filter: All, Developer Tools, Productivity, AI/ML, Design/UX, SaaS/B2B, Mobile Apps
  │     ├── Search: Real-time substring query across name, tagline, description
  │     └── Sort: Most Upvoted (Popular), Most Reviews, Recent
  │
  └── Public Project Detail & Scrutiny View (/public/projects/:id)
        ├── Project Identity (Title, Tagline, Category, Stage, Author Attribution)
        ├── External Repositories & Prototypes (GitHub, Live URL)
        ├── Interactive Community Upvoting (One vote per user, toggled)
        ├── Architectural Specifications
        └── Verified AI Feedback Report & Findings Scrutiny
              ├── Findings Breakdown (Blockers, High, Medium, Low)
              ├── Executive Review Summary & Strengths
              └── Detailed Findings Grid (Observations, Evidence Quotes, Actionable Recommendations)
```

---

## 3. Approved Core Capabilities

| Capability Code | Description | Auth Requirement | Backend Route |
| :--- | :--- | :--- | :--- |
| `PUB-01` | Public Discovery Feed | Anonymous / Any | `GET /api/v1/projects/public` |
| `PUB-02` | Public Project Detail Inspection | Anonymous / Any | `GET /api/v1/projects/public/{id}` |
| `PUB-03` | Public AI Feedback Report Inspection | Anonymous / Any | `GET /api/v1/projects/public/{id}/report` |
| `PUB-04` | Category & Search Scrutiny Filtering | Anonymous / Any | `GET /api/v1/projects/public?category=...&search=...` |
| `PUB-05` | Authenticated Community Upvoting | Authenticated User | `POST /api/v1/projects/public/{id}/upvote` |
| `PUB-06` | Explicit Publishing Consent & Revocation | Project Owner | `PATCH /api/v1/projects/{id}` |

---

## 4. Relationship to Personal & Creator Spaces
- **Personal Space**: The creator's private development workbench. This is where technical context is configured, internal notes are recorded, AI reviews are initiated, and improvement tasks are tracked.
- **Creator Space**: The creator's profile, telemetry, and portfolio overview.
- **Public Space**: The public-facing showcase for published projects. When a creator publishes a project, a server-side projection is exposed to Public Space. When the creator revokes publication, access is terminated immediately.

