# Phase 5: AI Review Engine Output Schema & Validation

## 1. Output Policy & Strict Prohibitions

In strict compliance with Phase 0 Scope Freeze and Phase 5 requirements:
1. **Zero Fake Metrics**: The AI Review Engine **never** outputs synthetic numeric scores (e.g. "87/100"), arbitrary confidence percentages (e.g. "94% confidence"), or fabricated citations.
2. **Deterministic Counts**: Summary count fields (`totalFindingsCount`, `blockersCount`, etc.) are computed deterministically by counting actual finding records.
3. **Mandatory Grounding**: Every finding must contain an exact `evidenceQuote` from the project specification text.

---

## 2. LLM Generation Schema (`StructuredProjectFeedbackProposal`)

```json
{
  "executive_summary": "Comprehensive architectural and reliability audit of Cloud Ledger Core...",
  "strengths_summary": "Strong domain modeling with high-throughput event sourcing and explicit immutability guarantees...",
  "findings": [
    {
      "title": "Define Asynchronous Queue Bounds & In-Memory Spillover Policy",
      "severity": "high",
      "category": "architecture",
      "observation": "The ingestion pipeline accepts batch transactions without defining backpressure bounds or spillover storage.",
      "evidence_quote": "accepts batch transactions, hashes them cryptographically",
      "recommendation": "Introduce a bounded queue (e.g. Redis Streams or RabbitMQ) with rate limiting to prevent memory exhaustion under burst traffic."
    }
  ]
}
```

---

## 3. Persisted Database & API Schemas

### 3.1. Feedback Report Schema (`FeedbackReportRead`)

Returned by `GET /api/v1/projects/{project_id}/report`:

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID / string` | Unique identifier of the report record. |
| `reviewId` | `string` | Foreign key referencing the generating `ai_reviews` session. |
| `projectId` | `string` | Foreign key referencing the target project. |
| `executiveSummary` | `string` | Synthesized technical summary of the project architecture and audit scope. |
| `strengthsSummary` | `string` | Explicit recognition of strong architectural and product foundations. |
| `totalFindingsCount` | `int` | Deterministic count of total findings in this report. |
| `blockersCount` | `int` | Deterministic count of findings with severity `'blocker'`. |
| `highCount` | `int` | Deterministic count of findings with severity `'high'`. |
| `mediumCount` | `int` | Deterministic count of findings with severity `'medium'`. |
| `lowCount` | `int` | Deterministic count of findings with severity `'low'`. |
| `findings` | `List[FindingRead]` | Ordered list of interactive finding records. |
| `createdAt` | `ISO 8601 string` | Timestamp of report generation. |

### 3.2. Finding Schema (`FindingRead`)

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID / string` | Unique finding identifier. |
| `reportId` | `string` | Foreign key referencing the parent feedback report. |
| `projectId` | `string` | Foreign key referencing the project. |
| `title` | `string` | Concise, actionable title for the finding (3-255 chars). |
| `severity` | `enum` | `'blocker'` \| `'high'` \| `'medium'` \| `'low'` |
| `category` | `enum` | `'ux'` \| `'performance'` \| `'security'` \| `'bug'` \| `'architecture'` \| `'accessibility'` |
| `observation` | `string` | Detailed technical analysis of the identified risk or gap. |
| `evidenceQuote` | `string` | Verifiable quote from the project context grounding this observation. |
| `recommendation` | `string` | Concrete, engineering-oriented remediation steps. |
| `status` | `enum` | Interactive lifecycle status: `'open'` \| `'in_progress'` \| `'addressed'` (defaults to `'open'`). |
| `resolvedAt` | `Optional[ISO 8601]` | Timestamp when finding transitioned to `'addressed'`. |
| `createdAt` | `ISO 8601 string` | Timestamp of creation. |

---

## 4. Severity Rubric

- **Blocker**: Critical vulnerability, data loss risk, complete crash, or fatal architectural flaw that halts deployment.
- **High**: Significant performance degradation, missing authentication boundaries, race condition under concurrency, or severe UX failure.
- **Medium**: Scalability bottlenecks, missing error handling, inadequate observability, or DX friction.
- **Low**: Code organization, naming conventions, minor documentation gaps, or ergonomic polish.

