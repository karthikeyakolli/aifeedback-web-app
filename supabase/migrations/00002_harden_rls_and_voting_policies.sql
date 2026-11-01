-- =============================================================================
-- Migration: 00002_harden_rls_and_voting_policies.sql
-- Description: Non-destructive hardening for Row-Level Security (RLS), vote
-- updates, report moderation visibility, and automatic user profile sync.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Automatic User Profile Sync on Supabase Auth Sign-up
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        username,
        display_name,
        avatar_url,
        bio,
        reputation_score,
        is_moderator,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'username',
            split_part(NEW.email, '@', 1),
            'user_' || substr(NEW.id::text, 1, 8)
        ),
        COALESCE(
            NEW.raw_user_meta_data->>'display_name',
            NEW.raw_user_meta_data->>'full_name',
            split_part(NEW.email, '@', 1),
            'Community Member'
        ),
        NEW.raw_user_meta_data->>'avatar_url',
        '',
        10,
        FALSE,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger idempotently
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- -----------------------------------------------------------------------------
-- 2. Vote Update Policies (Allow toggling vote types without deletion)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can update their own post votes" ON public.post_votes;
CREATE POLICY "Users can update their own post votes"
    ON public.post_votes FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own comment votes" ON public.comment_votes;
CREATE POLICY "Users can update their own comment votes"
    ON public.comment_votes FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 3. Moderation Reports Policies (Privacy protection & Moderator access)
-- -----------------------------------------------------------------------------
-- Ensure non-moderator users can NEVER query reports submitted by others
DROP POLICY IF EXISTS "Moderators can view reports" ON public.reports;
CREATE POLICY "Moderators can view reports"
    ON public.reports FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_moderator = TRUE
        )
    );

DROP POLICY IF EXISTS "Moderators can update reports" ON public.reports;
CREATE POLICY "Moderators can update reports"
    ON public.reports FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_moderator = TRUE
        )
    );

-- -----------------------------------------------------------------------------
-- 4. Anonymity Immutability Guard Trigger
-- -----------------------------------------------------------------------------
-- Prevent de-anonymization or retroactive anonymity altering on posts and comments
CREATE OR REPLACE FUNCTION public.prevent_anonymity_tampering()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.is_anonymous IS DISTINCT FROM NEW.is_anonymous) THEN
        RAISE EXCEPTION 'Anonymity setting is immutable once published to protect community privacy.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_post_anonymity_change ON public.posts;
CREATE TRIGGER trg_prevent_post_anonymity_change
    BEFORE UPDATE ON public.posts
    FOR EACH ROW EXECUTE FUNCTION public.prevent_anonymity_tampering();

DROP TRIGGER IF EXISTS trg_prevent_comment_anonymity_change ON public.comments;
CREATE TRIGGER trg_prevent_comment_anonymity_change
    BEFORE UPDATE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.prevent_anonymity_tampering();
