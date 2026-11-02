# Phase 5: AI Review Engine Error Handling & Resilience

## 1. Error Matrix & Handling Protocols

| Error Scenario | Root Cause | System Response | Client Experience |
| :--- | :--- | :--- | :--- |
| **HTTP 400 Bad Request** | Project description < 20 characters | Request rejected before LLM call; DB untouched. | "Project description has insufficient context for an AI review. Please provide at least 20 characters in Project Setup." |
| **HTTP 403 Forbidden** | Caller is not verified owner of the project | Request rejected by `get_project` ownership check. | "Only the verified project owner can initiate an AI review." |
| **HTTP 429 Resource Exhausted** | Google Gemini Free Tier / quota exhausted | Server catches 429, logs warning, and seamlessly falls over to Groq or Offline Evaluator. | Seamless completion without interruption; provider recorded as fallback. |
| **Provider Timeout (>15s)** | Remote AI service latency spike | Timeout handler aborts HTTP request and attempts secondary tier. | Seamless fallback; duration recorded in `execution_duration_ms`. |
| **Malformed JSON Output** | Model outputs markdown fences or partial JSON | Sanitizer strips code fences and repairs braces; if Pydantic validation fails, failover provider is invoked. | Clean, structured report delivered; zero JSON parsing crashes. |
| **Complete Pipeline Failure** | All cloud APIs down and unrecoverable system exception | `ai_reviews.status` marked as `failed`; `error_message` stored; `projects.status` reverted to `ready`. | Clear error banner with exact failure reason and dominant "Retry Review" button. |

---

## 2. Idempotency & Concurrency Protection

- **Duplicate Request Defense**:
  If a user double-clicks "Start AI Review" or two simultaneous requests arrive for the same project:
  ```python
  active_review = self.repo.get_active_ai_review(project_id)
  if active_review:
      return active_review
  ```
  The server detects the active session in `queued` or `processing` state and returns the existing review ID. No duplicate tokens are consumed.

---

## 3. Graceful Failure & State Recovery

When an unrecoverable exception occurs:
1. `ai_reviews` record is updated:
   - `status = 'failed'`
   - `error_message = str(exception_detail)`
   - `completed_at = now()`
2. `projects` record is reverted:
   - `status = 'ready'` (unblocked from `in_review`)
3. The frontend displays the actual error message and enables the "Retry Review" button.
4. No synthetic, fake feedback is ever generated to conceal errors.

