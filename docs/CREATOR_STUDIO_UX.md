# Creator Research Studio UX Specification

## Executive Overview

The **Creator Research Studio** is an owner-exclusive, progressive workspace designed for verified product creators to investigate customer feedback, cross-reference strategic internal documentation (PDF specifications, PRDs, Markdown architecture sheets), and synthesize actionable product insights with Google Gemini AI.

Rather than isolating documents or research queries into disconnected modals or disjointed tabs, the Creator Research Studio implements a cohesive **Three-Pane Architecture** that balances context selection, conversational exploration, and evidence transparency.

---

## 1. Information Architecture & Spatial Model

```
+---------------------------------------------------------------------------------------------------+
| Top Navigation & Toolbar: Discussion Title | Category | Owner Verified Badge | View Switcher Tabs |
+---------------------------------------------------------------------------------------------------+
| LEFT PANE (260-280px)      | CENTER PANE (Flexible min 600-700px) | RIGHT PANE (300-340px)        |
|                            |                                      |                               |
| [Active Evidence Sources]  | [Top Context Bar: Grounding Status]  | [Evidence Inspector]          |
| • Community Feedback       |                                      | • Semantic Badge:             |
|   - Eligible comments (N)  | [Chat Stream]                        |   - Community Evidence (Teal) |
|   - In/Out Context Toggle  | • User Research Turns                |   - Internal Doc (Blue)       |
| • Attached Documents       | • Assistant Answers with:            |   - AI Synthesis (Violet)     |
|   - Drag & Drop Uploader   |   - Direct Answer                    | • Quoted Snippet / Excerpt    |
|   - Format badges & size   |   - Observed Facts                   | • Contributor / File Info     |
|   - Inclusion Checkbox     |   - Hypotheses & Interpretation      | • Page Number / Section       |
|   - Preview / Delete       |   - Uncertainty Box (Amber)          | • Direct Jump / Preview Link  |
|                            |   - Grounded Citation Badges         |                               |
| [Research Sessions]        |     [C-1], [D-1], [S-1]              | [Session Citations Pool]      |
| • Session History List     |                                      | • All cited quotes in session |
| • "+ New Session" Action   | [Interactive Composer]               |                               |
| • Turn Count & Timestamps  | • Textarea with Ctrl+Enter submit    |                               |
+---------------------------------------------------------------------------------------------------+
```

### Layout Specifications

| Pane | Target Desktop Width | Primary Purpose | Responsive Adaptation |
| :--- | :--- | :--- | :--- |
| **Left Pane** | 260–280px (Flexible) | Source library, document uploads, context toggles, and session history | Collapsible drawer on Tablet; switchable tab on Mobile |
| **Center Pane** | Flexible (min 600–700px) | Conversational research assistant, executive synthesis, and priority matrix | Main continuous view on Tablet & Mobile; retains drafts |
| **Right Pane** | 300–340px (Flexible) | Verifiable evidence inspector, page-level document excerpts, and comment linking | Slide-over panel on Tablet; switchable bottom panel/tab on Mobile |

---

## 2. Multi-Device Responsive Reflow

### Desktop (>= 1024px)
- **Simultaneous Tri-Pane Presentation**: Sources on the left, conversation in the center, inspector on the right.
- Container widens automatically to `max-w-7xl` (1280px) to prevent crowded reading columns and horizontal scrolling.
- Real-time interaction: clicking a citation chip (`[C-1]`, `[D-1]`) in the center instantly focuses and loads the excerpt into the right pane without page reload.

### Tablet (768px – 1023px)
- **Focused Center View with Drawer Controls**:
  - Center conversation pane occupies full viewport width.
  - Header toolbar introduces two tactile pill buttons:
    - `[Sources & Sessions (N)]`: Toggles slide-over left drawer with full upload and session switching capabilities.
    - `[Evidence Inspector (N)]`: Toggles slide-over right panel when inspecting citations.
  - Toggling drawers never interrupts active LLM generation or in-flight composer drafts.

### Mobile (< 768px)
- **Segmented Panel Switcher**:
  - Single column presentation with top segment buttons:
    `[Sources & Docs]` | `[Research Conversation]` | `[Evidence Inspector]`
  - Selecting any citation chip (`[C-x]`, `[D-x]`) in the conversation automatically switches to `[Evidence Inspector]` with the inspected item active.
  - Conversation input draft in `draftMessage` remains preserved in React state across panel switches.

---

## 3. Human-AI Interaction & Progressive Disclosure

Following Google PAIR and Microsoft Guidelines for Human-AI Interaction:
1. **Explicit Source Transparency (G1)**: The assistant displays exactly which sources are active (`Grounded in: Community (28) + 2 Docs`).
2. **Deterministic Citations (G2)**: Every statement of fact includes a verifiable citation chip (`[C-1]`, `[D-1]`). Hallucinated IDs are pruned before display.
3. **Epistemic Humility (G3)**: The assistant renders an amber **Data Limitations & Uncertainty** callout when sample sizes are small or conflicting signals exist.
4. **Creator Control (G4)**: The creator can toggle specific documents or community comments in and out of the active retrieval context with a single click.

---

## 4. Accessibility & Keyboard Navigation (WCAG 2.2 AA)

- **Keyboard Traversal**: Full tab ordering between left sources, center composer, and right inspector.
- **Shortcuts**: `Ctrl + Enter` (or `Cmd + Enter`) immediately submits research questions from the textarea.
- **Screen Reader Announcements**: Citation buttons announce source type, title, and page number (e.g., `aria-label="Inspect Internal Document Citation: Architecture Spec, Page 2"`).
- **Focus Preservation**: Closing the Document Preview modal returns keyboard focus to the triggering element.

