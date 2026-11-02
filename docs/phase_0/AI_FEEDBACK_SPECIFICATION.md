# AI Feedback System Specification

> **Document Type**: Phase 0 Core Deliverable  
> **Status**: `CONFIRMED / ARCHITECTURAL SPECIFICATION`  
> **Version**: 1.0.0  
> **Date**: November 2, 2026  
> **Audience**: AI Engineers, Backend Engineers, Product Architects  

---

## 1. Principles of Truthful AI Evaluation

The AI Feedback system operates under strict constitutional rules defined in `01_PRODUCT_DESIGN_CONSTITUTION.md`:
1. **Zero Hallucination / Grounding Mandate**: An observation cannot be presented as a finding unless it is grounded in user-provided text, code links, or verified document excerpts.
2. **Zero Fabricated Scores**: The system strictly forbids generating fake numerical quality scores (e.g., "78/100") or arbitrary confidence percentages ("96% confident").
3. **Transparent Uncertainty**: The AI must explicitly declare what it does *not* know, where evidence is missing, and what assumptions it made.
4. **Actionable Outputs**: Every finding must specify an actionable recommendation rather than vague commentary.

---

## 2. Ingestion: What Users Submit & What AI Receives

### User Submissions (`ReviewInput` Payload):
- **Project Name & Tagline**: Short framing of the product concept.
- **Detailed Description**: Problem statement, target personas, workflow, and core architecture.
- **Category & Domain**: e.g., `developer-tools`, `productivity`, `ai-ml`.
- **Repository Link**: Public GitHub/GitLab URL.
- **Live Demo Link**: Web application endpoint or prototype URL.
- **Project Documents**: Extracted text from uploaded Markdown specs, READMEs, API schemas, or PDFs.

### What the AI Engine Receives:
The ingestion pipeline cleans and normalizes user input into a structured context bundle:
```json
{
  "project_id": "uuid",
  "metadata": {
    "name": "ReflectFlow",
    "category": "developer-tools",
    "links": {
      "repository": "https://github.com/example/reflectflow",
      "demo": "https://reflectflow.dev"
    }
  },
  "context_text": "Detailed description provided by user...",
  "documents": [
    {
      "source": "ARCHITECTURE.md",
      "content": "Normalized text content..."
    }
  ]
}
```

---

## 3. Approved Evaluation Dimensions (Review Rubric)

The review engine evaluates project submissions across **5 Confirmed Dimensions**:

| Dimension | Scope of Evaluation | Example Finding |
|---|---|---|
| **1. Usability & UX (`ux`)** | Onboarding clarity, navigation cognitive load, information hierarchy, empty states, and clarity of value proposition. | "Complex onboarding flow requires 4 distinct configuration steps before first value." |
| **2. Architecture & System Design (`architecture`)** | Data flow, offline synchronization, state management consistency, API contract boundaries. | "Client-side state synchronization lacks conflict resolution for concurrent writes." |
| **3. Performance & Scalability (`performance`)** | Bundle size, unindexed database queries, synchronous blocking operations, memory footprints. | "Unpaginated list endpoint fetches entire project history into single client payload." |
| **4. Security & Authentication (`security`)** | Token storage in client, missing Row-Level Security, unprotected API routes, lack of rate limiting. | "API endpoint exposes user profile modifications without verifying session token ownership." |
| **5. Correctness & Logic Bugs (`bug`)** | Edge cases, race conditions, missing input validations, broken redirects. | "Submitting project without category triggers unhandled 500 server error." |

> **Audit Status on Evaluation Rubric**:  
> The 5 dimensions above are `CONFIRMED`. Additional sub-rubrics (e.g., SEO audit, legal license compliance, accessibility automated tree scan) are marked `PROPOSED BASELINE` and can be enabled conditionally.

---

## 4. Structured Output Schema (`ReviewFinding`)

The AI output conforms to a strict Pydantic model (`backend/app/schemas/product_review.py`):

```python
class ReviewFinding(BaseModel):
    id: str                                # Deterministic finding ID (e.g. "fnd_01")
    title: str                             # Concise headline (< 80 chars)
    severity: Literal['blocker', 'high', 'medium', 'low']
    category: Literal['ux', 'performance', 'security', 'bug', 'architecture']
    observation: str                       # Factual explanation of the issue
    evidence_quote: str                    # Exact text excerpt cited from user input
    recommendation: str                    # Actionable implementation step
    uncertainty: Optional[str]             # Explicit caveats or assumptions
    status: Literal['open', 'in_progress', 'addressed'] = 'open'
```

---

## 5. What Makes a Result Valid (Validation Gate)

A review execution is accepted and persisted **if and only if** it passes the server-side **Integrity Validator**:
1. **Citation Verification**: Every finding's `evidence_quote` must be verified as a substring or semantic match against user-provided context. Any finding citing non-existent text is discarded.
2. **Severity Integrity**: Blocker and High severity findings must include specific technical remediation steps.
3. **Categorical Balance**: The review must evaluate all 5 dimensions. If an area lacks sufficient evidence, the model emits an `evidence_gaps` statement rather than fabricating findings.
4. **Non-Empty Findings**: A valid review must produce between 3 and 10 prioritized findings. Overwhelming the user with 50 unranked findings violates the cognitive load constitution.

---

## 6. How Uncertainty is Communicated

Rather than generating misleading percentages (e.g., "AI Confidence: 87%"), uncertainty is expressed transparently:
- **Evidence Gap Disclosure**: Each report includes a dedicated section: *"What This Review Did Not Cover"*, detailing missing documentation, uninspected backend code, or unverified production latency.
- **Finding Caveats**: When a finding is inferred rather than directly observed, the finding card explicitly flags: *"Inferred from architectural overview; live endpoint verification recommended."*

---

## 7. Failure Handling & Review History

### Failure Recovery:
- If the AI provider returns a rate limit (429) or gateway timeout (504), the backend review state transitions to `status: "failed"` with a human-readable reason.
- The UI retains all user-entered project context and provides a clear `Retry Review` button.
- Existing completed reviews are never overwritten by a failed run.

### Review History Maintenance:
- Each completed review run creates an immutable record in `ai_reviews` and `feedback_reports`.
- Project records reference the `latest_review_id`, while historical reviews remain queryable under `/personal/projects/:id/history` (`PER-07`).

