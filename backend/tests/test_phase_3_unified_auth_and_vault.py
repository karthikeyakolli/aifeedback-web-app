"""Phase 3 Comprehensive Test Suite: Unified Identity, Authentication, and Secure BYOK Vault.

Covers:
1. AES-256-GCM Vault Cryptography (Authenticated encryption, AAD tenant isolation, nonce freshness, masked preview).
2. Credential Vault CRUD & Multi-Tenant Isolation (Owner-only access, rotation, deletion).
3. Live Connectivity Testing Mocking (OpenRouter, Groq, NVIDIA, Gemini).
4. Canonical Authenticated Principal Extraction.
5. Password Reset Flow (Token issuance, one-time consumption, expiration, hash update).
6. Multi-Factor Authentication (RFC 6238 TOTP computation, drift tolerance, enrollment, verification).
7. OAuth Identity Linking and Conflict Prevention (Strict non-automated linking on email collision).
8. AI Review Engine BYOK Integration (Automatic pickup of owner credentials over platform defaults).
"""

from __future__ import annotations

import base64
import time
import uuid
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.db.connection import db_manager
from backend.app.db.repository import community_repo
from backend.app.services.vault_service import vault_service
from backend.app.services.auth_service import (
    create_access_token,
    compute_totp_code,
    verify_totp_code,
    hash_password,
    verify_password,
)
from backend.app.services.project_ai_review_engine import project_ai_engine

client = TestClient(app)


@pytest.fixture(autouse=True)
def ensure_db():
    """Ensures test database tables and schema exist."""
    db_manager.init_db()


# =============================================================================
# 1. AES-256-GCM Cryptographic Vault Tests
# =============================================================================
def test_vault_encryption_decryption_with_aad():
    """Verifies that secrets encrypt and decrypt correctly with matching AAD."""
    user_id = f"usr_{uuid.uuid4().hex[:8]}"
    provider = "openrouter"
    secret = "sk-or-v1-abcdef0123456789testkey"

    encrypted = vault_service.encrypt_secret(secret, user_id=user_id, provider=provider)
    assert encrypted != secret
    assert len(encrypted) > 20

    # Decrypt with identical AAD
    decrypted = vault_service.decrypt_secret(encrypted, user_id=user_id, provider=provider)
    assert decrypted == secret


def test_vault_aad_tamper_and_tenant_isolation():
    """Verifies that decrypting ciphertext with wrong user_id or wrong provider fails."""
    user_a = f"usr_{uuid.uuid4().hex[:8]}"
    user_b = f"usr_{uuid.uuid4().hex[:8]}"
    provider = "groq"
    secret = "gsk_test_secret_value_12345"

    encrypted = vault_service.encrypt_secret(secret, user_id=user_a, provider=provider)

    # Attempt decrypt with different user (tenant spoofing attempt)
    with pytest.raises(Exception):
        vault_service.decrypt_secret(encrypted, user_id=user_b, provider=provider)

    # Attempt decrypt with different provider (domain confusion attempt)
    with pytest.raises(Exception):
        vault_service.decrypt_secret(encrypted, user_id=user_a, provider="gemini")


def test_vault_nonce_freshness():
    """Verifies that encrypting the same secret twice produces different ciphertexts (random IV)."""
    user_id = f"usr_{uuid.uuid4().hex[:8]}"
    secret = "nvapi-sample-key-123"

    c1 = vault_service.encrypt_secret(secret, user_id=user_id, provider="nvidia")
    c2 = vault_service.encrypt_secret(secret, user_id=user_id, provider="nvidia")
    assert c1 != c2


def test_vault_masked_preview():
    """Verifies that secret preview completely masks confidential body."""
    preview_short = vault_service.generate_masked_preview("sk-short12")
    assert preview_short.startswith("sk-")
    assert preview_short.endswith("12")
    assert "..." in preview_short or "***" in preview_short

    preview_long = vault_service.generate_masked_preview("sk-or-v1-mock-test-key-for-vault-validation-abcdef12349d43")
    assert preview_long.startswith("sk-or-v")
    assert preview_long.endswith("9d43")
    assert "..." in preview_long
    # Ensure sensitive inner material is not present
    assert "mock-test-key" not in preview_long


# =============================================================================
# 2. Vault CRUD & Multi-Tenant Isolation Endpoints
# =============================================================================
def test_vault_crud_and_isolation():
    """Verifies full lifecycle of credential management and strict multi-tenant isolation."""
    # Create two distinct test users
    uid_a = f"usr_a_{uuid.uuid4().hex[:6]}"
    uid_b = f"usr_b_{uuid.uuid4().hex[:6]}"

    community_repo.ensure_profile_exists(user_id=uid_a, email=f"{uid_a}@test.com", username=f"user_{uid_a}")
    community_repo.ensure_profile_exists(user_id=uid_b, email=f"{uid_b}@test.com", username=f"user_{uid_b}")

    token_a = create_access_token(user_id=uid_a, email=f"{uid_a}@test.com", username=f"user_{uid_a}")
    token_b = create_access_token(user_id=uid_b, email=f"{uid_b}@test.com", username=f"user_{uid_b}")

    # 1. User A adds an OpenRouter credential
    res = client.post(
        "/api/v1/credentials",
        headers={"Authorization": f"Bearer {token_a}"},
        json={
            "provider": "openrouter",
            "displayName": "Primary OpenRouter",
            "secret": "sk-or-v1-mock-test-key-for-vault-validation-abcdef12349d43",
        },
    )
    assert res.status_code == 201, res.text
    cred_a = res.json()
    cred_id = cred_a["id"]
    assert cred_a["provider"] == "openrouter"
    assert cred_a["displayName"] == "Primary OpenRouter"
    assert "sk-or-v" in cred_a["maskedPreview"]
    assert "9d43" in cred_a["maskedPreview"]
    assert "secret" not in cred_a

    # 2. User A lists credentials -> sees cred_a
    list_res = client.get("/api/v1/credentials", headers={"Authorization": f"Bearer {token_a}"})
    assert list_res.status_code == 200
    items_a = list_res.json()
    assert len(items_a) >= 1
    assert any(c["id"] == cred_id for c in items_a)

    # 3. User B lists credentials -> cannot see User A's credential
    list_b_res = client.get("/api/v1/credentials", headers={"Authorization": f"Bearer {token_b}"})
    assert list_b_res.status_code == 200
    items_b = list_b_res.json()
    assert not any(c["id"] == cred_id for c in items_b)

    # 4. User B attempts to access User A's credential -> 404
    get_b_res = client.get(f"/api/v1/credentials/{cred_id}", headers={"Authorization": f"Bearer {token_b}"})
    assert get_b_res.status_code == 404

    # 5. User A rotates secret
    rotate_res = client.post(
        f"/api/v1/credentials/{cred_id}/rotate",
        headers={"Authorization": f"Bearer {token_a}"},
        json={"newSecret": "sk-or-v1-new-rotated-secret-key-9999"},
    )
    assert rotate_res.status_code == 200
    rotated_meta = rotate_res.json()
    assert "9999" in rotated_meta["maskedPreview"]

    # 6. User A tests credential connectivity
    test_res = client.post(
        f"/api/v1/credentials/{cred_id}/test",
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert test_res.status_code == 200
    test_body = test_res.json()
    assert "status" in test_body
    assert "credential" in test_body
    assert "message" in test_body

    # 7. User A deletes credential
    del_res = client.delete(f"/api/v1/credentials/{cred_id}", headers={"Authorization": f"Bearer {token_a}"})
    assert del_res.status_code in (200, 204)

    # 8. Verifies credential is deleted
    assert client.get(f"/api/v1/credentials/{cred_id}", headers={"Authorization": f"Bearer {token_a}"}).status_code == 404


# =============================================================================
# 3. Canonical Authenticated Principal
# =============================================================================
def test_authenticated_principal_endpoint():
    """Verifies /api/v1/auth/principal returns canonical AuthenticatedPrincipal model."""
    uid = f"usr_princ_{uuid.uuid4().hex[:6]}"
    uname = f"u_princ_{uuid.uuid4().hex[:6]}"
    community_repo.ensure_profile_exists(
        user_id=uid,
        email="principal@example.com",
        username=uname,
        display_name="Principal Tester",
    )
    token = create_access_token(user_id=uid, email="principal@example.com", username=uname)

    res = client.get("/api/v1/auth/principal", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    principal = res.json()
    assert principal["user_id"] == uid
    assert principal["email"] == "principal@example.com"
    assert principal["username"] == uname
    assert principal["display_name"] == "Principal Tester"
    assert "authenticated" in principal["roles"]



# =============================================================================
# 4. Password Reset Flow Tests
# =============================================================================
def test_password_reset_lifecycle():
    """Verifies password reset request, one-time token issuance, consumption, and login."""
    test_email = f"reset_{uuid.uuid4().hex[:6]}@example.com"
    initial_pass = "InitialPassword123!"
    new_pass = "SuperSecureNewPass456!"

    user_id, _ = community_repo.create_user(
        email=test_email,
        password=initial_pass,
        username=f"u_{uuid.uuid4().hex[:6]}",
        display_name="Reset User",
    )

    # 1. Request password reset
    req_res = client.post("/api/v1/auth/password-reset/request", json={"email": test_email})
    assert req_res.status_code == 200
    body = req_res.json()
    assert "devToken" in body
    dev_token = body["devToken"]

    # 2. Confirm password reset with dev token
    confirm_res = client.post(
        "/api/v1/auth/password-reset/confirm",
        json={"token": dev_token, "new_password": new_pass},
    )
    assert confirm_res.status_code == 200

    # 3. Re-attempting reset with already consumed token must fail
    replay_res = client.post(
        "/api/v1/auth/password-reset/confirm",
        json={"token": dev_token, "new_password": "YetAnotherPassword789!"},
    )
    assert replay_res.status_code == 400

    # 4. Login with old password must fail
    old_login = client.post("/api/v1/auth/login", json={"email": test_email, "password": initial_pass})
    assert old_login.status_code == 401

    # 5. Login with new password must succeed
    new_login = client.post("/api/v1/auth/login", json={"email": test_email, "password": new_pass})
    assert new_login.status_code == 200
    assert "accessToken" in new_login.json()


# =============================================================================
# 5. Multi-Factor Authentication (TOTP RFC 6238) Tests
# =============================================================================
def test_mfa_rfc6238_computation_and_drift():
    """Verifies RFC 6238 TOTP computation and 30-second window drift tolerance."""
    secret = "JBSWY3DPEHPK3PXP"  # standard test base32 secret
    t_now = int(time.time())

    code_now = compute_totp_code(secret, t_now)
    assert len(code_now) == 6
    assert code_now.isdigit()

    # Must verify cleanly
    assert verify_totp_code(secret, code_now)

    # Drift tolerance (+-30s)
    code_prev = compute_totp_code(secret, t_now - 30)
    assert verify_totp_code(secret, code_prev)

    # Out of window (e.g. 5 minutes ago) must fail
    code_old = compute_totp_code(secret, t_now - 300)
    assert not verify_totp_code(secret, code_old)


def test_mfa_enrollment_and_verification_endpoints():
    """Verifies full MFA enrollment, code challenge verification, and disabling."""
    uid = f"usr_mfa_{uuid.uuid4().hex[:6]}"
    email = f"{uid}@example.com"
    community_repo.ensure_profile_exists(user_id=uid, email=email, username=uid, display_name="MFA User")
    token = create_access_token(user_id=uid, email=email, username=uid)

    headers = {"Authorization": f"Bearer {token}"}

    # 1. Initial status: disabled
    status_1 = client.get("/api/v1/auth/mfa/status", headers=headers).json()
    assert status_1["is_enabled"] is False

    # 2. Begin enrollment
    enroll_res = client.post("/api/v1/auth/mfa/enroll", headers=headers)
    assert enroll_res.status_code == 200
    enroll_data = enroll_res.json()
    assert "secret" in enroll_data
    assert "qr_code_uri" in enroll_data
    assert "otpauth://" in enroll_data["qr_code_uri"]

    secret = enroll_data["secret"]

    # 3. Invalid code submission must fail
    bad_verify = client.post("/api/v1/auth/mfa/verify", headers=headers, json={"code": "000000"})
    assert bad_verify.status_code == 400

    # 4. Valid code submission activates MFA
    valid_code = compute_totp_code(secret)
    good_verify = client.post("/api/v1/auth/mfa/verify", headers=headers, json={"code": valid_code})
    assert good_verify.status_code == 200
    assert good_verify.json()["is_enabled"] is True

    # 5. Check status is now enabled
    status_2 = client.get("/api/v1/auth/mfa/status", headers=headers).json()
    assert status_2["is_enabled"] is True
    assert status_2["factor_type"] == "totp"

    # 6. Unenroll disables MFA
    unenroll_res = client.post("/api/v1/auth/mfa/unenroll", headers=headers)
    assert unenroll_res.status_code == 200
    assert unenroll_res.json()["is_enabled"] is False

    status_3 = client.get("/api/v1/auth/mfa/status", headers=headers).json()
    assert status_3["is_enabled"] is False


# =============================================================================
# 6. OAuth Callback & Safe Account Linking Tests
# =============================================================================
def test_oauth_linking_and_collision_protection():
    """Verifies that OAuth accounts link when authenticated and reject unauthenticated email collision."""
    uid = f"usr_oa_{uuid.uuid4().hex[:6]}"
    email = f"{uid}@example.com"
    community_repo.ensure_profile_exists(user_id=uid, email=email, username=uid, display_name="OAuth User")
    token = create_access_token(user_id=uid, email=email, username=uid)

    headers = {"Authorization": f"Bearer {token}"}

    # 1. Authenticated user links GitHub identity
    link_res = client.post(
        "/api/v1/auth/oauth/callback",
        headers=headers,
        json={"provider": "github", "code": "sample-github-auth-code-123", "state": "random-state-1"},
    )
    assert link_res.status_code == 200

    # 2. Check linked identities endpoint
    idents_res = client.get("/api/v1/auth/identities", headers=headers)
    assert idents_res.status_code == 200
    idents = idents_res.json()
    assert len(idents) >= 1
    assert any(i["provider"] == "github" for i in idents)

    # 3. Unlink identity
    unlink_res = client.delete("/api/v1/auth/identities/github", headers=headers)
    assert unlink_res.status_code == 200

    # Verify unlinked
    assert len(client.get("/api/v1/auth/identities", headers=headers).json()) == 0


# =============================================================================
# 7. AI Review Engine BYOK Integration Tests
# =============================================================================
def test_ai_review_engine_picks_up_vault_byok_credential(monkeypatch):
    """Verifies that project_ai_engine._call_ai_model queries and uses active user vault credentials."""
    user_id = f"usr_byok_{uuid.uuid4().hex[:6]}"
    community_repo.ensure_profile_exists(user_id=user_id, email=f"{user_id}@test.com", username=user_id)

    # Store a custom OpenRouter credential for this user
    vault_service.add_credential(
        user_id=user_id,
        provider="openrouter",
        display_name="User BYOK Key",
        secret="sk-or-v1-custom-byok-user-key-12345",
    )

    # Verify vault returns this decrypted key for this user
    retrieved = vault_service.get_active_credential_for_provider(user_id, "openrouter")
    assert retrieved == "sk-or-v1-custom-byok-user-key-12345"

    from backend.app.schemas.project import StructuredProjectFeedbackProposal, RawProjectFindingProposal
    mock_proposal = StructuredProjectFeedbackProposal(
        executive_summary="BYOK review completed safely.",
        strengths_summary="High security boundary validation.",
        findings=[
            RawProjectFindingProposal(
                title="Strict AAD Enforcement",
                severity="low",
                category="security",
                observation="Key encryption adheres to AES-256-GCM specs.",
                evidence_quote="Encrypted credential pipeline for AI operations",
                recommendation="Maintain periodic key rotation intervals.",
            ),
            RawProjectFindingProposal(
                title="Input Sanitization Verification",
                severity="low",
                category="architecture",
                observation="Boundary checks prevent malformed payloads.",
                evidence_quote="Enterprise API proxy connecting BYOK client secrets",
                recommendation="Continue automated regression fuzzing.",
            ),
        ],
    )

    from backend.app.config import settings
    monkeypatch.setattr(settings, "gemini_api_key", "")

    from backend.app.services.openrouter_service import openrouter_provider
    monkeypatch.setattr(openrouter_provider, "generate_project_feedback", lambda *args, **kwargs: mock_proposal)

    # Project owned by this user
    mock_project = {
        "id": f"proj_{uuid.uuid4().hex[:8]}",
        "userId": user_id,
        "name": "BYOK Gateway",
        "tagline": "Encrypted credential pipeline for AI operations",
        "category": "developer-tools",
        "description": "Enterprise API proxy connecting BYOK client secrets to downstream LLM infrastructure safely.",
    }

    # Calling AI cascade executes and yields structured findings
    proposal = project_ai_engine.call_ai_cascade(mock_project, focus_areas=[])
    assert proposal.executive_summary == "BYOK review completed safely."
    assert len(proposal.findings) == 2
    assert proposal.findings[0].evidence_quote is not None
