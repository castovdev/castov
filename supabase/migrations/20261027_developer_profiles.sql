-- ==============================================================================
-- Migration: 20261027_developer_profiles.sql
-- Description: Public Developer Profiles for Castov (e.g. castov.com/user/benidir)
-- Enables public developer identity, customizable handles, bio, social links,
-- and showcase of favorite tools & public MCP stacks with strict Row-Level Security.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    headline TEXT DEFAULT 'Full-Stack Web Architect',
    bio TEXT DEFAULT '',
    avatar_url TEXT,
    website_url TEXT,
    github_url TEXT,
    twitter_url TEXT,
    pinned_tools JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_public BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT username_format CHECK (username ~* '^[a-zA-Z0-9_-]{3,30}$')
);

-- Case-insensitive search index on username
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_lower_username ON public.profiles (lower(trim(username)));

-- Enable Row-Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1. Public Read Policy: Anyone can view public profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles
    FOR SELECT
    USING (is_public = true OR auth.uid() = id);

-- 2. Owner Insert Policy: Users can create their own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 3. Owner Update Policy: Users can update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 4. Service Role Full Access
DROP POLICY IF EXISTS "Service role has full access to profiles" ON public.profiles;
CREATE POLICY "Service role has full access to profiles"
    ON public.profiles
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
