# PRODUCTION BACKUP AND RECOVERY RUNBOOK
**Project:** AI Project Feedback  
**Milestone:** Phase 14 — Final System Completion & Permanent Engineering Closure  
**Version:** 1.0.0 (Production Release)  
**Status:** AUTHORITATIVE OPERATIONAL RUNBOOK

---

## 1. Backup Strategy & Objectives

### RPO & RTO Targets
- **Recovery Point Objective (RPO):** < 5 minutes (continuous WAL streaming on Supabase PostgreSQL; hourly snapshot archiving).
- **Recovery Time Objective (RTO):** < 15 minutes (automated database restoration and health verification).

### Backup Types & Schedules
1. **Continuous WAL Archiving**: Managed continuously by Supabase engine allowing Point-In-Time-Recovery (PITR) up to 30 days.
2. **Automated Daily Logical Dumps (`pg_dump`)**: Generated daily at 02:00 UTC and replicated across secondary geographic S3 buckets with server-side AES-256 encryption.
3. **Local Development WAL Backups**: Performed via automated verification scripts in `scripts/verify_backup_and_recovery.py`.

---

## 2. Automated Logical Backup Execution

### Creating a Full Logical Backup (PostgreSQL)
```bash
#!/bin/bash
set -euo pipefail

BACKUP_DATE=$(date -u +"%Y%m%d_%H%M%SZ")
BACKUP_DIR="/var/backups/aifeedback"
BACKUP_FILE="${BACKUP_DIR}/aifeedback_backup_${BACKUP_DATE}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "Starting logical database dump at $(date -u)..."

# Execute pg_dump directly against primary database connection (bypassing pooler for schema dump)
pg_dump "${DATABASE_DIRECT_URL}" \
    --format=plain \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    | gzip -9 > "${BACKUP_FILE}"

echo "Backup completed: ${BACKUP_FILE} ($(du -h "${BACKUP_FILE}" | cut -f1))"

# Replicate to offsite encrypted object storage
aws s3 cp "${BACKUP_FILE}" "s3://aifeedback-backups-vault/daily/${BACKUP_DATE}.sql.gz" --sse AES256

echo "Backup replicated to offsite S3 vault."
```

---

## 3. Restoration & Disaster Recovery Procedure

### Step 3.1: Complete Database Restoration from Logical Dump
```bash
#!/bin/bash
set -euo pipefail

RESTORE_FILE="$1"

if [ -z "${RESTORE_FILE}" ] || [ ! -f "${RESTORE_FILE}" ]; then
    echo "ERROR: Valid backup archive must be provided as first argument."
    exit 1
fi

echo "WARNING: Restoring ${RESTORE_FILE} into production database..."
read -p "Type 'RESTORE' to proceed: " CONFIRM
if [ "${CONFIRM}" != "RESTORE" ]; then
    echo "Aborted."
    exit 0
fi

# Decompress and execute restoration via psql
gunzip -c "${RESTORE_FILE}" | psql "${DATABASE_DIRECT_URL}"

echo "Restoration script executed successfully."
```

### Step 3.2: Verification of Restored Integrity
Immediately execute the automated verification script:
```bash
python scripts/verify_backup_and_recovery.py
```
This script validates:
1. Foreign key integrity across all 40 relational tables.
2. Presence and decodability of `profiles`, `projects`, and `feedback_reports`.
3. Valid decryption of sample encrypted credential in `user_ai_credentials`.
4. Consistent row counts and matching SHA-256 snapshot hashes in `project_source_snapshots`.

---

## 4. Local Development Backup & WAL Snapshotting

For developer machines or standalone staging instances using SQLite:
- SQLite runs in **WAL Mode** (`PRAGMA journal_mode = WAL`).
- Before copying or backing up `data/product_intelligence.db`, checkpoint the WAL buffer to prevent partial reads:
```python
import sqlite3

conn = sqlite3.connect("data/product_intelligence.db")
conn.execute("PRAGMA wal_checkpoint(TRUNCATE);")
conn.close()
```
- The resulting `.db` file is a fully consistent, restorable point-in-time snapshot.
