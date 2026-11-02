# Phase 9: Creator Workflows

## 1. Workflow Summary
Creator Space provides three core, end-to-end workflows:
1. **Showcase Launch Readiness & Publication Management**
2. **Maker Identity & Profile Configuration**
3. **AI Review Diagnostics & Model Benchmarking**

---

## 2. Showcase Launch & Publication Workflow

```mermaid
sequenceDiagram
    actor Creator as Authenticated Creator
    participant Studio as Creator Studio UI (/creator)
    participant Modal as Publication Confirmation Modal
    participant API as Backend Creator API
    participant DB as Relational Database
    participant Public as Public Space (/explore)

    Creator->>Studio: Navigate to Creator Space
    Studio->>API: GET /api/v1/creator/studio
    API->>DB: Query projects, blockers & review stats
    DB-->>API: Return projects & readiness data
    API-->>Studio: Render Studio Metrics & Project Cards

    Creator->>Studio: Click "Publish Showcase" on Project
    Studio->>Modal: Open Confirmation Dialog with Consequence Disclosure
    Creator->>Modal: Review disclosure & Click "Confirm & Publish"
    Modal->>API: POST /api/v1/creator/projects/{id}/publish
    API->>DB: UPDATE projects SET is_public = 1
    DB-->>API: Confirm updated record
    API-->>Modal: Return 200 OK (isPublic: true)
    Modal-->>Studio: Close modal, show success toast & re-fetch
    Studio-->>Public: Project is now discoverable on Explore Feed & Public Profile
```

---

## 3. Publication Revocation Workflow

```mermaid
sequenceDiagram
    actor Creator as Authenticated Creator
    participant Studio as Creator Studio UI (/creator)
    participant Modal as Revocation Confirmation Modal
    participant API as Backend Creator API
    participant DB as Relational Database

    Creator->>Studio: Click "Revoke" on Published Project
    Studio->>Modal: Open Revocation Warning Dialog
    Note over Modal: Warns that direct links will return 404
    Creator->>Modal: Click "Confirm & Make Private"
    Modal->>API: POST /api/v1/creator/projects/{id}/unpublish
    API->>DB: UPDATE projects SET is_public = 0
    DB-->>API: Confirm updated record
    API-->>Modal: Return 200 OK (isPublic: false)
    Modal-->>Studio: Close modal & refresh project status
    Note over API: Direct calls to /public/projects/{id} now return 404 Not Found
```

---

## 4. Maker Profile Configuration Workflow

1. **Access Profile Editor**:
   - Creator opens `/creator/profile`.
2. **Input Credentials**:
   - Updates Display Name, Biography, Primary Technical Skills tags, GitHub URL, and Website URL.
3. **Live Public Preview**:
   - The right inspector panel provides an instant, pixel-accurate preview of how the maker card will render on public project headers and the standalone maker profile (`/creators/:username`).
4. **Validation & Persistence**:
   - URL prefixes validated (`http://` or `https://`).
   - Changes submitted to `PATCH /api/v1/creator/profile`.
   - On success, toast confirmation displays; form resets dirty tracking.

