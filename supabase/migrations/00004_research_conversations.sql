-- =============================================================================
-- Migration: 00004_research_conversations.sql
-- Description: Creates conversation_sessions and conversation_messages tables
-- with user-isolated RLS policies for interactive AI research chat.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.conversation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Research Discussion',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.conversation_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.conversation_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    citations JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fast lookup of user's research chat sessions by post
CREATE INDEX IF NOT EXISTS idx_conv_sessions_user_post
    ON public.conversation_sessions(user_id, post_id, updated_at DESC);

-- Fast sequential lookup of messages within a conversation session
CREATE INDEX IF NOT EXISTS idx_conv_messages_session_created
    ON public.conversation_messages(session_id, created_at ASC);

-- Enable Row Level Security
ALTER TABLE public.conversation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- RLS: conversation_sessions (Strict User Isolation)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own chat sessions" ON public.conversation_sessions;
CREATE POLICY "Users can view their own chat sessions"
    ON public.conversation_sessions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own chat sessions" ON public.conversation_sessions;
CREATE POLICY "Users can create their own chat sessions"
    ON public.conversation_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own chat sessions" ON public.conversation_sessions;
CREATE POLICY "Users can update their own chat sessions"
    ON public.conversation_sessions FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own chat sessions" ON public.conversation_sessions;
CREATE POLICY "Users can delete their own chat sessions"
    ON public.conversation_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- RLS: conversation_messages (Strict Session Owner Isolation)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view messages in their own sessions" ON public.conversation_messages;
CREATE POLICY "Users can view messages in their own sessions"
    ON public.conversation_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_sessions
            WHERE id = session_id AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert messages into their own sessions" ON public.conversation_messages;
CREATE POLICY "Users can insert messages into their own sessions"
    ON public.conversation_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversation_sessions
            WHERE id = session_id AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete messages in their own sessions" ON public.conversation_messages;
CREATE POLICY "Users can delete messages in their own sessions"
    ON public.conversation_messages FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_sessions
            WHERE id = session_id AND user_id = auth.uid()
        )
    );
