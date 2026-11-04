"""AI Budget Enforcement and Reservation Service (Phase 12 / P2-1).

Provides:
- Account-level, project-level, and task-level spending limits.
- Pre-execution atomic cost reservations to prevent concurrent runaway spending.
- Post-execution reconciliation against ai_usage_ledger actuals.
- Hard spending stop enforcement with HTTP 402/403 rejection.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import HTTPException, status
from backend.app.db.connection import db_manager

logger = logging.getLogger(__name__)

DEFAULT_MONTHLY_LIMIT_USD = 20.00
DEFAULT_WARNING_THRESHOLD_PCT = 80.00


class BudgetExceededError(HTTPException):
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=detail,
        )


class BudgetService:
    """Manages spending budgets, pre-flight spend reservation, and ledger reconciliation."""

    def __init__(self) -> None:
        self.db = db_manager

    def _utc_now(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    def get_budget_or_none(
        self,
        user_id: str,
        scope: str = "account",
        project_id: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Retrieves an existing budget if present without auto-creating."""
        with self.db.session() as conn:
            query = "SELECT * FROM ai_budgets WHERE user_id = ? AND scope = ?"
            params: list[Any] = [user_id, scope]
            if project_id and scope in ("project", "task"):
                query += " AND project_id = ?"
                params.append(project_id)
            else:
                query += " AND project_id IS NULL"
            row = conn.execute(query, tuple(params)).fetchone()
            return self._format_budget(row) if row else None

    def get_user_budgets(self, user_id: str) -> List[Dict[str, Any]]:
        """Lists all configured spending budgets (account, project, task) for a user."""
        with self.db.session() as conn:
            rows = conn.execute(
                "SELECT * FROM ai_budgets WHERE user_id = ? ORDER BY scope ASC, created_at DESC",
                (user_id,),
            ).fetchall()
            return [self._format_budget(r) for r in rows]

    def get_or_create_budget(
        self,
        user_id: str,
        scope: str = "account",
        project_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Retrieves or initializes a budget for user account or specific project."""
        now = self._utc_now()
        with self.db.session() as conn:
            query = "SELECT * FROM ai_budgets WHERE user_id = ? AND scope = ?"
            params: list[Any] = [user_id, scope]
            if project_id and scope == "project":
                query += " AND project_id = ?"
                params.append(project_id)
            else:
                query += " AND project_id IS NULL"

            row = conn.execute(query, tuple(params)).fetchone()
            if row:
                return self._format_budget(row)

            # Create default budget
            budget_id = f"bgt_{uuid.uuid4().hex[:12]}"
            conn.execute(
                """
                INSERT INTO ai_budgets (
                    id, user_id, project_id, scope, monthly_limit_usd, warning_threshold_pct,
                    hard_stop_enabled, current_period_start, current_period_spend_usd,
                    reserved_spend_usd, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, 0.0, 0.0, ?, ?)
                """,
                (
                    budget_id, user_id, project_id if scope == "project" else None, scope,
                    DEFAULT_MONTHLY_LIMIT_USD, DEFAULT_WARNING_THRESHOLD_PCT, now, now, now,
                ),
            )

            new_row = conn.execute("SELECT * FROM ai_budgets WHERE id = ?", (budget_id,)).fetchone()
            return self._format_budget(new_row)

    def check_and_reserve_budget(
        self,
        user_id: str,
        project_id: Optional[str] = None,
        estimated_cost_usd: float = 0.005,
        task_type: str = "review",
    ) -> str:
        """Pre-flight check: verifies budget limits and atomically reserves estimated cost.
        
        Raises BudgetExceededError if hard_stop_enabled and limit would be breached.
        Returns a reservation token string.
        """
        # 1. Check Account Budget
        account_budget = self.get_or_create_budget(user_id=user_id, scope="account")
        total_account_committed = account_budget["currentPeriodSpendUsd"] + account_budget["reservedSpendUsd"]

        if account_budget["hardStopEnabled"] and (total_account_committed + estimated_cost_usd > account_budget["monthlyLimitUsd"]):
            raise BudgetExceededError(
                f"Account AI spending limit exceeded. Monthly limit is ${account_budget['monthlyLimitUsd']:.2f}, "
                f"committed spend is ${total_account_committed:.4f}. Request blocked by hard limit."
            )

        # 2. Check Project Budget if project_id is provided
        if project_id:
            proj_budget = self.get_or_create_budget(user_id=user_id, scope="project", project_id=project_id)
            total_proj_committed = proj_budget["currentPeriodSpendUsd"] + proj_budget["reservedSpendUsd"]
            if proj_budget["hardStopEnabled"] and (total_proj_committed + estimated_cost_usd > proj_budget["monthlyLimitUsd"]):
                raise BudgetExceededError(
                    f"Project AI spending limit exceeded. Project limit is ${proj_budget['monthlyLimitUsd']:.2f}, "
                    f"committed spend is ${total_proj_committed:.4f}. Request blocked by hard limit."
                )

        # 3. Check Task-specific Budget if configured
        if task_type:
            task_budget = self.get_budget_or_none(user_id=user_id, scope="task", project_id=project_id)
            if task_budget and task_budget["hardStopEnabled"]:
                total_task_committed = task_budget["currentPeriodSpendUsd"] + task_budget["reservedSpendUsd"]
                if total_task_committed + estimated_cost_usd > task_budget["monthlyLimitUsd"]:
                    raise BudgetExceededError(
                        f"Task '{task_type}' AI spending limit exceeded. Task limit is ${task_budget['monthlyLimitUsd']:.2f}, "
                        f"committed spend is ${total_task_committed:.4f}. Request blocked by hard limit."
                    )

        # 4. Atomically reserve estimated cost on account (and project/task)
        now = self._utc_now()
        with self.db.session() as conn:
            conn.execute(
                "UPDATE ai_budgets SET reserved_spend_usd = reserved_spend_usd + ?, updated_at = ? WHERE id = ?",
                (estimated_cost_usd, now, account_budget["id"]),
            )
            if project_id:
                conn.execute(
                    "UPDATE ai_budgets SET reserved_spend_usd = reserved_spend_usd + ?, updated_at = ? WHERE user_id = ? AND scope = 'project' AND project_id = ?",
                    (estimated_cost_usd, now, user_id, project_id),
                )
            if task_type:
                conn.execute(
                    "UPDATE ai_budgets SET reserved_spend_usd = reserved_spend_usd + ?, updated_at = ? WHERE user_id = ? AND scope = 'task' AND (project_id = ? OR (project_id IS NULL AND ? IS NULL))",
                    (estimated_cost_usd, now, user_id, project_id, project_id),
                )

        reservation_token = f"resv_{uuid.uuid4().hex[:12]}:{estimated_cost_usd}"
        logger.info("Reserved $%f for user %s on task %s (token: %s)", estimated_cost_usd, user_id, task_type, reservation_token)
        return reservation_token

    def reconcile_reservation(
        self,
        user_id: str,
        reservation_token: Optional[str],
        actual_cost_usd: float,
        project_id: Optional[str] = None,
    ) -> None:
        """Post-execution: releases the reservation and records final actual cost."""
        if not reservation_token:
            return

        try:
            reserved_amount = float(reservation_token.split(":")[1])
        except Exception:
            reserved_amount = 0.005

        now = self._utc_now()
        with self.db.session() as conn:
            # Reconcile account budget
            conn.execute(
                """
                UPDATE ai_budgets
                SET reserved_spend_usd = max(0.0, reserved_spend_usd - ?),
                    current_period_spend_usd = current_period_spend_usd + ?,
                    updated_at = ?
                WHERE user_id = ? AND scope = 'account'
                """,
                (reserved_amount, actual_cost_usd, now, user_id),
            )
            # Reconcile project budget if applicable
            if project_id:
                conn.execute(
                    """
                    UPDATE ai_budgets
                    SET reserved_spend_usd = max(0.0, reserved_spend_usd - ?),
                        current_period_spend_usd = current_period_spend_usd + ?,
                        updated_at = ?
                    WHERE user_id = ? AND scope = 'project' AND project_id = ?
                    """,
                    (reserved_amount, actual_cost_usd, now, user_id, project_id),
                )

        logger.info("Reconciled reservation for user %s: released $%f, recorded actual $%f", user_id, reserved_amount, actual_cost_usd)

    def update_budget_limit(
        self,
        user_id: str,
        monthly_limit_usd: float,
        scope: str = "account",
        project_id: Optional[str] = None,
        hard_stop_enabled: bool = True,
        warning_threshold_pct: float = 80.00,
    ) -> Dict[str, Any]:
        """Configures or updates a user's monthly spending limit and threshold."""
        now = self._utc_now()
        bgt = self.get_or_create_budget(user_id=user_id, scope=scope, project_id=project_id)
        with self.db.session() as conn:
            conn.execute(
                """
                UPDATE ai_budgets
                SET monthly_limit_usd = ?,
                    hard_stop_enabled = ?,
                    warning_threshold_pct = ?,
                    updated_at = ?
                WHERE id = ?
                """,
                (monthly_limit_usd, 1 if hard_stop_enabled else 0, warning_threshold_pct, now, bgt["id"]),
            )
        return self.get_or_create_budget(user_id=user_id, scope=scope, project_id=project_id)

    def _format_budget(self, row: Any) -> Dict[str, Any]:
        spend = float(row["current_period_spend_usd"])
        limit = float(row["monthly_limit_usd"])
        pct_used = round((spend / max(0.01, limit)) * 100.0, 1)
        warn_pct = float(row["warning_threshold_pct"])
        return {
            "id": row["id"],
            "userId": row["user_id"],
            "projectId": row["project_id"],
            "scope": row["scope"],
            "monthlyLimitUsd": limit,
            "currentPeriodSpendUsd": spend,
            "reservedSpendUsd": float(row["reserved_spend_usd"]),
            "warningThresholdPct": warn_pct,
            "percentageUsed": pct_used,
            "isWarningActive": pct_used >= warn_pct,
            "hardStopEnabled": bool(row["hard_stop_enabled"]),
            "currentPeriodStart": row["current_period_start"],
            "updatedAt": row["updated_at"],
        }


budget_service = BudgetService()

