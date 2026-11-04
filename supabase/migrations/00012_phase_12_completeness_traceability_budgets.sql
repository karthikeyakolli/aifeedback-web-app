-- Migration 00012: Phase 12 Completeness Taxonomy, Evidence Traceability, Budgets, and Git Sync
-- Expands node types, edge relationships, gap states, evidence citations, spending budgets, and repository synchronization.

-- 1. Finding Evidence Citations (Normalized Traceability)
CREATE TABLE IF NOT EXISTS finding_evidence_citations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finding_id UUID NOT NULL REFERENCES feedback_findings(id) ON DELETE CASCADE,
    source_id UUID REFERENCES project_sources(id) ON DELETE SET NULL,
    snapshot_id UUID REFERENCES project_source_snapshots(id) ON DELETE SET NULL,
    chunk_id TEXT,
    page_number INTEGER,
    line_start INTEGER,
    line_end INTEGER,
    char_offset_start INTEGER,
    char_offset_end INTEGER,
    canonical_quote TEXT NOT NULL,
    content_hash TEXT,
    validation_result TEXT NOT NULL DEFAULT 'valid' CHECK (validation_result IN ('valid', 'mismatched', 'not_found', 'insufficient_evidence')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);
CREATE INDEX IF NOT EXISTS idx_finding_citations_finding ON finding_evidence_citations(finding_id);
CREATE INDEX IF NOT EXISTS idx_finding_citations_source ON finding_evidence_citations(source_id);

-- 2. AI Spending Budgets & Hard Spending Limits
CREATE TABLE IF NOT EXISTS ai_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    scope TEXT NOT NULL CHECK (scope IN ('account', 'project', 'task')),
    monthly_limit_usd NUMERIC(10,2) NOT NULL DEFAULT 20.00,
    warning_threshold_pct NUMERIC(5,2) NOT NULL DEFAULT 80.00,
    hard_stop_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    current_period_spend_usd NUMERIC(10,6) NOT NULL DEFAULT 0.000000,
    reserved_spend_usd NUMERIC(10,6) NOT NULL DEFAULT 0.000000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE(user_id, scope, project_id)
);
CREATE INDEX IF NOT EXISTS idx_ai_budgets_user ON ai_budgets(user_id, scope);

-- 3. Git Repository Syncs (Private Repositories & Incremental Tracking)
CREATE TABLE IF NOT EXISTS git_repository_syncs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('github', 'gitlab')),
    repo_url TEXT NOT NULL,
    branch TEXT NOT NULL DEFAULT 'main',
    last_commit_hash TEXT,
    is_private BOOLEAN NOT NULL DEFAULT FALSE,
    credential_id UUID REFERENCES user_credentials(id) ON DELETE SET NULL,
    sync_status TEXT NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('idle', 'syncing', 'synced', 'error')),
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE(project_id, repo_url)
);
CREATE INDEX IF NOT EXISTS idx_git_syncs_proj ON git_repository_syncs(project_id);

-- 4. Enable RLS on new tables
ALTER TABLE finding_evidence_citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE git_repository_syncs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view citations for their project findings"
ON finding_evidence_citations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM feedback_findings f
        JOIN projects p ON f.project_id = p.id
        WHERE f.id = finding_evidence_citations.finding_id
        AND (p.user_id = auth.uid() OR p.is_public = TRUE)
    )
);

CREATE POLICY "Users manage own budgets"
ON ai_budgets FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Users manage own git syncs"
ON git_repository_syncs FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = git_repository_syncs.project_id
        AND p.user_id = auth.uid()
    )
);

