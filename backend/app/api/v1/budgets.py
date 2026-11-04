"""API routes for AI Spending Budgets and Hard Limits (Phase 12 / P2-1)."""

from __future__ import annotations
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, ConfigDict, AliasChoices

from backend.app.services.auth_service import get_current_user_required
from backend.app.services.budget_service import budget_service
from backend.app.db.project_repository import project_repo

router = APIRouter(prefix="/budgets", tags=["Budgets"])


def get_user_id(user_claims: dict) -> str:
    return user_claims.get("sub") or user_claims.get("id")


class BudgetUpdateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    scope: str = Field("account", pattern="^(account|project|task)$")
    project_id: Optional[str] = Field(None, validation_alias=AliasChoices("projectId", "project_id"))
    monthly_limit_usd: float = Field(..., validation_alias=AliasChoices("monthlyLimitUsd", "monthly_limit_usd"), ge=0.0)
    warning_threshold_pct: float = Field(80.0, validation_alias=AliasChoices("warningThresholdPct", "warning_threshold_pct"), ge=1.0, le=100.0)
    hard_stop_enabled: bool = Field(True, validation_alias=AliasChoices("hardStopEnabled", "hard_stop_enabled"))


class BudgetResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    user_id: str = Field(..., validation_alias=AliasChoices("userId", "user_id"), serialization_alias="userId")
    project_id: Optional[str] = Field(None, validation_alias=AliasChoices("projectId", "project_id"), serialization_alias="projectId")
    scope: str
    monthly_limit_usd: float = Field(..., validation_alias=AliasChoices("monthlyLimitUsd", "monthly_limit_usd"), serialization_alias="monthlyLimitUsd")
    current_period_spend_usd: float = Field(..., validation_alias=AliasChoices("currentPeriodSpendUsd", "current_period_spend_usd"), serialization_alias="currentPeriodSpendUsd")
    reserved_spend_usd: float = Field(..., validation_alias=AliasChoices("reservedSpendUsd", "reserved_spend_usd"), serialization_alias="reservedSpendUsd")
    warning_threshold_pct: float = Field(..., validation_alias=AliasChoices("warningThresholdPct", "warning_threshold_pct"), serialization_alias="warningThresholdPct")
    percentage_used: float = Field(..., validation_alias=AliasChoices("percentageUsed", "percentage_used"), serialization_alias="percentageUsed")
    is_warning_active: bool = Field(..., validation_alias=AliasChoices("isWarningActive", "is_warning_active"), serialization_alias="isWarningActive")
    hard_stop_enabled: bool = Field(..., validation_alias=AliasChoices("hardStopEnabled", "hard_stop_enabled"), serialization_alias="hardStopEnabled")
    current_period_start: str = Field(..., validation_alias=AliasChoices("currentPeriodStart", "current_period_start"), serialization_alias="currentPeriodStart")
    updated_at: str = Field(..., validation_alias=AliasChoices("updatedAt", "updated_at"), serialization_alias="updatedAt")


@router.get("", response_model=List[BudgetResponse])
def list_user_budgets(current_user: dict = Depends(get_current_user_required)):
    """Lists all active and configured AI spending budgets for the authenticated account."""
    user_id = get_user_id(current_user)
    return budget_service.get_user_budgets(user_id)


@router.get("/account", response_model=BudgetResponse)
def get_account_budget(current_user: dict = Depends(get_current_user_required)):
    """Retrieves account-wide AI monthly spending limit and current period utilization."""
    user_id = get_user_id(current_user)
    return budget_service.get_or_create_budget(user_id=user_id, scope="account")


@router.put("", response_model=BudgetResponse)
def update_budget(payload: BudgetUpdateRequest, current_user: dict = Depends(get_current_user_required)):
    """Configures spending limits, warning thresholds, and hard spending stops for account, project, or task."""
    user_id = get_user_id(current_user)
    if payload.scope == "project" and payload.project_id:
        _ = project_repo.get_project(payload.project_id, requesting_user_id=user_id)

    return budget_service.update_budget_limit(
        user_id=user_id,
        monthly_limit_usd=payload.monthly_limit_usd,
        scope=payload.scope,
        project_id=payload.project_id,
        hard_stop_enabled=payload.hard_stop_enabled,
        warning_threshold_pct=payload.warning_threshold_pct,
    )
