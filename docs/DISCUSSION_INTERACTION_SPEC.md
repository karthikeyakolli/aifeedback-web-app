# ResearchIntel Discussion Interaction & Threading Specification

This document details the discussion composition, bounded conversation threading, voting mechanics, and comment interactions established in Phase 2.

---

## 1. Discussion Creation & Post Guidance (Ribeiro et al., 2025)

The discussion composer (`CreatePostPage.tsx`) minimizes friction while guiding contributors toward high-signal critique requests:

### 1.1 Guided Fields & Ergonomics
* **Discussion Intent**: Single-select cards for `Product Review`, `Idea Critique`, `Problem Discovery`, and `General Feedback`.
* **Title with Live Duplicate Guidance**:
  * As the user enters a title, asynchronous matching queries the active discussion repository.
  * If similar topics exist, a non-blocking suggestion box surfaces existing thread links with comment counts, encouraging collaborative conversation rather than fragmentation.
* **Structured Description**:
  * Includes placeholder templates prompting authors for: (1) Core problem, (2) Suspected friction points, and (3) Specific questions for reviewers.
  * Live **Edit / Preview** tabs allow contributors to inspect markdown formatting before publishing.
* **Product URL (Optional)**: Captures demo or repository link. Pre-populated automatically if navigated from a Product Detail page.
* **Anonymous Contributor Option**: Allows creators to request critiques without attaching their personal identity to the public post.

### 1.2 Draft Preservation & Network Failure Recovery
* **Real-time Auto-save**: Every keystroke in Title, Description, Category, or Tags is written to `localStorage[pri_draft_post]`.
* **No Premature Clear on Error**: If a network failure or server error occurs during submission, the draft is explicitly **preserved** in the form and in storage.
* **Explicit Discard**: Users can discard their draft at any time via a dedicated "Discard Draft" button.

---

## 2. Bounded Conversation Threading (Aragón et al., 2017)

Online comment trees that support unlimited indentation frequently suffer from "staircase collapse" on mobile devices, rendering text unreadable. ResearchIntel implements a **bounded hierarchy** model:

```
[Level 0: Root Comment]
 ├── [Level 1: Reply to Root]
 │    └── [Level 2: Reply to Level 1] (Max visual indent)
 │         └── [Reply to Level 2: Anchored at Level 2 with @Username mention]
```

### 2.1 Indentation Rules
* **Visual Indentation**:
  * Depth 0: Base full width (`ml-0`).
  * Depth 1: Indented 16px with subtle left border (`ml-3 sm:ml-5 pl-3 sm:pl-4 border-l-2`).
  * Depth 2: Indented 16px with subtle left border (`ml-3 sm:ml-5 pl-3 sm:pl-4 border-l-2`).
  * Depth > 2: Rendered at **Depth 2 visual indentation** with a distinct indigo border and a `@Username` reference chip to maintain 100% horizontal readability across mobile screens down to 320px.
* **Underlying Data Integrity**: The `parent_comment_id` in SQLite / Supabase preserves the exact relational parent-child graph without data loss.

### 2.2 Thread Folding (Collapse & Expand)
* Threads with nested replies display a toggle: `[collapse]` or `[+3 replies]`.
* Collapsing hides all descendants while keeping the parent comment header visible.

---

## 3. Accessible Voting & Duplicate Prevention

* **Tactile Neomorphic Upvote Pill**:
  * Renders with dual-depth soft shadow in default state; transitions to recessed inset shadow when voted (`aria-pressed="true"`).
  * Optimistic UI update: Instantly updates local counter and toggles state; reverts gracefully if the network request fails.
  * Touch target: Enforces `min-h-[44px]` for finger comfort on touchscreens.
* **Database Uniqueness**:
  * Votes are guarded by a unique composite constraint `(post_id, user_id)` in the backend repository.
  * Toggling a vote removes the existing row rather than allowing duplicate submissions.

---

## 4. Moderation & Content Reporting (Wise et al., 2006)

* Every post and comment includes a discreet "Report" action visible on hover or mobile tap.
* Users can select from 4 standard reasons (Spam, Harassment, Commercial solicitation, Duplicate).
* Moderation reports are persisted in the `reports` table and routed to the moderator queue.

