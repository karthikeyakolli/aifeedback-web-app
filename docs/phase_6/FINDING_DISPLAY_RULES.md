# Phase 6: Finding Display Rules & Visual Standards

## 1. Principles of Finding Representation

To ensure clarity, credibility, and immediate utility for developers:
1. **Never Invent References**: If an evidence quote cannot be verified from the project text, the finding is not displayed.
2. **Clear Typography**: Observations and Recommendations must never blend into a single block of text.
3. **Calibrated Severities**: Visual weight must correspond strictly to real engineering urgency.

---

## 2. Visual Style & Color Coding

### 2.1. Severity Badges

| Severity | Color Tokens | Semantic Meaning | Recommended Action |
| :--- | :--- | :--- | :--- |
| **`blocker`** | `bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20` | Fatal security flaw, data corruption risk, complete outage. | Resolve before any production deployment. |
| **`high`** | `bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20` | Significant scalability, authorization, or stability vulnerability. | Prioritize in the next sprint iteration. |
| **`medium`** | `bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20` | Architectural debt, unhandled edge cases, observability gaps. | Address as part of planned technical debt reduction. |
| **`low`** | `bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20` | Developer ergonomics, naming conventions, documentation gaps. | Address opportunistically. |

---

## 3. Component Layout & Structural Anatomy

```
+-----------------------------------------------------------------------------------+
| [SEVERITY]  [CATEGORY]  [STATUS BADGE]               [ Open | In Progress | Addressed ] |
|                                                                                   |
| Finding Title (Bold, concise, action-oriented)                                    |
|                                                                                   |
| Observation:                                                                      |
| Detailed technical narrative describing the identified condition and risk.        |
|                                                                                   |
| +-------------------------------------------------------------------------------+ |
| | " Grounded Evidence Quote                                                     | |
| |   Exact verbatim quote extracted from the project context.                    | |
| +-------------------------------------------------------------------------------+ |
|                                                                                   |
| +-------------------------------------------------------------------------------+ |
| | Concrete Recommendation                                                       | |
| | Actionable engineering steps to eliminate or mitigate the finding.            | |
| +-------------------------------------------------------------------------------+ |
+-----------------------------------------------------------------------------------+
```

### 3.1. Evidence Quote Rendering Invariant
- The quote is wrapped in a dedicated callout container (`bg-[var(--canvas)] border-[var(--border-default)]`).
- Prefixed with an explicit quotation icon (`Quote`).
- Styled in monospace/italic text: `"{finding.evidenceQuote}"`.
- Never synthesized or paraphrased.

