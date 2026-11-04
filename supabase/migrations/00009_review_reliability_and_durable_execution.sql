-- =============================================================================
-- Migration: 00009_review_reliability_and_durable_execution.sql
-- Description: Phase 2 review concurrency protection, worker lease fencing,
--              durable queue indexes, and atomic state transitions.
-- =============================================================================

-- 1. Add durable queue and worker lease metadata to public.ai_reviews
ALTER TABLE public.ai_reviews
    ADD COLUMN IF NOT EXISTS worker_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS lease_token VARCHAR(100),
    ADD COLUMN IF NOT EXISTS lease_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_heartbeat_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS max_attempts INTEGER NOT NULL DEFAULT 3,
    ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

-- 2. Partial unique index: At most one active AI review may exist per project.
-- Ensures concurrency race conditions are stopped at the database layer.
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_ai_review 
ON public.ai_reviews(project_id) 
WHERE status IN ('queued', 'processing');

-- 3. High-performance worker claiming index
-- Enables atomic claim queries with FOR UPDATE SKIP LOCKED
CREATE INDEX IF NOT EXISTS idx_ai_reviews_worker_claim 
ON public.ai_reviews(status, scheduled_at, created_at) 
WHERE status = 'queued';

-- 4. Stale lease recovery index
-- Accelerates periodic sweeps for expired processing leases
CREATE INDEX IF NOT EXISTS idx_ai_reviews_stale_recovery 
ON public.ai_reviews(status, lease_expires_at) 
WHERE status = 'processing';

