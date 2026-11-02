# Phase 9: Creator Publishing Rules & Lifecycle Governance

## 1. Non-Negotiable Publishing Principles

1. **Explicit Creator Action Only**:
   - Publishing can **never** be triggered automatically (e.g. by creating a project, switching spaces, or completing an AI review).
   - An explicit button click by the authenticated creator is mandatory.

2. **Full Consequence Disclosure**:
   - Before executing a publish operation, the application must present a confirmation modal detailing:
     - The public destinations (Explore Feed, Creator Public Profile).
     - The exact data fields that will become publicly visible (title, category, tagline, description, repository link, demo link, verified AI findings).
     - The zero-data-leakage reassurance (personal notes and user IDs remain private).

3. **Backend-Confirmed Execution**:
   - The UI does not mark a project as published until receiving a verified `200 OK` from the server.
   - If network failure occurs, the state remains private.

4. **Instant Revocation Lifecycle**:
   - Unpublishing a project must take effect immediately.
   - The server sets `is_public = 0`.
   - Subsequent calls from anonymous visitors or external scrapers to `/public/projects/{id}` or `/public/projects/{id}/report` return `404 Not Found`.

---

## 2. Publishing State Lifecycle

```
[Personal Draft (is_public=False)]
          │
          │ (Explicit Publish Confirmation Modal)
          ▼
[Public Showcase (is_public=True)]
  • Visible on Explore Feed
  • Visible on Public Maker Profile
  • Upvoting Enabled
          │
          │ (Explicit Revocation Modal)
          ▼
[Personal Private Draft (is_public=False)]
  • Direct Links return 404 Not Found
  • Removed from Explore & Public Profile
```

