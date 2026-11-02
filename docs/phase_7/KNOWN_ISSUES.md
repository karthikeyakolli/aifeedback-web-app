# Phase 7: Known Issues & Deferred Backlog

## 1. Known Non-Blocking Issues & Mitigations

| ID | Issue Description | Impact | Mitigation / System Behavior | Status |
| :--- | :--- | :--- | :--- | :--- |
| **KI-01** | **Gemini Free-Tier Rate Limits (429 Resource Exhausted)** | Upstream Google Gemini Free Tier limits requests to 20/day per project. | Handled automatically: Engine logs warning and seamlessly switches to Groq or deterministic evaluator. No user error. | Mitigated |
| **KI-02** | **Vite Bundle Chunk Size Warning (> 500kB)** | Single client JS chunk is ~1MB uncompressed (261kB gzipped). | Gzip compression ensures rapid delivery (< 100ms on broadband). Dynamic import splitting deferred to post-MVP. | Accepted |
| **KI-03** | **Local Recovery Buffer Dependency on `localStorage`** | Unsaved draft buffers in `ProjectSetupPage` rely on browser storage. | If user clears site data, uncommitted draft changes are lost; server-persisted data is unaffected. | By Design |

---

## 2. Deferred Feature Backlog (Post-MVP)

The following capabilities were explicitly deferred to preserve the Phase 0 Scope Freeze and ensure stability:
1. **Multi-User Collaboration**: Shared edit permissions and team-level projects deferred to Organization Release.
2. **Rich Text / WYSIWYG Description Editor**: Retained raw monospace text/markdown to preserve architectural and technical fidelity.
3. **PDF Direct Generation**: Deferred in favor of universally compatible, sanitized Markdown export (`.md`).
4. **Third-Party Issue Tracker Sync (Jira/Linear Webhooks)**: Deferred to avoid prematurely introducing heavy task-management complexity.

