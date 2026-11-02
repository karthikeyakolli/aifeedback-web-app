# Phase 6: Report Error, Empty & Edge State Handling

## 1. Error & Empty State Matrix

| State Condition | Root Cause | System Behavior | Visual UX Representation |
| :--- | :--- | :--- | :--- |
| **First-Time Project (No Review)** | Project newly created; no reviews executed. | API returns `null`; UI renders Review Preparation panel. | Context length checklist, focus area tags, dominant "Start AI Review" button. |
| **Insufficient Context (< 20 chars)** | Project description is empty or < 20 characters. | Initiation rejected with HTTP 400. | Amber callout: "Insufficient Project Context (X / 20 chars)" with button to edit context. |
| **In-Flight Review (`queued` / `processing`)** | AI pipeline actively running. | Client polls `/reviews/{id}/status` every 2s. | Amber card with spinner, active model metadata, and wall-clock elapsed timer (zero fake percentages). |
| **Review Evaluation Failed** | All AI providers down or unrecoverable error. | Review marked `failed`; `error_message` persisted. | Rose error banner with exact failure message and dominant "Retry Review" action. |
| **Non-Existent Project / Report** | Deleted project or invalid UUID in URL. | HTTP 404 Not Found. | Full-screen error: "Project Not Found" with link back to Personal Projects. |
| **Unauthorized Access (403)** | Caller is not project owner of a private project. | HTTP 403 Forbidden. | Error screen: "Access Denied: Private project report cannot be viewed." |
| **No Findings Match Filter** | Search term or severity filter yields 0 matches. | Filtered list length = 0. | Subtle empty card: "No findings match the selected filters or search query" with "Reset Filters" action. |
| **Missing Sections in Report** | Legacy report without strengths summary. | Handled gracefully without crash. | Omitted cleanly; never filled with fake placeholder text. |

