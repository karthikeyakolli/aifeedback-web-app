-- =============================================================================
-- Migration: 00010_user_credentials_and_identity_vault.sql
-- Description: Phase 3 Unified Identity, Account Linking, Optional MFA,
--              and Server-Side Encrypted BYOK Credential Vault with Strict RLS.
-- =============================================================================

-- 1. User Identities Table (Multi-Provider OAuth & Account Linking)
CREATE TABLE IF NOT EXISTS public.user_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('email', 'google', 'github')),
    provider_subject VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(provider, provider_subject)
);

CREATE INDEX IF NOT EXISTS idx_user_identities_user ON public.user_identities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_identities_email ON public.user_identities(email);

ALTER TABLE public.user_identities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User identities select policy"
    ON public.user_identities FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "User identities insert policy"
    ON public.user_identities FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User identities delete policy"
    ON public.user_identities FOR DELETE
    USING (auth.uid() = user_id);


-- 2. User MFA Configuration Table (Optional Multi-Factor Authentication)
CREATE TABLE IF NOT EXISTS public.user_mfa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    factor_type VARCHAR(30) NOT NULL DEFAULT 'totp' CHECK (factor_type IN ('totp', 'recovery_code')),
    secret_encrypted TEXT NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.user_mfa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User mfa select policy"
    ON public.user_mfa FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "User mfa insert policy"
    ON public.user_mfa FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User mfa update policy"
    ON public.user_mfa FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "User mfa delete policy"
    ON public.user_mfa FOR DELETE
    USING (auth.uid() = user_id);


-- 3. User Credentials Vault Table (Encrypted Server-Side BYOK Storage)
CREATE TABLE IF NOT EXISTS public.user_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL CHECK (
        provider IN ('gemini', 'groq', 'nvidia', 'openrouter')
    ),
    display_name VARCHAR(100) NOT NULL,
    encrypted_secret TEXT NOT NULL,
    key_version VARCHAR(20) NOT NULL DEFAULT 'v1',
    masked_preview VARCHAR(60) NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    validation_status VARCHAR(30) NOT NULL DEFAULT 'unverified' CHECK (
        validation_status IN ('unverified', 'valid', 'invalid', 'rate_limited')
    ),
    last_tested_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, provider, display_name)
);

CREATE INDEX IF NOT EXISTS idx_user_credentials_user ON public.user_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credentials_provider ON public.user_credentials(user_id, provider);

ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;

-- Strict Owner-Only Access Policies
CREATE POLICY "User credentials select policy"
    ON public.user_credentials FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "User credentials insert policy"
    ON public.user_credentials FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User credentials update policy"
    ON public.user_credentials FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "User credentials delete policy"
    ON public.user_credentials FOR DELETE
    USING (auth.uid() = user_id);


-- 4. Password Reset Tokens (Secure One-Time Token Store)
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
    token VARCHAR(128) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON public.password_reset_tokens(user_id);

