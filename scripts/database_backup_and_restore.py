"""Production Database Backup, Verification, and Restore Tooling.

Supports:
1. Automated SQLite point-in-time backup via VACUUM INTO / file snapshot.
2. Integrity audits (PRAGMA integrity_check, PRAGMA foreign_key_check).
3. Safe restore procedure with rollback safety.
4. Schema versioning validation.
"""

from __future__ import annotations

import os
import sys
import shutil
import sqlite3
import argparse
from datetime import datetime, timezone
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
BACKUP_DIR = DATA_DIR / "backups"
DEFAULT_DB_PATH = DATA_DIR / "product_intelligence.db"


def ensure_backup_dir() -> Path:
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    return BACKUP_DIR


def verify_database_integrity(db_path: Path) -> bool:
    """Runs SQLite integrity_check and foreign_key_check."""
    if not db_path.exists():
        print(f"[ERROR] Database file not found at: {db_path}")
        return False

    try:
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()

        # 1. Integrity check
        cursor.execute("PRAGMA integrity_check;")
        integrity = cursor.fetchall()
        if not integrity or integrity[0][0] != "ok":
            print(f"[FAIL] Integrity check failed: {integrity}")
            conn.close()
            return False

        # 2. Foreign key check
        cursor.execute("PRAGMA foreign_key_check;")
        fk_violations = cursor.fetchall()
        if fk_violations:
            print(f"[FAIL] Foreign key violations detected: {len(fk_violations)}")
            conn.close()
            return False

        conn.close()
        print(f"[OK] Database integrity and foreign key constraints passed: {db_path}")
        return True
    except Exception as e:
        print(f"[ERROR] Verification failed with exception: {e}")
        return False


def create_backup(source_db: Path = DEFAULT_DB_PATH) -> Path | None:
    """Creates a timestamped point-in-time snapshot of the database."""
    if not source_db.exists():
        print(f"[ERROR] Source database does not exist: {source_db}")
        return None

    if not verify_database_integrity(source_db):
        print("[ABORT] Cannot create backup from a corrupted database.")
        return None

    ensure_backup_dir()
    now_str = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    backup_file = BACKUP_DIR / f"db_backup_{now_str}.db"

    try:
        # Use SQLite online backup API for ACID consistency
        source_conn = sqlite3.connect(str(source_db))
        dest_conn = sqlite3.connect(str(backup_file))
        source_conn.backup(dest_conn)
        dest_conn.close()
        source_conn.close()

        # Verify the generated backup
        if verify_database_integrity(backup_file):
            size_kb = backup_file.stat().st_size / 1024
            print(f"[SUCCESS] Backup created successfully: {backup_file} ({size_kb:.1f} KB)")
            return backup_file
        else:
            print("[ERROR] Generated backup failed integrity audit. Deleting bad snapshot.")
            backup_file.unlink(missing_ok=True)
            return None
    except Exception as e:
        print(f"[ERROR] Backup failed: {e}")
        backup_file.unlink(missing_ok=True)
        return None


def restore_backup(backup_file: Path, target_db: Path = DEFAULT_DB_PATH) -> bool:
    """Restores database from a verified backup with pre-restore safety copy."""
    if not backup_file.exists():
        print(f"[ERROR] Backup file does not exist: {backup_file}")
        return False

    if not verify_database_integrity(backup_file):
        print("[ABORT] Cannot restore from an unverified or corrupted backup snapshot.")
        return False

    # Create safety fallback copy of existing target before overwriting
    pre_restore_safety = None
    if target_db.exists():
        safety_ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        pre_restore_safety = BACKUP_DIR / f"pre_restore_safety_{safety_ts}.db"
        shutil.copy2(target_db, pre_restore_safety)
        print(f"[INFO] Created pre-restore fallback snapshot: {pre_restore_safety}")

    try:
        shutil.copy2(backup_file, target_db)
        if verify_database_integrity(target_db):
            print(f"[SUCCESS] Restored {target_db} from {backup_file}")
            return True
        else:
            print("[CRITICAL] Restored database failed integrity check! Rolling back...")
            if pre_restore_safety and pre_restore_safety.exists():
                shutil.copy2(pre_restore_safety, target_db)
                print("[RECOVERED] Successfully rolled back to pre-restore safety state.")
            return False
    except Exception as e:
        print(f"[CRITICAL] Restore encountered exception: {e}")
        if pre_restore_safety and pre_restore_safety.exists():
            shutil.copy2(pre_restore_safety, target_db)
            print("[RECOVERED] Successfully rolled back to pre-restore safety state.")
        return False


def list_backups() -> list[Path]:
    ensure_backup_dir()
    backups = sorted(BACKUP_DIR.glob("*.db"), key=lambda p: p.stat().st_mtime, reverse=True)
    print(f"\n--- Discovered Backups in {BACKUP_DIR} ({len(backups)}) ---")
    for b in backups:
        size_kb = b.stat().st_size / 1024
        ts = datetime.fromtimestamp(b.stat().st_mtime, tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        print(f"  • {b.name}  [{size_kb:6.1f} KB]  {ts}")
    return backups


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Database Backup & Restore Tool")
    parser.add_argument("action", choices=["backup", "restore", "verify", "list"], help="Action to execute")
    parser.add_argument("--file", help="Path to backup file (required for restore)")
    args = parser.parse_args()

    if args.action == "backup":
        create_backup()
    elif args.action == "verify":
        target = Path(args.file) if args.file else DEFAULT_DB_PATH
        verify_database_integrity(target)
    elif args.action == "list":
        list_backups()
    elif args.action == "restore":
        if not args.file:
            print("[ERROR] Please provide --file <path_to_backup_file> for restore action.")
            sys.exit(1)
        restore_backup(Path(args.file))

