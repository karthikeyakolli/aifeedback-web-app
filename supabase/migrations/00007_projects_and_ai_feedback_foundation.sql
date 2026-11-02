-- =============================================================================
-- Migration: 00007_projects_and_ai_feedback_foundation.sql
-- Description: Core engineering foundation for private projects, document attachments,
--              multi-angle AI reviews, feedback reports, and actionable findings.
-- Phase 0 & Phase 2 Database Architecture
-- =============================================================================

-- 1. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    tagline VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (
        category IN ('developer-tools', 'productivity', 'ai-ml', 'design-ux', 'saas-b2b', 'mobile', 'infrastructure')
    ),
    repository_url TEXT,
    demo_url TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (
        status IN ('draft', 'ready', 'in_review', 'reviewed', 'archived')
    ),
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    upvotes_count INTEGER NOT NULL DEFAULT 0,
    reviews_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_public_category ON public.projects(category, created_at DESC) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Read: Owner can view own projects; public can view if is_public = true
CREATE POLICY "Projects select policy"
    ON public.projects
    FOR SELECT
    USING (auth.uid() = user_id OR is_public = TRUE);

-- Write: Only authenticated owners can create or edit
CREATE POLICY "Projects insert policy"
    ON public.projects
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Projects update policy"
    ON public.projects
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Projects delete policy"
    ON public.projects
    FOR DELETE
    USING (auth.uid() = user_id);


-- 2. Project Attachments Table
CREATE TABLE IF NOT EXISTS public.project_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL CHECK (file_size <= 10485760), -- Max 10MB
    mime_type VARCHAR(100) NOT NULL,
    storage_path TEXT NOT NULL,
    content_excerpt TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_project_attachments_project ON public.project_attachments(project_id, created_at DESC);

ALTER TABLE public.project_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project attachments select policy"
    ON public.project_attachments
    FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Project attachments insert policy"
    ON public.project_attachments
    FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Project attachments delete policy"
    ON public.project_attachments
    FOR DELETE
    USING (auth.uid() = owner_id);


-- 3. AI Reviews Execution Runs Table
CREATE TABLE IF NOT EXISTS public.ai_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    model_id VARCHAR(80) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'queued' CHECK (
        status IN ('queued', 'processing', 'completed', 'failed')
    ),
    error_message TEXT,
    execution_duration_ms INTEGER,
    input_token_count INTEGER,
    output_token_count INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ai_reviews_project ON public.ai_reviews(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_reviews_status ON public.ai_reviews(status);

ALTER TABLE public.ai_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "AI reviews access policy"
    ON public.ai_reviews
    FOR SELECT
    USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = project_id AND p.is_public = TRUE
        )
    );

CREATE POLICY "AI reviews insert policy"
    ON public.ai_reviews
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "AI reviews update policy"
    ON public.ai_reviews
    FOR UPDATE
    USING (auth.uid() = user_id);


-- 4. Feedback Reports Container Table
CREATE TABLE IF NOT EXISTS public.feedback_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL UNIQUE REFERENCES public.ai_reviews(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    executive_summary TEXT NOT NULL,
    strengths_summary TEXT NOT NULL,
    total_findings_count INTEGER NOT NULL DEFAULT 0,
    blockers_count INTEGER NOT NULL DEFAULT 0,
    high_count INTEGER NOT NULL DEFAULT 0,
    medium_count INTEGER NOT NULL DEFAULT 0,
    low_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_feedback_reports_project ON public.feedback_reports(project_id, created_at DESC);

ALTER TABLE public.feedback_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Feedback reports access policy"
    ON public.feedback_reports
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = project_id AND (p.user_id = auth.uid() OR p.is_public = TRUE)
        )
    );

CREATE POLICY "Feedback reports insert policy"
    ON public.feedback_reports
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = project_id AND p.user_id = auth.uid()
        )
    );


-- 5. Feedback Findings Table (Granular Actionable Observations)
CREATE TABLE IF NOT EXISTS public.feedback_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.feedback_reports(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    severity VARCHAR(30) NOT NULL CHECK (
        severity IN ('blocker', 'high', 'medium', 'low')
    ),
    category VARCHAR(50) NOT NULL CHECK (
        category IN ('ux', 'performance', 'security', 'bug', 'architecture', 'accessibility')
    ),
    observation TEXT NOT NULL,
    evidence_quote TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'open' CHECK (
        status IN ('open', 'in_progress', 'addressed')
    ),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_feedback_findings_report ON public.feedback_findings(report_id, severity);
CREATE INDEX IF NOT EXISTS idx_feedback_findings_project_status ON public.feedback_findings(project_id, status);

ALTER TABLE public.feedback_findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Feedback findings select policy"
    ON public.feedback_findings
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = project_id AND (p.user_id = auth.uid() OR p.is_public = TRUE)
        )
    );

CREATE POLICY "Feedback findings update policy"
    ON public.feedback_findings
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = project_id AND p.user_id = auth.uid()
        )
    );

