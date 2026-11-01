"""Authentication and security service for Product Research Intelligence.

Provides a unified authentication architecture:
- Canonical Production Provider: Supabase Auth (JWT verification with signature, audience,
  expiration, and claim extraction).
- Local / Test Provider: PBKDF2-HMAC-SHA256 password hashing and HS256 JWT tokens.
- Strict Production Isolation: The local adapter is prohibited when ENVIRONMENT=production.
- Server-side user identity verification: User ID is always derived from verified token claims,
  never from browser-supplied fields.
"""

from __future__ import annotations

import hashlib
import hmac
import logging
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any

import jwt
from fastapi import Header, HTTPException, status

from backend.app.config import settings

logger = logging.getLogger(__name__)

JWT_EXPIRATION_DAYS = 7


def get_active_auth_provider() -> str:
    """Determines the active authentication provider and enforces production safety.

    Returns:
        'supabase' or 'local'
    Raises:
        RuntimeError: If ENVIRONMENT=production and provider is configured as 'local'.
    """
    configured = (settings.auth_provider or "auto").lower()

    if configured in ("supabase", "local"):
        provider = configured
    elif settings.supabase_jwt_secret or (settings.supabase_url and settings.supabase_anon_key):
        provider = "supabase"
    else:
        provider = "local"

    # Strict Production Guard: Prohibit local adapter in production
    if settings.environment.lower() == "production" and provider == "local":
        raise RuntimeError(
            "CRITICAL SECURITY CONFIGURATION ERROR: AUTH_PROVIDER is set to 'local' while "
            "ENVIRONMENT is 'production'. Canonical Supabase Auth (SUPABASE_JWT_SECRET / "
            "SUPABASE_URL) must be configured in production."
        )

    return provider


# -----------------------------------------------------------------------------
# Local Password Hashing & Local Token Issuance (Test / Dev Adapter)
# -----------------------------------------------------------------------------
def hash_password(password: str) -> str:
    """Hashes a password with PBKDF2-HMAC-SHA256 and a random salt."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100_000,
    )
    return f"{salt}${key.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against its salt$hash representation."""
    try:
        salt, expected_hash = hashed_password.split("$", 1)
        key = hashlib.pbkdf2_hmac(
            "sha256",
            plain_password.encode("utf-8"),
            salt.encode("utf-8"),
            100_000,
        )
        return hmac.compare_digest(key.hex(), expected_hash)
    except Exception:
        return False


def create_access_token(user_id: str, email: str, username: str) -> str:
    """Creates a signed local JWT token for local/test authentication."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "email": email,
        "username": username,
        "aud": "authenticated",
        "iss": "pri-local-auth",
        "iat": now,
        "exp": now + timedelta(days=JWT_EXPIRATION_DAYS),
    }
    return jwt.encode(payload, settings.local_jwt_secret, algorithm="HS256")


def create_mock_supabase_token(
    user_id: str,
    email: str,
    username: str,
    secret: Optional[str] = None,
    expired: bool = False,
    audience: str = "authenticated",
) -> str:
    """Generates a test token structured exactly like a real Supabase Auth JWT."""
    now = datetime.now(timezone.utc)
    signing_secret = secret or settings.supabase_jwt_secret or "mock-supabase-test-secret"
    exp = (now - timedelta(hours=1)) if expired else (now + timedelta(hours=1))
    payload = {
        "sub": user_id,
        "email": email,
        "role": "authenticated",
        "aud": audience,
        "iss": f"{settings.supabase_url or 'https://your-project.supabase.co'}/auth/v1",
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
        "user_metadata": {
            "username": username,
            "display_name": username.replace("_", " ").title(),
            "avatar_url": None,
        },
        "app_metadata": {
            "provider": "email",
            "providers": ["email"],
        },
    }
    return jwt.encode(payload, signing_secret, algorithm="HS256")


# -----------------------------------------------------------------------------
# Token Verification Layer
# -----------------------------------------------------------------------------
def verify_supabase_token(token: str) -> Dict[str, Any]:
    """Verifies a Supabase Auth access token using the configured secret and claims.

    Enforces signature check, expiration check, audience check, and claim normalization.
    """
    secret = settings.supabase_jwt_secret
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server configuration error: SUPABASE_JWT_SECRET is required to verify Supabase tokens.",
        )

    try:
        # Supabase default algorithm is HS256 (or asymmetric RS256/ES256 in enterprise SSO)
        payload = jwt.decode(
            token,
            secret,
            algorithms=[settings.supabase_jwt_algorithm],
            audience="authenticated",
            options={"require": ["exp", "sub", "aud"]},
        )

        user_metadata = payload.get("user_metadata", {}) or {}
        username = user_metadata.get("username") or payload.get("email", "").split("@")[0] or payload["sub"]
        display_name = user_metadata.get("display_name") or user_metadata.get("full_name") or username

        return {
            "sub": payload["sub"],
            "email": payload.get("email", ""),
            "username": username,
            "displayName": display_name,
            "avatarUrl": user_metadata.get("avatar_url"),
            "role": payload.get("role", "authenticated"),
            "provider": "supabase",
            "rawClaims": payload,
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Supabase session has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidAudienceError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token audience. Token was not issued for this application.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Supabase authentication token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def verify_local_token(token: str) -> Dict[str, Any]:
    """Verifies a local developer token."""
    try:
        payload = jwt.decode(
            token,
            settings.local_jwt_secret,
            algorithms=["HS256"],
            options={"require": ["exp", "sub"], "verify_aud": False},
        )
        return {
            "sub": payload["sub"],
            "email": payload.get("email", ""),
            "username": payload.get("username", "user"),
            "displayName": payload.get("username", "user"),
            "avatarUrl": None,
            "role": "authenticated",
            "provider": "local",
            "rawClaims": payload,
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token signature.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def decode_access_token(token: str) -> Dict[str, Any]:
    """Universal token decoder that respects active provider configuration.

    In production, always uses Supabase verification.
    In development/testing, inspects provider or attempts Supabase then local adapter.
    """
    active_provider = get_active_auth_provider()

    if active_provider == "supabase":
        try:
            return verify_supabase_token(token)
        except HTTPException:
            if settings.environment.lower() != "production":
                return verify_local_token(token)
            raise

    # If provider is explicitly local
    if settings.auth_provider == "local":
        return verify_local_token(token)

    # In "auto" dev mode, try Supabase if secret is set; fallback to local
    if settings.supabase_jwt_secret:
        try:
            return verify_supabase_token(token)
        except HTTPException:
            # Fall back to local token if not in production
            if settings.environment.lower() != "production":
                return verify_local_token(token)
            raise

    return verify_local_token(token)


# -----------------------------------------------------------------------------
# FastAPI Security Dependencies
# -----------------------------------------------------------------------------
def get_current_user_optional(
    authorization: Optional[str] = Header(None),
) -> Optional[Dict[str, Any]]:
    """Extracts and verifies current user payload if token is present, else returns None."""
    if not authorization:
        return None
    try:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            return decode_access_token(parts[1])
    except Exception:
        return None
    return None


def get_current_user_required(
    authorization: Optional[str] = Header(None),
) -> Dict[str, Any]:
    """Requires a valid Authorization: Bearer <token> header, returns claims payload.

    Enforces that user claims exist and synchronizes profile in repository.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed authorization header. Expected 'Bearer <token>'.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    claims = decode_access_token(parts[1])

    # Auto-synchronize profile in database if it doesn't exist yet
    from backend.app.db.repository import community_repo
    try:
        community_repo.ensure_profile_exists(
            user_id=claims["sub"],
            email=claims.get("email", ""),
            username=claims.get("username"),
            display_name=claims.get("displayName"),
            avatar_url=claims.get("avatarUrl"),
        )
    except Exception as e:
        logger.warning("Could not auto-sync profile for user %s: %s", claims["sub"], e)

    return claims
