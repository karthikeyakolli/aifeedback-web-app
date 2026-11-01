-- =============================================================================
-- Migration: 00005_research_reports.sql
-- Description: Persistent research reports, PRDs, engineering tickets, and UX briefs.
-- Tables: public.research_reports
-- Row Level Security: Enforces user-isolated access boundaries (auth.uid() = owner_id).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.research_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL CHECK (
        report_type IN (
            'analytical_report',
            'executive_summary',
            'prd',
            'engineering_ticket',
            'ux_brief'
        )
    ),
    title VARCHAR(200) NOT NULL,
    content_markdown TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (
        status IN ('completed', 'draft', 'failed')
    ),
    source_analysis_id UUID REFERENCES public.analysis_runs(id) ON DELETE SET NULL,
    version INT NOT NULL DEFAULT 1,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Query Performance Indexes
CREATE INDEX IF NOT EXISTS idx_research_reports_post ON public.research_reports(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_reports_owner ON public.research_reports(owner_id, post_id);
CREATE INDEX IF NOT EXISTS idx_research_reports_type ON public.research_reports(post_id, report_type);

-- Row Level Security (RLS)
ALTER TABLE public.research_reports ENABLE ROW LEVEL SECURITY;

-- 1. Owners can view their own generated reports
CREATE POLICY "Users can view own reports"
    ON public.research_reports
    FOR SELECT
    USING (auth.uid() = owner_id);

-- 2. Authenticated users can create research reports
CREATE POLICY "Users can create own reports"
    ON public.research_reports
    FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

-- 3. Owners can update their own reports (e.g. edit draft PRDs)
CREATE POLICY "Users can update own reports"
    ON public.research_reports
    FOR UPDATE
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- 4. Owners can delete their own reports
CREATE POLICY "Users can delete own reports"
    ON public.research_reports
    FOR DELETE
    USING (auth.uid() = owner_id);
