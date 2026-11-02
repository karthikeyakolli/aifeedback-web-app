# Phase 8: Public Data Projection Specification

## 1. Zero Data Leakage Architecture
Public endpoints must never return raw database records or internal entity structures.
All data traversing the public boundary passes through a strict **Server-Side Data Projection** layer implemented in Python Pydantic schemas and repository serialization methods.

---

## 2. Public vs. Private Field Comparison

| Field Name | Database Column | Personal / Private View | Public Projection (`PublicProjectRead`) | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `projects.id` | Included | Included | Public identifier for URL routing. |
| `name` | `projects.name` | Included | Included | Display title. |
| `tagline` | `projects.tagline` | Included | Included | Short problem summary. |
| `description` | `projects.description` | Included | Included | Architecture specification for review. |
| `category` | `projects.category` | Included | Included | Project domain classification. |
| `repository_url` | `projects.repository_url`| Included | Included | Public source code reference. |
| `demo_url` | `projects.demo_url` | Included | Included | Prototype URL. |
| `status` | `projects.status` | Included | Included | Stage: draft, in_review, reviewed, improved. |
| `is_public` | `projects.is_public` | Included | Fixed `True` | Confirms public visibility. |
| `upvotes_count` | `projects.upvotes_count` | Included | Included | Aggregated appreciation count. |
| `reviews_count` | `projects.reviews_count` | Included | Included | Number of completed AI reviews. |
| `created_at` | `projects.created_at` | Included | Included | Project creation date. |
| `updated_at` | `projects.updated_at` | Included | Included | Last modified date. |
| **`user_id`** | `projects.user_id` | **Included** | **STRICTLY EXCLUDED** | **Prevents linking projects to private accounts or tracking creators.** |
| **`creator_notes`** | `projects.notes` | **Included** | **STRICTLY EXCLUDED** | **Private scratch notes.** |
| **`raw_prompt_logs`**| `ai_reviews.*` | **Included** | **STRICTLY EXCLUDED** | **Internal prompt engineering telemetry.** |
| **`error_messages`**| `ai_reviews.error_message` | **Included** | **STRICTLY EXCLUDED** | **Infrastructure operational diagnostics.** |

---

## 3. Public Feedback Report Projection

When viewing a public feedback report via `GET /api/v1/projects/public/{id}/report`:
1. **Allowed Report Fields**:
   - `id`, `reviewId`, `projectId`
   - `executiveSummary`
   - `strengthsSummary`
   - `totalFindingsCount`, `blockersCount`, `highCount`, `mediumCount`, `lowCount`
   - `createdAt`
2. **Allowed Finding Fields**:
   - `id`, `reportId`, `projectId`
   - `title`, `severity`, `category`
   - `observation`
   - `evidenceQuote`
   - `recommendation`
3. **Quarantined Fields**:
   - `ai_reviews.user_id`
   - `ai_reviews.input_token_count`
   - `ai_reviews.output_token_count`
   - `ai_reviews.execution_duration_ms`

---

## 4. Implementation Reference

```python
def _serialize_public_project(self, row: sqlite3.Row) -> Dict[str, Any]:
    """Server-side public data projection: strictly excludes internal user_id."""
    return {
        "id": row["id"],
        "name": row["name"],
        "tagline": row["tagline"],
        "description": row["description"],
        "category": row["category"],
        "repositoryUrl": row["repository_url"],
        "demoUrl": row["demo_url"],
        "status": row["status"],
        "isPublic": True,
        "upvotesCount": row["upvotes_count"],
        "reviewsCount": row["reviews_count"],
        "creatorUsername": None,
        "creatorDisplayName": None,
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }
```

