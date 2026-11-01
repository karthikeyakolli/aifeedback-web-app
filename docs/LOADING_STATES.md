# ResearchIntel Loading States & Perceived Performance Specification

This document details the loading indicators, skeleton layouts, error recovery mechanisms, and reduced-motion adaptations implemented in Phase 1.

---

## 1. Hierarchy of Loading States

To ensure a responsive and reassuring user experience, the application distinguishes three tiers of loading:

1. **Initial Boot / Session Restore**: Handled exclusively by `AppLoadingScreen`.
2. **Page & Component Fetching**: Handled by contextual skeleton loaders (`LoadingSkeletons.tsx`).
3. **In-Flight Action Feedback**: Handled by inline button spinners (`Button.tsx`) and optimistic UI updates.

---

## 2. Branded App Loading Screen (`AppLoadingScreen.tsx`)

### 2.1 Purpose & Trigger Conditions
The `AppLoadingScreen` is displayed **only on cold application boot** while `AuthContext` initializes, reads the session from Supabase/localStorage, and resolves initial user claims. It is never triggered during regular page navigations or background data refetches.

### 2.2 Graceful Timeout Recovery
Network issues or slow cold-boot backend spin-ups can leave a user stranded on a blank spinner. To eliminate this:
* A 5-second recovery timer starts when the loading screen mounts.
* If initialization does not complete within 5 seconds, an accessible recovery card surfaces below the spinner:
  * **"Retry Connection"**: Re-triggers session restoration.
  * **"Continue as Guest"**: Bypasses the blocker and drops the user into the public community discussion feed in unauthenticated guest mode.

---

## 3. Modular Skeleton Loaders (`LoadingSkeletons.tsx`)

Rather than showing a generic full-page circular spinner that causes jarring layout shifts when content loads, Phase 1 provides geometry-matched skeleton components:

### 3.1 Component Catalog

| Component | Target UI | Description |
| :--- | :--- | :--- |
| `Skeleton` | Base Primitive | Basic shape (`rounded-md`, `rounded-full`) with `bg-[var(--border-subtle)]` and subtle pulse |
| `CardSkeleton` | Community Post Cards | Mimics author avatar, username pill, timestamp, title bar, 2-line description, and tag pills |
| `FeedSkeleton` | Discussion Feed | Stacks 3–4 `CardSkeleton` items with staggered description lengths to avoid mechanical repetition |
| `PageSkeleton` | Full View Layouts | Mimics sidebar rail, top header bar, and content feed area |
| `TableSkeleton` | Documents & Logs | Mimics tabular rows with header labels and 4 data rows |
| `FormSkeleton` | Inputs & Controls | Mimics labels, input fields, helper text, and submit buttons |

---

## 4. Reduced Motion & Vestibular Accessibility

Per WCAG 2.2 Success Criterion 2.3.3 (Animation from Interactions), rapid pulsing animations can cause discomfort for users with vestibular or neurological sensitivities.

### Implementation:
In `src/index.css`:
```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
In `LoadingSkeletons.tsx`:
* Pulse animation uses `motion-safe:animate-pulse`.
* In reduced motion mode, the pulse animation is disabled automatically, rendering smooth static placeholders.

---

## 5. Inline Action Feedback & Layout Stability

* **Button Spinners**: When `isLoading` is set on a `Button`, the button replaces its left icon with a CSS spinner:
  * Pointer events are disabled (`pointer-events-none`).
  * Text content remains visible or maintains exact geometry so the button does not shrink or shift neighboring controls.
* **Form Submission**: Form submit buttons remain disabled during in-flight requests, preventing duplicate submissions.

