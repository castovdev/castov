-- =========================================================================
-- Migration: User Preferences & Cross-Device Cloud Sync
-- Description: Stores user's pinned tools, workspaces, and saved tool configs for seamless multi-device sync with strict RLS.
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    pinned_tools JSONB NOT NULL DEFAULT '[]'::jsonb,
    workspaces JSONB NOT NULL DEFAULT '[{"id": "ws_personal", "name": "Personal Workspace"}]'::jsonb,
    saved_configs JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Strict Owner-Only Policy
DROP POLICY IF EXISTS "Users can manage own preferences" ON public.user_preferences;
CREATE POLICY "Users can manage own preferences" ON public.user_preferences
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
