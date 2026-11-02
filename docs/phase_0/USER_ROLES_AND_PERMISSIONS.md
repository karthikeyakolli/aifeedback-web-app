# User Roles and Permissions Specification

> **Document Type**: Phase 0 Core Deliverable  
> **Status**: `CONFIRMED / AUDITED`  
> **Version**: 1.0.0  
> **Date**: November 2, 2026  
> **Audience**: Security Architecture, Engineering, Product Management  

---

## 1. User Roles

The platform defines five discrete user roles. Roles are enforced on the backend via cryptographic JWT claims and database Row-Level Security (RLS) policies.

| Role | Definition | Default Assigned When |
|---|---|---|
| **Anonymous Visitor (`VISITOR`)** | Unauthenticated user accessing the platform via web browser. | No session token present. |
| **Registered User (`USER`)** | Authenticated developer with verified account credentials. | Successful email/password or OAuth sign-in. |
| **Project Owner (`OWNER`)** | Contextual role: The registered user who created a specific project. | `project.user_id === auth.uid()`. |
| **Creator (`CREATOR`)** | Registered user actively managing a public showcase or executing AI diagnostics in Creator space. | Granted to all registered users upon creating a showcase. |
| **Staff Moderator (`MODERATOR`)** | Administrative user authorized to triage flagged content, inspect reports, and enforce platform standards. | Set in `profiles.is_moderator = true` via administrative migration. |

---

## 2. Granular Permissions Matrix

| Entity & Operation | Visitor | User (Non-Owner) | Project Owner | Creator | Moderator |
|---|---|---|---|---|---|
| **Public Projects** | | | | | |
| - Read / Browse Explore Feed | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| - Upvote / React | ❌ No | ✅ Yes (Rate-limited) | ✅ Yes | ✅ Yes | ✅ Yes |
| - Submit Public Review/Comment | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Personal Projects** | | | | | |
| - Create New Project Record | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| - Read Drafts & Context | ❌ No | ❌ No | ✅ Yes | ❌ No | ❌ No |
| - Update Project Details/Links | ❌ No | ❌ No | ✅ Yes | ❌ No | ❌ No |
| - Delete / Archive Project | ❌ No | ❌ No | ✅ Yes | ❌ No | ❌ No |
| **AI Reviews & Findings** | | | | | |
| - Trigger "Start AI Review" | ❌ No | ❌ No | ✅ Yes | ❌ No | ❌ No |
| - Read Detailed Findings & Quotes | ❌ No | ❌ No | ✅ Yes | ❌ No | ❌ No |
| - Mark Findings Addressed | ❌ No | ❌ No | ✅ Yes | ❌ No | ❌ No |
| **Creator Studio & AI Lab** | | | | | |
| - Access Creator Studio | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| - Run AI Benchmark Lab | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| - Publish / Unpublish Showcase | ❌ No | ❌ No | ❌ No | ✅ Yes | ❌ No |
| **Platform Administration** | | | | | |
| - View Moderation Queue | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Yes |
| - Hide / Remove Abusive Content | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Yes |

---

## 3. Row-Level Security (RLS) Policy Specifications

Database isolation is implemented using PostgreSQL Row-Level Security:

### Policy 1: Personal Projects RLS (`projects` table)
```sql
-- Read Access: Owner can read own projects; public can read if is_public = true
CREATE POLICY "Projects select policy" ON public.projects
FOR SELECT USING (
  auth.uid() = user_id OR is_public = true
);

-- Write Access: Only owner can insert or update
CREATE POLICY "Projects insert policy" ON public.projects
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Projects update policy" ON public.projects
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Projects delete policy" ON public.projects
FOR DELETE USING (auth.uid() = user_id);
```

### Policy 2: AI Feedback Reports & Findings RLS (`feedback_reports`, `feedback_findings`)
```sql
-- Reports inherit project ownership
CREATE POLICY "Feedback reports access" ON public.feedback_reports
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id AND (p.user_id = auth.uid() OR p.is_public = true)
  )
);
```

---

## 4. Space Switching Security Invariant

The client-side `SpaceContext` allows instantaneous navigation between `public`, `personal`, and `creator`.
- **Security Check**: Changing `currentSpace` in React state **DOES NOT** confer any elevated tokens, does not re-authenticate the user, and does not alter any database rows.
- If a visitor or non-owner attempts to fetch personal projects via API while in Personal space, the backend responds with `401 Unauthorized` or `403 Forbidden`.
- Client route guards (`RequireAuth`) automatically redirect unauthenticated visits to `/login` with return-url preservation.

