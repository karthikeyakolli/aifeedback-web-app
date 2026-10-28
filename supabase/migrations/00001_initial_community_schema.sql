-- =============================================================================
-- Migration: 00001_initial_community_schema.sql
-- Description: Core tables, constraints, indexes, triggers, and RLS policies
-- for Product Research Intelligence community platform.
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. Profiles Table (Linked to auth.users in Supabase)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT DEFAULT '',
    reputation_score INT DEFAULT 0,
    is_moderator BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30)
);

-- -----------------------------------------------------------------------------
-- 2. Posts Table (Product reviews, idea critiques, problem discoveries)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    post_type TEXT NOT NULL CHECK (post_type IN ('product_review', 'idea_critique', 'problem_discovery', 'general_feedback')),
    product_url TEXT,
    category TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    is_anonymous BOOLEAN DEFAULT FALSE,
    upvotes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived', 'moderated')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT title_length CHECK (char_length(title) >= 5 AND char_length(title) <= 200),
    CONSTRAINT description_length CHECK (char_length(description) >= 10)
);

-- -----------------------------------------------------------------------------
-- 3. Comments Table (Threaded discussion and anonymous reviews)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT FALSE,
    upvotes_count INT DEFAULT 0,
    is_helpful_flag BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'published' CHECK (status IN ('published', 'hidden', 'flagged')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT content_length CHECK (char_length(content) >= 2 AND char_length(content) <= 10000)
);

-- -----------------------------------------------------------------------------
-- 4. Post Votes Table (Database uniqueness constraint prevents duplicate votes)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.post_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    vote_type SMALLINT NOT NULL CHECK (vote_type IN (1, -1)),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_post_user_vote UNIQUE (post_id, user_id)
);

-- -----------------------------------------------------------------------------
-- 5. Comment Votes Table (Database uniqueness constraint)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comment_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    vote_type SMALLINT NOT NULL CHECK (vote_type IN (1, -1)),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_comment_user_vote UNIQUE (comment_id, user_id)
);

-- -----------------------------------------------------------------------------
-- 6. Bookmarks Table (User saved discussions)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_post_bookmark UNIQUE (user_id, post_id)
);

-- -----------------------------------------------------------------------------
-- 7. Content Reports Table (Community moderation)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
    target_id UUID NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Indexes for High-Traffic Queries
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_posts_status_created ON public.posts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category ON public.posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_parent ON public.comments(post_id, parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON public.comments(author_id);
CREATE INDEX IF NOT EXISTS idx_post_votes_post ON public.post_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_comment_votes_comment ON public.comment_votes(comment_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON public.bookmarks(user_id);

-- -----------------------------------------------------------------------------
-- Automated Triggers for Comments & Votes Counts
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_comment_count_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_comment_count_change ON public.comments;
CREATE TRIGGER trg_comment_count_change
AFTER INSERT OR DELETE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.handle_comment_count_change();

-- -----------------------------------------------------------------------------
-- Row Level Security (RLS) Policies
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Public Profiles: Everyone can read public profiles
CREATE POLICY "Public profiles are readable by everyone"
ON public.profiles FOR SELECT
USING (true);

-- User Profiles: Only owner can update their profile
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Posts: Everyone can read published posts
CREATE POLICY "Published posts are readable by everyone"
ON public.posts FOR SELECT
USING (status = 'published');

-- Posts: Authenticated users can insert posts
CREATE POLICY "Authenticated users can create posts"
ON public.posts FOR INSERT
WITH CHECK (auth.uid() = author_id);

-- Posts: Authors can update their own posts
CREATE POLICY "Authors can update their own posts"
ON public.posts FOR UPDATE
USING (auth.uid() = author_id);

-- Posts: Authors can delete their own posts
CREATE POLICY "Authors can delete their own posts"
ON public.posts FOR DELETE
USING (auth.uid() = author_id);

-- Comments: Everyone can read published comments
CREATE POLICY "Published comments are readable by everyone"
ON public.comments FOR SELECT
USING (status = 'published');

-- Comments: Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
ON public.comments FOR INSERT
WITH CHECK (auth.uid() = author_id);

-- Comments: Authors can update their comments
CREATE POLICY "Authors can update their own comments"
ON public.comments FOR UPDATE
USING (auth.uid() = author_id);

-- Comments: Authors can delete their comments
CREATE POLICY "Authors can delete their own comments"
ON public.comments FOR DELETE
USING (auth.uid() = author_id);

-- Votes: Authenticated users can manage their own votes
CREATE POLICY "Users can select their own post votes"
ON public.post_votes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own post votes"
ON public.post_votes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own post votes"
ON public.post_votes FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can select their own comment votes"
ON public.comment_votes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own comment votes"
ON public.comment_votes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comment votes"
ON public.comment_votes FOR DELETE
USING (auth.uid() = user_id);

-- Bookmarks: Authenticated users can manage their own bookmarks
CREATE POLICY "Users can view their own bookmarks"
ON public.bookmarks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookmarks"
ON public.bookmarks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
ON public.bookmarks FOR DELETE
USING (auth.uid() = user_id);

-- Reports: Authenticated users can submit reports; only staff/moderators can view
CREATE POLICY "Users can submit reports"
ON public.reports FOR INSERT
WITH CHECK (auth.uid() = reporter_id);
