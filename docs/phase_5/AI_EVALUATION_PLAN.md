# Phase 5: AI Review Engine Evaluation Plan & Quality Rubrics

## 1. Quality Evaluation Dimensions

The AI Review Engine is evaluated against four objective technical criteria:

| Dimension | Description | Acceptance Standard |
| :--- | :--- | :--- |
| **1. Grounded Evidence** | Every finding must directly cite text from the user's project context. | `finding.evidence_quote in project.description or project.name` |
| **2. Actionability** | Recommendations must provide concrete architectural or engineering steps, not generic platitudes. | Recommendation length >= 10 chars, includes technical nouns (e.g. queue, index, schema, rate-limit, auth). |
| **3. Severity Consistency** | Severities (`blocker`, `high`, `medium`, `low`) must reflect actual risk profiles. | Verified against predefined rubric (data loss/security = blocker/high). |
| **4. Schema Integrity** | Output must conform 100% to Pydantic and TypeScript types. | Zero schema validation exceptions; zero fake metrics or scores. |

---

## 2. Automated Regression Test Suite

All evaluation criteria are continuously verified via `backend/tests/test_phase_5_ai_review_engine.py`:
- `test_ai_review_context_validation_boundary`: Enforces context minimums (rejects < 20 chars with 400).
- `test_ai_review_lifecycle_and_structured_report`: Verifies real lifecycle transitions, structured report synthesis, and finding field integrity.
- `test_ai_review_ownership_isolation`: Enforces multi-tenant authorization boundaries (403 Forbidden).
- `test_finding_status_lifecycle_progression`: Validates interactive finding mutations (`open` -> `in_progress` -> `addressed`).
- `test_list_historical_reviews`: Verifies chronological review auditing.

---

## 3. Operational Telemetry & Monitoring

Key metrics recorded in `ai_reviews`:
- `execution_duration_ms`: Wall-clock latency of LLM pipeline.
- `provider` & `model_id`: Auditing which model executed each review.
- `status` & `error_message`: Monitoring error rates and failover frequencies.
- `created_at` & `completed_at`: Turnaround time tracking.

