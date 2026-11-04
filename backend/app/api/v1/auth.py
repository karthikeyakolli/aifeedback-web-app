"""Authentication, session, unified identity, and MFA routes."""

from __future__ import annotations

from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, status
from backend.app.config import settings
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
    """Registers a new account. Active in development and local mode."""
    if settings.environment.lower() == "production" and get_active_auth_provider() == "supabase":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="In production/Supabase mode, sign-ups must be performed directly via Supabase Auth client.",
        )
    user_id, profile = community_repo.create_user(
        email=payload.email,
        password=payload.password,
        username=payload.username,
        display_name=payload.display_name,
        bio=payload.bio or "",
        avatar_url=payload.avatar_url,
    )
    token = create_access_token(user_id=user_id, email=payload.email, username=payload.username)
    return AuthTokenResponse(
        accessToken=token,
        tokenType="Bearer",
        user=UserProfileResponse(**profile),
    )


@router.post("/login", response_model=AuthTokenResponse)
async def login(payload: UserLoginRequest) -> AuthTokenResponse:
    """Authenticates existing user. Active in development and local mode."""
    if settings.environment.lower() == "production" and get_active_auth_provider() == "supabase":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="In production/Supabase mode, login must be performed directly via Supabase Auth client.",
        )
    profile = community_repo.authenticate_user(email=payload.email, password=payload.password)
    token = create_access_token(
        user_id=profile["id"], email=payload.email, username=profile["username"]
    )
    return AuthTokenResponse(
        accessToken=token,
        tokenType="Bearer",
        user=UserProfileResponse(**profile),
    )


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


