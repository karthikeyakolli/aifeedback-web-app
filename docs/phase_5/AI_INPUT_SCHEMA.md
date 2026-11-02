# Phase 5: AI Review Engine Input Schema & Validation

## 1. Specification Overview

The AI Review Engine accepts a strictly defined, versioned payload for project evaluation. It derives project context directly from server-verified database records rather than relying on unvetted client inputs.

---

## 2. API Request Schema (`AIReviewStartRequest`)

The endpoint `POST /api/v1/projects/{project_id}/review/start` accepts the following optional configuration parameters:

```json
{
  "focus_areas": ["security", "architecture"],
  "model_override": null
}
```

### 2.1. Parameter Reference

| Field | Type | Required | Default | Validation & Rules |
| :--- | :--- | :--- | :--- | :--- |
| `focus_areas` | `List[str]` | Optional | `[]` | Allowed items: `'security'`, `'architecture'`, `'performance'`, `'dx'`. Max 5 items. |
| `model_override` | `Optional[str]` | Optional | `None` | Restrictive whitelist: `'gemini-2.5-flash'`, `'gemini-1.5-flash'`, `'llama-3.3-70b-versatile'`. Unapproved models are ignored or rejected. |

---

## 3. Server-Resolved Project Input Context

The engine extracts verified project context from the `projects` table using the authenticated caller's identity:

```json
{
  "project_id": "proj_a1b2c3d4",
  "owner_user_id": "usr_98765432",
  "name": "Cloud Ledger Core",
  "tagline": "High-throughput transactional audit log service",
  "category": "infrastructure",
  "description": "Cloud Ledger Core is a distributed event-sourcing engine built with Python and PostgreSQL...",
  "repository_url": "https://github.com/example/cloud-ledger",
  "demo_url": "https://demo.cloudledger.dev"
}
```

### 3.1. Context Validation Invariants

1. **Minimum Context Length**:
   `len(project.description.strip()) >= 20`
   Projects with empty or trivial descriptions (< 20 characters) are rejected with `HTTP 400 Bad Request`.
2. **Category Whitelist**:
   Category must be one of the approved enum values:
   `'developer-tools'`, `'productivity'`, `'ai-ml'`, `'design-ux'`, `'saas-b2b'`, `'mobile'`, `'infrastructure'`.
3. **URL Format**:
   If present, `repository_url` and `demo_url` must match valid HTTP/HTTPS schemes.

---

## 4. Prompt Construction & Injection Defense

User text fields (`name`, `tagline`, `description`) are treated as untrusted user data:
- They are passed through `clean_input_text()` to normalize unicode, strip null bytes, and neutralize control sequences.
- In the LLM prompt, project content is encapsulated within dedicated XML demarcation tags (`<project_context>...</project_context>`).
- System instructions explicitly forbid the model from executing or obeying instructions embedded within the `<project_context>` tags.

