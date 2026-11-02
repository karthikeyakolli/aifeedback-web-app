# Phase 4 — Project Intake Specification

**Status**: IMPLEMENTED & VERIFIED  
**Role**: Senior Product Engineer & Information Architect  
**Date**: November 2, 2026  
**Scope**: Project Intake Workflow, Multi-Stage Setup, Field Matrix & Duplicate Submission Protection  

---

## 1. Intake Philosophy & Architecture

Project intake is designed to balance low initial creation friction with the collection of high-fidelity technical context necessary for deep AI feedback.

The workflow follows a two-stage architecture:
- **Stage 1: Quick Intake (`/personal/projects/new`)**: Rapidly captures identity and categorization so the creator immediately establishes an owned workspace.
- **Stage 2: Deep Setup (`/personal/projects/:id/setup`)**: Enables the creator to provide in-depth markdown specifications, repository references, and prototype links before launching an AI review.

```mermaid
flowchart LR
    Start([Creator Clicks 'New Project']) --> Stage1["Stage 1: Quick Intake\n(Name, Tagline, Category)"]
    Stage1 --> Validate1{Valid Inputs?}
    Validate1 -- No --> ShowErrors[Inline Field Errors]
    Validate1 -- Yes --> POST_API[POST /api/v1/projects\n(isSubmitting=true)]
    POST_API --> Stage2["Stage 2: Project Setup\n(Detailed Markdown Specs, URLs, Status)"]
    Stage2 --> LaunchReview([Ready for AI Review])
```

---

## 2. Field-by-Field Intake Matrix

| Field Name | Data Type | Required? | Character Limits | Purpose | Help Text / Instructions | Persistence Behavior |
|---|---|---|---|---|---|---|
| `name` | String | **Required** | Min: 3<br>Max: 120 | Distinct title for the project, tool, or prototype | "Clear, descriptive title for your prototype, tool, or library." | Trimmed, saved on create and update |
| `tagline` | String | **Required** | Min: 10<br>Max: 200 | Single sentence summary explaining the core value proposition | "A single punchy sentence describing what it is and what core problem it solves." | Trimmed, displayed on cards and breadcrumbs |
| `category` | Enum | **Required** | N/A (1 of 7) | Curated taxonomy for community discovery and AI reviewer persona tuning | Select from 7 approved categories | Stored as string identifier |
| `description` | Text | Optional at create;<br>Required (>= 20) for `ready` | Max: 50,000 | Technical context, architecture diagrams, user stories, trade-offs | "The more detailed your technical specification, the higher the precision of the AI feedback audit findings." | Markdown-formatted string, saved to `description` column |
| `repository_url` | String | Optional | Max: 500 | Link to GitHub, GitLab, or Git repository | "Public or private repository URL for code reference." | Validated for `http://` or `https://` prefix |
| `demo_url` | String | Optional | Max: 500 | Link to live web application, hosted demo, or interactive prototype | "Live demonstration URL where reviewers can interact with the product." | Validated for `http://` or `https://` prefix |
| `status` | Enum | System default: `draft` | N/A | Current lifecycle stage of the project | Governed by project lifecycle rules | Managed via status transition controls |
| `is_public` | Boolean | System default: `false` | N/A | Controls whether project is published to Public Explore feed | "Published to Public Space vs Private to Personal Space" | Stored as integer (0/1) in SQLite, boolean in Postgres |

---

## 3. Duplicate Submission Protection

To avoid accidental creation of duplicate projects when a user double-clicks the submission button or experiences network latency:
1. **Client-Side Lock**:
   - The form sets `isSubmitting = true` on the initial click.
   - The submission button is immediately disabled and its label changes to `"Creating Project..."` with an active animated spinner.
   - Any secondary click events are ignored.
2. **Post-Submission Transition**:
   - Upon successful HTTP 201 response, `localStorage` draft keys are deleted, and the router transitions immediately to the newly generated project's setup URL (`/personal/projects/${created.id}/setup`).

---

## 4. Cancellation & Navigation Guards

- **Cancellation Action**:
  - The `"Cancel"` button returns the creator to `/personal`.
  - If any input fields have been populated (`isDirty == true`), the creator is prompted to confirm discard before leaving the screen.
- **Input Restoration**:
  - If a creator accidentally navigates away without submitting, returning to `/personal/projects/new` restores their entered text from the `localStorage` buffer with a dismissible notification.

