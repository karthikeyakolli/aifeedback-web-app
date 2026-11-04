-- Migration 00011: Project Source Ingestion, Advanced RAG, Intelligence Graph, and Improvement Workflow
-- Supports Phases 4 through 10 of AI Project Feedback

-- 1. Project Sources & Ingestion
CREATE TABLE IF NOT EXISTS project_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL CHECK (source_type IN ('file', 'archive', 'github_repo', 'gitlab_repo', 'spec_doc', 'screenshot')),
    name TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    mime_type TEXT NOT NULL DEFAULT 'text/plain',
    storage_path TEXT NOT NULL DEFAULT '',
    content_text TEXT NOT NULL DEFAULT '',
    metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);
CREATE INDEX IF NOT EXISTS idx_project_sources_proj ON project_sources(project_id, is_active, created_at DESC);

-- 2. Project Source Snapshots (Immutable Review Baselines)
CREATE TABLE IF NOT EXISTS project_source_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES ai_reviews(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    snapshot_data_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);
CREATE INDEX IF NOT EXISTS idx_project_source_snapshots_rev ON project_source_snapshots(review_id);

-- 3. Advanced RAG Knowledge Base Chunks
CREATE TABLE IF NOT EXISTS project_knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    source_id UUID NOT NULL REFERENCES project_sources(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    clean_content TEXT NOT NULL,
    token_count INTEGER NOT NULL DEFAULT 0,
    embedding_vector JSONB NOT NULL DEFAULT '[]'::jsonb,
    page_number INTEGER,
    section_heading TEXT,
    line_start INTEGER,
    line_end INTEGER,
    metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);
CREATE INDEX IF NOT EXISTS idx_proj_kb_chunks_proj ON project_knowledge_chunks(project_id);
CREATE INDEX IF NOT EXISTS idx_proj_kb_chunks_source ON project_knowledge_chunks(source_id);

CREATE TABLE IF NOT EXISTS reference_knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL CHECK (category IN ('architecture', 'ux', 'performance', 'security', 'accessibility', 'general')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    clean_content TEXT NOT NULL,
    embedding_vector JSONB NOT NULL DEFAULT '[]'::jsonb,
    tags_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);
CREATE INDEX IF NOT EXISTS idx_ref_kb_chunks_cat ON reference_knowledge_chunks(category);

-- 4. AI Provider Configurations & Usage Ledger
CREATE TABLE IF NOT EXISTS project_provider_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    task_type TEXT NOT NULL CHECK (task_type IN ('review', 'chat', 'completeness_map', 'verification')),
    primary_provider TEXT NOT NULL CHECK (primary_provider IN ('gemini', 'openrouter', 'nvidia', 'groq', 'deterministic')),
    fallback_provider TEXT CHECK (fallback_provider IN ('gemini', 'openrouter', 'nvidia', 'groq', 'deterministic')),
    model_override TEXT,
    temperature NUMERIC(3,2) NOT NULL DEFAULT 0.20,
    max_tokens INTEGER NOT NULL DEFAULT 4096,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE(project_id, task_type)
);

CREATE TABLE IF NOT EXISTS ai_usage_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    review_id UUID REFERENCES ai_reviews(id) ON DELETE SET NULL,
    provider TEXT NOT NULL,
    model_id TEXT NOT NULL,
    task_type TEXT NOT NULL,
    prompt_tokens INTEGER NOT NULL DEFAULT 0,
    completion_tokens INTEGER NOT NULL DEFAULT 0,
    estimated_cost_usd NUMERIC(10,6) NOT NULL DEFAULT 0.000000,
    duration_ms INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'success',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_usage_ledger(user_id, created_at DESC);

-- 5. Product Completeness Graph Nodes & Edges
CREATE TABLE IF NOT EXISTS product_completeness_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    node_type TEXT NOT NULL CHECK (node_type IN ('goal', 'problem', 'persona', 'journey', 'feature', 'requirement', 'screen', 'api', 'database_entity', 'security_policy', 'test_spec')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'complete' CHECK (status IN ('complete', 'incomplete', 'missing', 'contradictory')),
    confidence_score NUMERIC(4,3) NOT NULL DEFAULT 1.000,
    source_chunk_ids_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);
CREATE INDEX IF NOT EXISTS idx_prod_nodes_proj ON product_completeness_nodes(project_id, node_type);

CREATE TABLE IF NOT EXISTS product_completeness_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    source_node_id UUID NOT NULL REFERENCES product_completeness_nodes(id) ON DELETE CASCADE,
    target_node_id UUID NOT NULL REFERENCES product_completeness_nodes(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL CHECK (relationship_type IN ('addresses', 'depends_on', 'implements', 'verifies', 'conflicts_with')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);
CREATE INDEX IF NOT EXISTS idx_prod_edges_proj ON product_completeness_edges(project_id);

CREATE TABLE IF NOT EXISTS product_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    node_id UUID NOT NULL REFERENCES product_completeness_nodes(id) ON DELETE CASCADE,
    decision_type TEXT NOT NULL CHECK (decision_type IN ('approved', 'dismissed', 'deferred', 'custom')),
    rationale TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 6. Project Chat & Improvement Tasks
CREATE TABLE IF NOT EXISTS project_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    chat_scope TEXT NOT NULL DEFAULT 'project_wide' CHECK (chat_scope IN ('project_wide', 'review_specific', 'finding_specific')),
    target_review_id UUID REFERENCES ai_reviews(id) ON DELETE SET NULL,
    target_finding_id UUID REFERENCES feedback_findings(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);
CREATE INDEX IF NOT EXISTS idx_project_chats_proj ON project_chats(project_id, user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS project_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES project_chats(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    citations_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    classification TEXT NOT NULL DEFAULT 'general' CHECK (classification IN ('decision', 'question', 'clarification', 'code_generation', 'general')),
    metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);
CREATE INDEX IF NOT EXISTS idx_project_chat_messages_chat ON project_chat_messages(chat_id, created_at ASC);

CREATE TABLE IF NOT EXISTS improvement_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    finding_id UUID REFERENCES feedback_findings(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    action_type TEXT NOT NULL DEFAULT 'accept' CHECK (action_type IN ('accept', 'edit', 'reject', 'defer')),
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed', 'verified')),
    verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'passed', 'failed')),
    verification_feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);
CREATE INDEX IF NOT EXISTS idx_improvement_tasks_proj ON improvement_tasks(project_id, status);

-- Enable Row Level Security (RLS) on all new tables
ALTER TABLE project_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_source_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reference_knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_provider_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_completeness_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_completeness_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE improvement_tasks ENABLE ROW LEVEL SECURITY;

-- Owner Isolation Policies
CREATE POLICY "Users can manage own project sources"
ON project_sources FOR ALL
USING (auth.uid() = owner_id);

CREATE POLICY "Users can manage own project chats"
ON project_chats FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own improvement tasks"
ON improvement_tasks FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Users view own usage ledger"
ON ai_usage_ledger FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view reference knowledge"
ON reference_knowledge_chunks FOR SELECT
USING (true);

