-- =============================================================================
-- Migration: 00008_public_and_creator_spaces.sql
-- Description: Public Space community upvoting, Creator Space maker profiles,
--              and RLS policies for published project scrutiny.
-- Phases 8 & 9 Production Database Migration
-- =============================================================================

-- 1. Extend Profiles Table for Creator Space
ALTER TABLE public.profiles 
    ADD COLUMN IF NOT EXISTS github_url TEXT,
    ADD COLUMN IF NOT EXISTS website_url TEXT,
    ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb;

-- 2. Project Upvotes Table (Community Scrutiny & Appreciation)
CREATE TABLE IF NOT EXISTS public.project_upvotes (
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_upvotes_proj ON public.project_upvotes(project_id);
CREATE INDEX IF NOT EXISTS idx_project_upvotes_user ON public.project_upvotes(user_id);

-- 3. Row Level Security on Project Upvotes
ALTER TABLE public.project_upvotes ENABLE ROW LEVEL SECURITY;

-- Allow public read of upvote counts
CREATE POLICY "Project upvotes select policy"
    ON public.project_upvotes
    FOR SELECT
    USING (TRUE);

-- Only authenticated users can insert their own upvote
CREATE POLICY "Project upvotes insert policy"
    ON public.project_upvotes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Only vote owners can delete (un-upvote)
CREATE POLICY "Project upvotes delete policy"
    ON public.project_upvotes
    FOR DELETE
    USING (auth.uid() = user_id);

-- 4. Feedback Reports Public Scrutiny Policy
-- Allow anonymous read of feedback reports only if the associated project is public
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'feedback_reports' AND policyname = 'Feedback reports public read policy'
    ) THEN
        CREATE POLICY "Feedback reports public read policy"
            ON public.feedback_reports
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.projects 
                    WHERE public.projects.id = public.feedback_reports.project_id 
                    AND public.projects.is_public = TRUE
                )
            );
    END IF;
END $$;

-- 5. Feedback Findings Public Scrutiny Policy
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'feedback_findings' AND policyname = 'Feedback findings public read policy'
    ) THEN
        CREATE POLICY "Feedback findings public read policy"
            ON public.feedback_findings
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.projects 
                    WHERE public.projects.id = public.feedback_findings.project_id 
                    AND public.projects.is_public = TRUE
                )
            );
    END IF;
END $$;

