# AI Research Workspace UX & Grounding Specification

This document details the interaction architecture, explainable AI (XAI) design, citation inspection mechanics, and opportunity prioritization mathematics governing the **AI Research Workspace** in **Product Research Intelligence (PRI)**.

---

## 1. 3-Pane Research Workspace Architecture

Unlike generic chatbots floating in dashboard corners, the AI Research Workspace is designed as an analytical workbench for Product Managers, Founders, and Engineers.

```
+---------------------------------------------------------------------------------------------------+
| Top Workspace Bar: Active Inquiry Title | Model Indicator | Mobile Panel Toggles [Left] [Right]    |
+------------------------------------+------------------------------------+-------------------------+
| PANE 1: SESSIONS & INQUIRIES       | PANE 2: CONVERSATION STREAM        | PANE 3: EVIDENCE        |
| (Desktop: lg:col-span-3)           | (Desktop: lg:col-span-6)           | (Desktop: lg:col-span-3)|
|                                    |                                    |                         |
| • Discussion Metadata              | • User Questions                   | • Evidence Inspector    |
|   - Title & Category               | • Lead Answer First                | • Selected Citation     |
|   - Comments Sample Size           | • Observed Facts (Green Block)     |   - Verbatim Quote      |
|                                    | • Inferred Hypotheses (Purple)     |   - Author Attribution  |
| • Past Session History             | • Uncertainty Disclosure (Amber)   |   - Jump to Comment     |
|   - Switch session / Delete        | • Interactive Citation Badges      |                         |
|                                    | • Suggested Follow-Up Chips        | • All Session Evidence  |
| • Prompt Library                   | • Human Feedback & Correction      |   - Verbatim Snippets   |
|   - Usability friction             |   - Thumbs Up / Down               |   - Comment IDs         |
|   - Conflicting opinions           |   - Regenerate with Broader Scope  |                         |
|   - Feature gaps                   | • Multi-line Input Dock            |                         |
+------------------------------------+------------------------------------+-------------------------+
```

### 1.1 Responsive Viewport Adaptations
* **Desktop ($\ge 1024$ px)**: Displays all 3 panes simultaneously in a balanced 3:6:3 grid (`grid-cols-12`).
* **Tablet & Mobile ($< 1024$ px)**: Collapses side panels by default. The header provides two accessible toggle buttons:
  - `[Sessions]`: Opens/closes the Left Pane.
  - `[Evidence ({n})]`: Opens/closes the Right Evidence Inspector.

---

## 2. Structure of Synthesized Answers (XAI Framework)

Guided by Hong & Park (2025) and Bove et al. (2022), every AI response follows a strict 5-stage communicative contract:

```
[1. Lead with Direct Answer]
"Users report significant onboarding friction caused by the absence of keyboard shortcuts during task creation."

[2. Observed Facts from Discussion] (Direct Ground Truth)
✓ Commenter @sarah_dev noted tasks take 4 clicks to initialize via mouse modal.
✓ Commenter @dan_eng stated lack of calendar block sync causes meeting double-booking.

[3. Product Hypotheses] (AI Inference & Strategic Takeaway)
• Introducing a global 'Ctrl+K' quick task composer will reduce creation time by ~60%.
• Bidirectional Google Calendar sync is likely a prerequisite for enterprise adoption.

[4. Uncertainty Disclosure] (Calibrating Trust - Google PAIR)
⚠ Limited sample size: only 4 comments analyzed. Confidence is moderate.

[5. Interactive Supporting Citations]
[ #1 @sarah_dev ]  [ #2 @dan_eng ]  [ #3 @alex_pm ]
```

---

## 3. Evidence & Citation Inspector Mechanics

### 3.1 Provenance and Interactive Grounding
Every claim made by the AI model is bound to a verified database record (`CitationRecord`):
* **Citation Badge**: Rendered as a pill `[#1 @Author]`.
* **Click Interaction**:
  1. Sets `activeInspectedCitation` in state.
  2. Automatically expands the Right Evidence Inspector pane if closed.
  3. Highlights the target quotation card with an active blue ring (`ring-2 ring-blue-500`).
* **Deep Linking**:
  - The card features a prominent `"Highlight in Discussion"` button.
  - Clicking this switches the UI to the Community Discussion tab, smooth-scrolls to the exact comment DOM element, and applies a temporary glow highlight ring for 2.5 seconds.

---

## 4. Human-AI Feedback & Correction (CHI 2026 Feedback by Design)

To overcome feedback barriers where users feel corrections are ignored:
* **Immediate Visual Feedback**:
  - Clicking **Thumbs Up** or **Thumbs Down** triggers an instant visual confirmation: `"Feedback recorded"`.
* **One-Click Regeneration**:
  - Clicking **Regenerate** re-queries the RAG pipeline with expanded context parameters without forcing the user to retype their prompt.
* **Citation Flaw Reporting**:
  - Users can flag mismatched or hallucinatory citations, which logs the prompt-response pair for retrieval tuning.

---

## 5. Opportunity Prioritization Mathematics ($P_0 - P_3$)

In the Product Suggestions view, PRI avoids opaque AI "opinions" in favor of an explainable, deterministic mathematical model:

$$\text{Opportunity Score} = (F \times 0.35) + (S \times 0.35) + (C \times 0.20) + (K \times 0.10)$$

| Metric | Max Pts | Weight | Mathematical Formulation |
| :--- | :---: | :---: | :--- |
| **Frequency ($F$)** | 35 | 35% | $\min\left(35, \; \frac{U_{\text{mentions}}}{\max(1, N_{\text{total}})} \times 100 \times 0.35\right)$ |
| **Severity ($S$)** | 35 | 35% | Lexical sentiment analysis weighting terms like *crash, blocker, unplayable, churn, lost data* (1.0) vs. *minor, annoying* (0.5). |
| **Consensus ($C$)** | 20 | 20% | Ratio of net upvotes on supporting comments minus opposing perspectives: $\frac{\sum V_{\text{support}}}{\sum V_{\text{support}} + \sum V_{\text{oppose}}} \times 20$. |
| **Confidence ($K$)** | 10 | 10% | Grounding density coefficient based on citation completeness and verifiable quotes. |

### 5.1 Priority Tier Thresholds
* **$P_0$ (Urgent Fix / Blocker)**: Score $\ge 85$. Critical defects causing active churn or workflow termination.
* **$P_1$ (High Impact)**: Score $70 - 84$. Major feature requests or friction points confirmed by multiple power users.
* **$P_2$ (Medium Enhancement)**: Score $50 - 69$. Ergonomic polish, visual improvements, or secondary workflow requests.
* **$P_3$ (Low / Exploratory)**: Score $< 50$. Niche edge cases or single-user suggestions with unverified consensus.

---

## 6. Research Document Artifacts & PRD Generation

PRI allows researchers to translate verified findings into downloadable deliverables:
1. **Analytical Report**: Comprehensive 15-page synthesis of recurring themes, consensus disputes, and raw comment tables.
2. **Executive Summary**: High-conviction 2-page brief summarizing opportunities, risks, and ROI for leadership.
3. **PRD Draft**: Standard product requirements document containing user stories, functional requirements, and non-functional acceptance criteria.
4. **Engineering Ticket**: Sprint-ready technical spec with reproduction steps, expected behavior, and edge-case test suites.
5. **UX Brief**: Usability breakdown including user journey friction and verbatim participant quotes.

*Export formats*: Formatted Markdown (`.md`) or publication-ready PDF (`.pdf`).

