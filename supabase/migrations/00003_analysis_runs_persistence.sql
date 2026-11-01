-- =============================================================================
-- Migration: 00003_analysis_runs_persistence.sql
-- Description: Creates persistent, versioned analysis_runs table with RLS
-- policies for evidence-grounded AI research synthesis.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.analysis_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    requested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN ('completed', 'failed')),
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    prompt_version TEXT NOT NULL,
    input_hash TEXT NOT NULL,
    total_comment_count INT NOT NULL DEFAULT 0,
    analyzed_comment_count INT NOT NULL DEFAULT 0,
    result_json JSONB NOT NULL,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Fast lookup of latest analysis by post
CREATE INDEX IF NOT EXISTS idx_analysis_runs_post_created 
    ON public.analysis_runs(post_id, created_at DESC);

-- Fast lookup by input hash for deduplication
CREATE INDEX IF NOT EXISTS idx_analysis_runs_post_hash 
    ON public.analysis_runs(post_id, input_hash);

-- Enable Row Level Security
ALTER TABLE public.analysis_runs ENABLE ROW LEVEL SECURITY;

-- Reading: Anyone who can read the post can read its completed AI analysis
DROP POLICY IF EXISTS "Published post analysis is readable by everyone" ON public.analysis_runs;
CREATE POLICY "Published post analysis is readable by everyone"
    ON public.analysis_runs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.posts
            WHERE id = post_id AND status = 'published'
        )
    );

-- Writing: Only post authors or authorized moderators can insert analysis runs
DROP POLICY IF EXISTS "Post authors and moderators can create analysis runs" ON public.analysis_runs;
CREATE POLICY "Post authors and moderators can create analysis runs"
    ON public.analysis_runs FOR INSERT
    WITH CHECK (
        auth.uid() = requested_by AND (
            EXISTS (
                SELECT 1 FROM public.posts
                WHERE id = post_id AND author_id = auth.uid()
            ) OR EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND is_moderator = TRUE
            )
        )
    );
