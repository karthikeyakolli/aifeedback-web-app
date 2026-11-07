-- 00014_phase_5_changelogs_and_web_intelligence.sql
-- Phase 5: Creator Feedback-to-Changelog Loop & Web Intelligence Cache

-- 1. Project Changelog Entries Table
CREATE TABLE IF NOT EXISTS project_changelog_entries (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    version_tag TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    finding_id TEXT,
    is_public INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_changelog_project_id ON project_changelog_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_changelog_created_at ON project_changelog_entries(created_at DESC);

ALTER TABLE project_changelog_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published changelogs" ON project_changelog_entries
    FOR SELECT USING (is_public = 1);

CREATE POLICY "Creators manage their project changelogs" ON project_changelog_entries
    FOR ALL USING (auth.uid()::text = user_id);

-- 2. Web Intelligence Cache Table (for 24h caching of external standards and queries)
CREATE TABLE IF NOT EXISTS web_intelligence_cache (
    query_hash TEXT PRIMARY KEY,
    query_text TEXT NOT NULL,
    results_json TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_web_cache_expires_at ON web_intelligence_cache(expires_at);

-- 3. Update notifications type constraint to support project_review
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
    CHECK (type IN ('reply', 'comment', 'project_review', 'upvote', 'ai_ready', 'moderation', 'system'));

