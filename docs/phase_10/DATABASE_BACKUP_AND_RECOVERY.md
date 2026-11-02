# Phase 10: Database Backup, Recovery & Migration Safety

## 1. Migration Strategy & Ordering

All database modifications follow strict declarative migrations stored under `supabase/migrations/`:

| Migration File | Target Subsystem | Safety Classification |
| :--- | :--- | :--- |
| `00001_initial_community_schema.sql` | Profiles, Posts, Comments | Additive (Safe) |
| `00002_harden_rls_and_voting_policies.sql` | RLS Security Policies | Non-destructive (Safe) |
| `00003_analysis_runs_persistence.sql` | Analysis Runs | Additive (Safe) |
| `00004_research_conversations.sql` | Research Chat Sessions | Additive (Safe) |
| `00005_research_reports.sql` | Research Reports & PRDs | Additive (Safe) |
| `00006_post_documents_and_notifications.sql` | Document Storage & Alerts | Additive (Safe) |
| `00007_projects_and_ai_feedback_foundation.sql` | Projects, AI Reviews, Findings | Additive (Safe) |
| `00008_public_and_creator_spaces.sql` | Upvotes, Creator Profiles, Scrutiny | Additive (Safe) |

> [!IMPORTANT]
> **Zero Destructive Migrations**: All migrations use `IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, and additive policies. Column drops or table drops require a multi-stage migration with backup verification.

---

## 2. Backup & Restore Tooling

The operational script [`scripts/database_backup_and_restore.py`](file:///c:/Users/OMEN/.gemini/antigravity-ide/scratch/ai%20web%20application/scripts/database_backup_and_restore.py) automates database protection:

### Creating a Point-in-Time Backup
```bash
python scripts/database_backup_and_restore.py backup
```
- Performs a pre-backup integrity check (`PRAGMA integrity_check`, `PRAGMA foreign_key_check`).
- Uses SQLite online backup API for ACID atomic consistency without locking read queries.
- Saves snapshot to `data/backups/db_backup_YYYYMMDD_HHMMSS.db`.
- Verifies post-backup integrity.

### Listing Backups
```bash
python scripts/database_backup_and_restore.py list
```

### Restoring from Backup
```bash
python scripts/database_backup_and_restore.py restore --file data/backups/db_backup_20261102_165735.db
```
- Creates an automatic pre-restore safety snapshot before modifying target.
- Validates the target database post-restore.
- Automatically rolls back to safety snapshot if post-restore verification fails.

---

## 3. Production Supabase / PostgreSQL Backup Runbook

In production PostgreSQL (Supabase):
1. **Automated Daily Backups**: Managed by Supabase WAL-G automated backups with 7-day retention.
2. **Pre-Deployment Physical Snapshot**:
   ```bash
   pg_dump --clean --if-exists --no-owner --no-privileges -h db.[REF].supabase.co -U postgres postgres > pre_deploy_backup_$(date +%Y%m%d_%H%M%S).sql
   ```
3. **Emergency Point-in-Time Recovery**:
   - Initiated via Supabase CLI or management dashboard.
   - Point-in-time recovery (PITR) allows restoration to any second within the past 7 days.

