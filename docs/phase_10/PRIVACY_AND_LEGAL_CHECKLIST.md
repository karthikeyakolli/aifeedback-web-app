# Phase 10: Privacy, Regulatory & Legal Readiness Checklist

## 1. Compliance Audit & Scope

> [!NOTE]
> This document identifies legal and compliance requirements based on technical architecture.
> Formal sign-off requires qualified legal counsel review before commercial launch.

---

## 2. Core Privacy Disclosures

| Requirement | Implementation in Architecture | Legal Counsel Review Required |
| :--- | :--- | :--- |
| **Privacy Policy** | Explicit disclosures regarding data storage, model training boundaries, and third-party AI APIs. | Yes |
| **Terms of Service** | User-generated project code ownership, limitation of liability on AI recommendations, and acceptable use. | Yes |
| **AI Data Processing Disclosure** | Disclose that project architectural details are processed by Google Gemini API under zero-retention / enterprise terms. | Yes |
| **Data Retention & Deletion (GDPR Art. 17)** | "Delete Project" cascadingly removes project, attachments, reviews, and findings from database. Account deletion purges profile. | Yes |
| **Zero Model Training on Customer Code** | Confirm with AI API terms (Google Gemini API / Groq API) that customer payloads are NOT used for foundation model training. | Yes |
| **Cookie & Session Disclosures** | Authentication uses secure `HttpOnly` JWT / LocalStorage tokens strictly for authentication and space state. Zero advertising trackers. | Yes |

---

## 3. User Data Deletion Process (Technical Implementation)

When a user requests account or project deletion:
1. **Project Deletion**:
   - `DELETE /api/v1/projects/{id}`:
   - Foreign key cascade drops all related rows in `feedback_reports`, `feedback_findings`, `ai_reviews`, and `project_upvotes`.
   - Any uploaded artifacts in `project_attachments` are unlinked from storage.
2. **Account Deletion**:
   - Drops `profiles` record.
   - Cascades all user projects, posts, comments, bookmarks, and chat turns.

