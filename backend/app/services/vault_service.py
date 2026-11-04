"""Server-Side Authenticated Encryption BYOK Credential Vault (Phase 3).

Implements NIST-approved AES-256-GCM authenticated encryption for user-owned AI credentials:
- Cryptographic domain separation using Associated Authenticated Data (AAD bound to user_id:provider).
- Unique 96-bit random nonce generated per encryption operation.
- Explicit key versioning and key rotation procedures.
- Safe masked preview generation (e.g. sk-or-***9d43). Plaintext secrets are NEVER returned by APIs.
- Owner-isolated database operations and status tracking.
"""

from __future__ import annotations

import base64
import hashlib
import logging
import os
import sqlite3
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from fastapi import HTTPException, status

from backend.app.config import settings
from backend.app.db.connection import db_manager

logger = logging.getLogger(__name__)

SUPPORTED_PROVIDERS = ("gemini", "groq", "nvidia", "openrouter")
VAULT_SALT = b"pri_byok_vault_domain_salt_v1"


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class VaultEncryptionError(RuntimeError):
    """Raised when encryption or decryption fails due to key mismatch or corrupted ciphertext."""
    pass


class CredentialVaultService:
    """Core cryptographic vault service managing user BYOK credentials."""

    def __init__(self) -> None:
        self.db = db_manager

    def _derive_master_key(self, key_version: str = "v1") -> bytes:
        """Derives a deterministic 256-bit AES master key from environment configuration."""
        raw_key = settings.byok_encryption_key
        if not raw_key or len(raw_key) < 16:
            # Fall back to deriving from local JWT secret in local dev/test mode
            raw_key = f"{settings.local_jwt_secret}::byok_master_salt_{key_version}"

        return hashlib.pbkdf2_hmac(
            "sha256",
            raw_key.encode("utf-8"),
            VAULT_SALT + key_version.encode("utf-8"),
            100_000,
            dklen=32,
        )

    def generate_masked_preview(self, secret: str) -> str:
        """Generates a safe non-sensitive masked preview string (e.g. sk-or-...9d43)."""
        secret = secret.strip()
        length = len(secret)
        if length <= 8:
            return "****"
        if length <= 16:
            return f"{secret[:3]}...{secret[-2:]}"
        # For typical 32-64 char API keys
        return f"{secret[:7]}...{secret[-4:]}"

    def encrypt_secret(
        self,
        secret: str,
        user_id: str,
        provider: str,
        key_version: Optional[str] = None,
    ) -> str:
        """Encrypts a plaintext API credential with AES-256-GCM and bound AAD."""
        version = key_version or settings.byok_key_version or "v1"
        key = self._derive_master_key(version)
        aesgcm = AESGCM(key)
        nonce = os.urandom(12)  # 96-bit fresh nonce
        aad = f"{user_id}:{provider.lower()}".encode("utf-8")

        ciphertext = aesgcm.encrypt(nonce, secret.strip().encode("utf-8"), aad)

        nonce_b64 = base64.urlsafe_b64encode(nonce).decode("ascii")
        ct_b64 = base64.urlsafe_b64encode(ciphertext).decode("ascii")

        return f"{version}${nonce_b64}${ct_b64}"

    def decrypt_secret(
        self,
        encrypted_secret: str,
        user_id: str,
        provider: str,
    ) -> str:
        """Decrypts a stored ciphertext and verifies the 128-bit authentication tag with bound AAD."""
        try:
            parts = encrypted_secret.split("$")
            if len(parts) != 3:
                raise ValueError("Malformed encrypted credential format.")

            version, nonce_b64, ct_b64 = parts
            key = self._derive_master_key(version)
            aesgcm = AESGCM(key)

            nonce = base64.urlsafe_b64decode(nonce_b64.encode("ascii"))
            ciphertext = base64.urlsafe_b64decode(ct_b64.encode("ascii"))
            aad = f"{user_id}:{provider.lower()}".encode("utf-8")

            decrypted_bytes = aesgcm.decrypt(nonce, ciphertext, aad)
            return decrypted_bytes.decode("utf-8")
        except InvalidTag:
            logger.error("Tampered credential or unauthorized tenant decryption attempt for user %s provider %s", user_id, provider)
            raise VaultEncryptionError("Credential decryption failed: authentication tag verification failed (tampered ciphertext or owner mismatch).")
        except Exception as e:
            logger.error("Failed to decrypt credential: %s", e)
            raise VaultEncryptionError(f"Credential decryption error: {str(e)}")

    # -------------------------------------------------------------------------
    # Database Vault CRUD Operations
    # -------------------------------------------------------------------------

    def add_credential(
        self,
        user_id: str,
        provider: str,
        display_name: str,
        secret_key: Optional[str] = None,
        secret: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Encrypts and persists a new user BYOK credential."""
        provider = provider.lower()
        if provider not in SUPPORTED_PROVIDERS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported AI provider '{provider}'. Supported: {', '.join(SUPPORTED_PROVIDERS)}",
            )

        secret_clean = (secret_key or secret or "").strip()
        if len(secret_clean) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Credential key has insufficient length.",
            )

        display_name = display_name.strip() or f"My {provider.title()} Key"
        masked = self.generate_masked_preview(secret_clean)
        encrypted = self.encrypt_secret(secret_clean, user_id=user_id, provider=provider)
        key_ver = settings.byok_key_version or "v1"

        cred_id = str(uuid.uuid4())
        now = utc_now_iso()

        with self.db.session() as conn:
            try:
                conn.execute(
                    """
                    INSERT INTO user_credentials (
                        id, user_id, provider, display_name, encrypted_secret,
                        key_version, masked_preview, is_enabled, validation_status,
                        created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'unverified', ?, ?)
                    """,
                    (cred_id, user_id, provider, display_name, encrypted, key_ver, masked, now, now),
                )
            except sqlite3.IntegrityError:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"A credential with display name '{display_name}' already exists for provider '{provider}'.",
                )

        return self.get_credential_metadata(user_id, cred_id)

    def list_user_credentials(self, user_id: str) -> List[Dict[str, Any]]:
        """Returns safe metadata for all credentials owned by the user. Plaintext secrets are never returned."""
        with self.db.session() as conn:
            rows = conn.execute(
                """
                SELECT id, user_id, provider, display_name, masked_preview,
                       is_enabled, validation_status, last_tested_at, created_at, updated_at
                FROM user_credentials
                WHERE user_id = ?
                ORDER BY created_at DESC
                """,
                (user_id,),
            ).fetchall()
            return [self._serialize_safe_metadata(r) for r in rows]

    def get_credential_metadata(self, user_id: str, credential_id: str) -> Dict[str, Any]:
        """Returns safe metadata for a specific user-owned credential."""
        with self.db.session() as conn:
            row = conn.execute(
                """
                SELECT id, user_id, provider, display_name, masked_preview,
                       is_enabled, validation_status, last_tested_at, created_at, updated_at
                FROM user_credentials
                WHERE id = ? AND user_id = ?
                """,
                (credential_id, user_id),
            ).fetchone()
            if not row:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credential record not found.")
            return self._serialize_safe_metadata(row)

    def get_decrypted_credential(self, user_id: str, credential_id: str) -> str:
        """Internal server-only method to decrypt secret for AI execution."""
        with self.db.session() as conn:
            row = conn.execute(
                """
                SELECT provider, encrypted_secret
                FROM user_credentials
                WHERE id = ? AND user_id = ? AND is_enabled = 1
                """,
                (credential_id, user_id),
            ).fetchone()
            if not row:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Active credential not found.")

            return self.decrypt_secret(row["encrypted_secret"], user_id=user_id, provider=row["provider"])

    def get_active_credential_for_provider(self, user_id: str, provider: str) -> Optional[str]:
        """Retrieves and decrypts the latest enabled credential for a user and provider."""
        with self.db.session() as conn:
            row = conn.execute(
                """
                SELECT encrypted_secret
                FROM user_credentials
                WHERE user_id = ? AND provider = ? AND is_enabled = 1
                ORDER BY updated_at DESC LIMIT 1
                """,
                (user_id, provider.lower()),
            ).fetchone()
            if not row:
                return None

            try:
                return self.decrypt_secret(row["encrypted_secret"], user_id=user_id, provider=provider.lower())
            except Exception:
                return None

    def update_credential(
        self,
        user_id: str,
        credential_id: str,
        display_name: Optional[str] = None,
        is_enabled: Optional[bool] = None,
    ) -> Dict[str, Any]:
        """Updates display name or enabled status."""
        self.get_credential_metadata(user_id, credential_id)  # Verifies ownership
        now = utc_now_iso()

        with self.db.session() as conn:
            if display_name is not None and is_enabled is not None:
                conn.execute(
                    "UPDATE user_credentials SET display_name = ?, is_enabled = ?, updated_at = ? WHERE id = ? AND user_id = ?",
                    (display_name.strip(), 1 if is_enabled else 0, now, credential_id, user_id),
                )
            elif display_name is not None:
                conn.execute(
                    "UPDATE user_credentials SET display_name = ?, updated_at = ? WHERE id = ? AND user_id = ?",
                    (display_name.strip(), now, credential_id, user_id),
                )
            elif is_enabled is not None:
                conn.execute(
                    "UPDATE user_credentials SET is_enabled = ?, updated_at = ? WHERE id = ? AND user_id = ?",
                    (1 if is_enabled else 0, now, credential_id, user_id),
                )

        return self.get_credential_metadata(user_id, credential_id)

    def rotate_credential_secret(
        self,
        user_id: str,
        credential_id: str,
        new_secret_key: str,
    ) -> Dict[str, Any]:
        """Replaces the encrypted secret with a newly encrypted key, updating masked preview."""
        meta = self.get_credential_metadata(user_id, credential_id)
        provider = meta["provider"]

        new_secret = new_secret_key.strip()
        if len(new_secret) < 8:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New credential has insufficient length.")

        masked = self.generate_masked_preview(new_secret)
        encrypted = self.encrypt_secret(new_secret, user_id=user_id, provider=provider)
        now = utc_now_iso()

        with self.db.session() as conn:
            conn.execute(
                """
                UPDATE user_credentials
                SET encrypted_secret = ?, masked_preview = ?, validation_status = 'unverified', updated_at = ?
                WHERE id = ? AND user_id = ?
                """,
                (encrypted, masked, now, credential_id, user_id),
            )

        return self.get_credential_metadata(user_id, credential_id)

    def delete_credential(self, user_id: str, credential_id: str) -> bool:
        """Deletes user credential record."""
        self.get_credential_metadata(user_id, credential_id)
        with self.db.session() as conn:
            cur = conn.execute(
                "DELETE FROM user_credentials WHERE id = ? AND user_id = ?",
                (credential_id, user_id),
            )
            return cur.rowcount > 0

    def update_validation_status(
        self,
        user_id: str,
        credential_id: str,
        validation_status: str,
    ) -> Dict[str, Any]:
        """Updates credential validation test result."""
        now = utc_now_iso()
        with self.db.session() as conn:
            conn.execute(
                "UPDATE user_credentials SET validation_status = ?, last_tested_at = ?, updated_at = ? WHERE id = ? AND user_id = ?",
                (validation_status, now, now, credential_id, user_id),
            )
        return self.get_credential_metadata(user_id, credential_id)

    async def test_credential_connectivity(
        self,
        user_id: str,
        credential_id: str,
    ) -> Dict[str, Any]:
        """Validates credential against the provider's external API without executing expensive generation."""
        meta = self.get_credential_metadata(user_id, credential_id)
        provider = meta["provider"]
        secret = self.get_decrypted_credential(user_id, credential_id)

        status_result = "invalid"
        detail_msg = ""

        try:
            import httpx

            if provider == "openrouter":
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.get(
                        "https://openrouter.ai/api/v1/auth/key",
                        headers={"Authorization": f"Bearer {secret}"},
                    )
                    if resp.status_code == 200:
                        status_result = "valid"
                        detail_msg = "OpenRouter API key verified successfully."
                    elif resp.status_code == 429:
                        status_result = "rate_limited"
                        detail_msg = "OpenRouter rate limit reached."
                    else:
                        status_result = "invalid"
                        detail_msg = f"OpenRouter returned status {resp.status_code}."

            elif provider == "groq":
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.get(
                        "https://api.groq.com/openai/v1/models",
                        headers={"Authorization": f"Bearer {secret}"},
                    )
                    if resp.status_code == 200:
                        status_result = "valid"
                        detail_msg = "Groq API key verified successfully."
                    elif resp.status_code == 429:
                        status_result = "rate_limited"
                        detail_msg = "Groq rate limit reached."
                    else:
                        status_result = "invalid"
                        detail_msg = f"Groq returned status {resp.status_code}."

            elif provider == "nvidia":
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.get(
                        "https://integrate.api.nvidia.com/v1/models",
                        headers={"Authorization": f"Bearer {secret}"},
                    )
                    if resp.status_code == 200:
                        status_result = "valid"
                        detail_msg = "NVIDIA NIM API key verified successfully."
                    elif resp.status_code == 429:
                        status_result = "rate_limited"
                        detail_msg = "NVIDIA NIM rate limit reached."
                    else:
                        status_result = "invalid"
                        detail_msg = f"NVIDIA NIM returned status {resp.status_code}."

            elif provider == "gemini":
                # Check Gemini models endpoint
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.get(
                        f"https://generativelanguage.googleapis.com/v1beta/models?key={secret}"
                    )
                    if resp.status_code == 200:
                        status_result = "valid"
                        detail_msg = "Google Gemini API key verified successfully."
                    elif resp.status_code == 429:
                        status_result = "rate_limited"
                        detail_msg = "Gemini quota or rate limit exceeded."
                    else:
                        status_result = "invalid"
                        detail_msg = f"Gemini returned status {resp.status_code}."

        except Exception as e:
            logger.warning("Error testing credential %s: %s", credential_id, e)
            status_result = "invalid"
            detail_msg = f"Network or validation error: {str(e)}"

        updated_meta = self.update_validation_status(user_id, credential_id, status_result)
        return {
            "credential": updated_meta,
            "status": status_result,
            "message": detail_msg,
        }

    def _serialize_safe_metadata(self, row: sqlite3.Row) -> Dict[str, Any]:
        return {
            "id": row["id"],
            "userId": row["user_id"],
            "provider": row["provider"],
            "displayName": row["display_name"],
            "maskedPreview": row["masked_preview"],
            "isEnabled": bool(row["is_enabled"]),
            "validationStatus": row["validation_status"],
            "lastTestedAt": row["last_tested_at"],
            "createdAt": row["created_at"],
            "updatedAt": row["updated_at"],
        }


vault_service = CredentialVaultService()
