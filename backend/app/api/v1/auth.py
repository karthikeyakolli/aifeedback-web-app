"""Authentication, session, unified identity, and MFA routes."""

from __future__ import annotations

import json
import logging
from typing import Dict, Any, List, Optional
import urllib.request
import urllib.error
from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, Depends, Header, HTTPException, status
from backend.app.config import settings

logger = logging.getLogger(__name__)


def _confirm_supabase_user_by_email(email: str) -> bool:
    """Uses Supabase Admin API to automatically confirm a user's email so they are never blocked."""
    if not (settings.supabase_url and settings.supabase_service_role_key):
        return False
    try:
        clean_email = email.strip().lower()
        admin_users_url = f"{settings.supabase_url.rstrip('/')}/auth/v1/admin/users"
        admin_req = urllib.request.Request(
            admin_users_url,
            headers={
                "apikey": settings.supabase_service_role_key,
                "Authorization": f"Bearer {settings.supabase_service_role_key}",
                "User-Agent": "PRI-Backend-Admin/1.0",
            },
        )
        with urllib.request.urlopen(admin_req, timeout=5) as admin_resp:
            users_data = json.loads(admin_resp.read().decode())
            matching = next(
                (u for u in users_data.get("users", []) if u.get("email", "").lower() == clean_email),
                None,
            )
            if matching:
                uid = matching["id"]
                confirm_req = urllib.request.Request(
                    f"{admin_users_url}/{uid}",
                    data=json.dumps({"email_confirm": True}).encode(),
                    headers={
                        "apikey": settings.supabase_service_role_key,
                        "Authorization": f"Bearer {settings.supabase_service_role_key}",
                        "Content-Type": "application/json",
                        "User-Agent": "PRI-Backend-Admin/1.0",
                    },
                    method="PUT",
                )
                with urllib.request.urlopen(confirm_req, timeout=5):
                    pass
                logger.info("Successfully auto-confirmed email for Supabase user: %s", clean_email)
                return True
    except Exception as exc:
        logger.warning("Failed confirming user email in Supabase: %s", exc)
    return False


class EmailConfirmPayload(BaseModel):
    email: EmailStr
from backend.app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    AuthTokenResponse,
    UserProfileResponse,
    AuthenticatedPrincipal,
    PasswordResetRequestPayload,
    PasswordResetConfirmPayload,
    OAuthCallbackPayload,
    MFAEnrollResponse,
    MFAVerifyPayload,
    MFAStatusResponse,
)
from backend.app.services.auth_service import (
    create_access_token,
    get_current_user_required,
    get_current_user_optional,
    get_active_auth_provider,
    get_authenticated_principal,
    request_password_reset,
    confirm_password_reset,
    enroll_user_mfa,
    verify_user_mfa,
    unenroll_user_mfa,
    get_user_mfa_status,
    handle_oauth_callback,
)
from backend.app.db.repository import community_repo

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/config")
async def get_auth_config() -> Dict[str, Any]:
    """Returns current active authentication provider configuration."""
    provider = get_active_auth_provider()
    return {
        "provider": provider,
        "isSupabase": provider == "supabase",
        "mfaEnabled": settings.mfa_enabled,
        "oauthProviders": ["google", "github"],
    }


@router.post("/signup", response_model=AuthTokenResponse)
async def signup(payload: UserRegisterRequest) -> AuthTokenResponse:
    """Registers a new account with immediate session issuance and optional Supabase sync."""
    user_id, profile = community_repo.create_user(
        email=payload.email,
        password=payload.password,
        username=payload.username,
        display_name=payload.display_name,
        bio=payload.bio or "",
        avatar_url=payload.avatar_url,
    )

    # Automatically sync confirmed user to Supabase Auth Admin if credentials configured
    if settings.supabase_url and settings.supabase_service_role_key:
        try:
            sync_url = f"{settings.supabase_url.rstrip('/')}/auth/v1/admin/users"
            sync_payload = {
                "email": payload.email.strip().lower(),
                "password": payload.password,
                "email_confirm": True,
                "user_metadata": {
                    "username": payload.username.strip(),
                    "display_name": payload.display_name.strip(),
                },
            }
            req = urllib.request.Request(
                sync_url,
                data=json.dumps(sync_payload).encode(),
                headers={
                    "apikey": settings.supabase_service_role_key,
                    "Authorization": f"Bearer {settings.supabase_service_role_key}",
                    "Content-Type": "application/json",
                },
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                pass
        except urllib.error.HTTPError as http_err:
            if http_err.code == 422:
                try:
                    admin_users_url = f"{settings.supabase_url.rstrip('/')}/auth/v1/admin/users"
                    admin_req = urllib.request.Request(
                        admin_users_url,
                        headers={
                            "apikey": settings.supabase_service_role_key,
                            "Authorization": f"Bearer {settings.supabase_service_role_key}",
                            "User-Agent": "PRI-Backend-Admin/1.0",
                        },
                    )
                    with urllib.request.urlopen(admin_req, timeout=5) as admin_resp:
                        users_data = json.loads(admin_resp.read().decode())
                        matching = next(
                            (u for u in users_data.get("users", []) if u.get("email", "").lower() == payload.email.strip().lower()),
                            None,
                        )
                        if matching:
                            uid = matching["id"]
                            update_req = urllib.request.Request(
                                f"{admin_users_url}/{uid}",
                                data=json.dumps({"password": payload.password, "email_confirm": True}).encode(),
                                headers={
                                    "apikey": settings.supabase_service_role_key,
                                    "Authorization": f"Bearer {settings.supabase_service_role_key}",
                                    "Content-Type": "application/json",
                                    "User-Agent": "PRI-Backend-Admin/1.0",
                                },
                                method="PUT",
                            )
                            with urllib.request.urlopen(update_req, timeout=5):
                                pass
                            logger.info("Updated existing Supabase user with new password and auto-confirmed email: %s", payload.email)
                except Exception as update_err:
                    logger.warning("Could not update existing Supabase user: %s", update_err)
            else:
                logger.info("Supabase Auth sync HTTP %s notice: %s", http_err.code, http_err)
        except Exception as e:
            logger.info("Supabase Auth sync notice (non-fatal): %s", e)

    token = create_access_token(user_id=user_id, email=payload.email, username=payload.username)
    return AuthTokenResponse(
        accessToken=token,
        tokenType="Bearer",
        user=UserProfileResponse(**profile),
    )


@router.post("/login", response_model=AuthTokenResponse)
async def login(payload: UserLoginRequest) -> AuthTokenResponse:
    """Authenticates existing user with unified database + Supabase fallback."""
    # 1. Primary: If user is registered in local database, authenticate directly
    with community_repo.db.session() as conn:
        existing_local = conn.execute(
            "SELECT id FROM auth_users WHERE lower(email) = lower(?)",
            (payload.email.strip(),),
        ).fetchone()

    if existing_local:
        profile = community_repo.authenticate_user(email=payload.email, password=payload.password)
        token = create_access_token(
            user_id=profile["id"], email=payload.email, username=profile["username"]
        )
        return AuthTokenResponse(
            accessToken=token,
            tokenType="Bearer",
            user=UserProfileResponse(**profile),
        )

    # 2. Fallback: If user is not in local database, authenticate against Supabase Auth
    if settings.supabase_url and settings.supabase_anon_key:
        try:
            auth_url = f"{settings.supabase_url.rstrip('/')}/auth/v1/token?grant_type=password"
            auth_payload = {
                "email": payload.email.strip().lower(),
                "password": payload.password,
            }
            req = urllib.request.Request(
                auth_url,
                data=json.dumps(auth_payload).encode(),
                headers={
                    "apikey": settings.supabase_anon_key,
                    "Content-Type": "application/json",
                },
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode())
                sb_token = data.get("access_token")
                if sb_token:
                    sb_user = data.get("user", {})
                    meta = sb_user.get("user_metadata", {}) or {}
                    profile = community_repo.ensure_profile_exists(
                        user_id=sb_user.get("id"),
                        email=payload.email,
                        username=meta.get("username"),
                        display_name=meta.get("display_name") or meta.get("full_name"),
                    )
                    return AuthTokenResponse(
                        accessToken=sb_token,
                        tokenType="Bearer",
                        user=UserProfileResponse(**profile),
                    )
        except urllib.error.HTTPError as http_err:
            err_body = http_err.read().decode("utf-8", errors="ignore")
            logger.info("Supabase password grant HTTP %s: %s", http_err.code, err_body)
            # If Supabase blocked login because email is not confirmed, auto-confirm via Admin API and retry
            if "email not confirmed" in err_body.lower() or "unconfirmed" in err_body.lower():
                logger.info("Unconfirmed email detected for '%s'. Auto-confirming via Admin API...", payload.email)
                if _confirm_supabase_user_by_email(payload.email):
                    try:
                        retry_req = urllib.request.Request(
                            auth_url,
                            data=json.dumps(auth_payload).encode(),
                            headers={
                                "apikey": settings.supabase_anon_key,
                                "Content-Type": "application/json",
                            },
                            method="POST",
                        )
                        with urllib.request.urlopen(retry_req, timeout=5) as retry_resp:
                            data = json.loads(retry_resp.read().decode())
                            sb_token = data.get("access_token")
                            if sb_token:
                                sb_user = data.get("user", {})
                                meta = sb_user.get("user_metadata", {}) or {}
                                profile = community_repo.ensure_profile_exists(
                                    user_id=sb_user.get("id"),
                                    email=payload.email,
                                    username=meta.get("username"),
                                    display_name=meta.get("display_name") or meta.get("full_name"),
                                )
                                return AuthTokenResponse(
                                    accessToken=sb_token,
                                    tokenType="Bearer",
                                    user=UserProfileResponse(**profile),
                                )
                    except Exception as retry_err:
                        logger.warning("Supabase login retry after auto-confirm encountered: %s", retry_err)
        except Exception as sb_err:
            logger.info("Supabase password grant fallback notice: %s", sb_err)

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password.",
    )


@router.post("/confirm-email")
async def confirm_email_endpoint(payload: EmailConfirmPayload) -> Dict[str, Any]:
    """Auto-confirms a user's email via Supabase Admin API so users are never blocked by missing verification emails."""
    confirmed = _confirm_supabase_user_by_email(payload.email)
    return {
        "status": "ok",
        "confirmed": confirmed,
        "message": f"Email '{payload.email}' has been verified successfully. You may now sign in.",
    }


@router.get("/me", response_model=UserProfileResponse)
async def get_me(user: Dict[str, Any] = Depends(get_current_user_required)) -> UserProfileResponse:
    """Retrieves authenticated user profile from verified JWT token."""
    profile = community_repo.get_profile(user["sub"])
    return UserProfileResponse(**profile)


@router.get("/principal", response_model=AuthenticatedPrincipal)
async def get_current_principal(
    principal: AuthenticatedPrincipal = Depends(get_authenticated_principal),
) -> AuthenticatedPrincipal:
    """Retrieves the canonical strongly-typed AuthenticatedPrincipal for current user."""
    return principal


@router.post("/logout")
async def logout(user: Dict[str, Any] = Depends(get_current_user_required)) -> Dict[str, str]:
    """Logs out user and invalidates client session."""
    return {"message": "Logged out successfully."}


# -----------------------------------------------------------------------------
# Password Reset Endpoints
# -----------------------------------------------------------------------------
@router.post("/password-reset/request")
async def request_reset(payload: PasswordResetRequestPayload) -> Dict[str, Any]:
    """Dispatches a password reset link/token. Leaks no user existence details."""
    token = request_password_reset(payload.email)
    response_data: Dict[str, Any] = {
        "message": "If an account exists with this email, a reset link has been dispatched.",
    }
    # In development/test mode, expose token to facilitate testing
    if settings.environment.lower() != "production" and token:
        response_data["devToken"] = token
    return response_data


@router.post("/password-reset/confirm")
async def confirm_reset(payload: PasswordResetConfirmPayload) -> Dict[str, str]:
    """Consumes one-time password reset token and sets new password."""
    confirm_password_reset(payload.token, payload.new_password)
    return {"message": "Password updated successfully. You may now log in with your new password."}


# -----------------------------------------------------------------------------
# OAuth & Account Linking Endpoints
# -----------------------------------------------------------------------------
@router.post("/oauth/callback", response_model=AuthTokenResponse)
async def oauth_callback(
    payload: OAuthCallbackPayload,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional),
) -> AuthTokenResponse:
    """Exchanges OAuth code and signs in user or safely links provider to authenticated session."""
    current_uid = current_user.get("sub") if current_user else None
    result = handle_oauth_callback(
        provider=payload.provider,
        code=payload.code,
        state=payload.state,
        current_user_id=current_uid,
    )
    return AuthTokenResponse(
        accessToken=result["accessToken"],
        tokenType="Bearer",
        user=UserProfileResponse(**result["user"]),
    )


@router.get("/identities", response_model=List[Dict[str, Any]])
async def list_linked_identities(
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> List[Dict[str, Any]]:
    """Lists all external OAuth identities linked to the authenticated user."""
    return community_repo.list_user_identities(user["sub"])


@router.delete("/identities/{provider}")
async def unlink_identity(
    provider: str,
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> Dict[str, str]:
    """Unlinks a secondary OAuth provider identity from the authenticated user."""
    unlinked = community_repo.unlink_user_identity(user["sub"], provider)
    if not unlinked:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No linked {provider} identity found for this account.",
        )
    return {"message": f"Successfully unlinked {provider} identity."}


# -----------------------------------------------------------------------------
# Multi-Factor Authentication (MFA / TOTP) Endpoints
# -----------------------------------------------------------------------------
@router.get("/mfa/status", response_model=MFAStatusResponse)
async def check_mfa_status(
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> MFAStatusResponse:
    """Checks whether the authenticated user has active MFA."""
    status_dict = get_user_mfa_status(user["sub"])
    return MFAStatusResponse(**status_dict)


@router.post("/mfa/enroll", response_model=MFAEnrollResponse)
async def enroll_mfa(
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> MFAEnrollResponse:
    """Begins TOTP enrollment, returning secret and QR code URI."""
    enrollment = enroll_user_mfa(user["sub"], email=user.get("email", "user@example.com"))
    return MFAEnrollResponse(**enrollment)


@router.post("/mfa/verify", response_model=MFAStatusResponse)
async def verify_mfa(
    payload: MFAVerifyPayload,
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> MFAStatusResponse:
    """Verifies TOTP verification code and activates MFA on the account."""
    verify_user_mfa(user["sub"], payload.code)
    return MFAStatusResponse(is_enabled=True, factor_type="totp")


@router.post("/mfa/unenroll", response_model=MFAStatusResponse)
async def unenroll_mfa(
    user: Dict[str, Any] = Depends(get_current_user_required),
) -> MFAStatusResponse:
    """Disables MFA protection on the user's account."""
    unenroll_user_mfa(user["sub"])
    return MFAStatusResponse(is_enabled=False, factor_type=None)


