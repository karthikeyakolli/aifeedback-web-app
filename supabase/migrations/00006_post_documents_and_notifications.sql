-- =============================================================================
-- Migration: 00006_post_documents_and_notifications.sql
-- Description: Notifications for community interactions and Project Creator Attached Documents.
-- Tables: public.notifications, public.post_documents
-- =============================================================================

-- 1. Real-time Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    type VARCHAR(30) NOT NULL CHECK (
        type IN ('reply', 'comment', 'ai_ready', 'upvote', 'moderation', 'system')
    ),
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    link_url VARCHAR(255) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
    ON public.notifications
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
    ON public.notifications
    FOR UPDATE
    USING (auth.uid() = user_id);

-- 2. Project Creator Uploaded Documents Table (PDFs, Markdown Specs, Pitch Decks)
CREATE TABLE IF NOT EXISTS public.post_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL,
    content_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_post_documents_post ON public.post_documents(post_id, created_at DESC);

ALTER TABLE public.post_documents ENABLE ROW LEVEL SECURITY;

-- Post owners and moderators can view attached documentation
CREATE POLICY "Post owners and moderators can view documents"
    ON public.post_documents
    FOR SELECT
    USING (
        auth.uid() = owner_id OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_moderator = TRUE
        )
    );

-- Post owners and moderators can insert attached documentation
CREATE POLICY "Post owners and moderators can attach documents"
    ON public.post_documents
    FOR INSERT
    WITH CHECK (
        auth.uid() = owner_id OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_moderator = TRUE
        )
    );

-- Post owners and moderators can delete attached documentation
CREATE POLICY "Post owners and moderators can delete documents"
    ON public.post_documents
    FOR DELETE
    USING (
        auth.uid() = owner_id OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_moderator = TRUE
        )
    );

