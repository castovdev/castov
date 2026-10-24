-- ==============================================================================
-- Castov Cloud Suite Database Schema & Row-Level Security (RLS)
-- Migration: 20261024_castov_cloud_suite.sql
-- Covers: Newsletter Subscribers, Cloud MCP Stacks, Telemetry Analytics, and
--         Zero-Knowledge End-to-End Encrypted Environment Vaults.
-- ==============================================================================

-- 1. NEWSLETTER SUBSCRIBERS
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'subscribed',
    source TEXT DEFAULT 'castov_footer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow public insertion (1-click subscribe from web/footer)
CREATE POLICY "Allow public insert into newsletter_subscribers"
    ON public.newsletter_subscribers
    FOR INSERT
    WITH CHECK (true);

-- Allow reading/updating own subscription status if email matches user
CREATE POLICY "Allow users to read own subscription"
    ON public.newsletter_subscribers
    FOR SELECT
    USING (
        auth.role() = 'service_role' OR
        lower(trim(auth.jwt() ->> 'email')) = lower(trim(email)) OR
        lower(trim(auth.jwt() ->> 'email')) = 'abdelmalikbenidir@gmail.com'
    );

CREATE POLICY "Allow users to update own subscription"
    ON public.newsletter_subscribers
    FOR UPDATE
    USING (
        auth.role() = 'service_role' OR
        lower(trim(auth.jwt() ->> 'email')) = lower(trim(email)) OR
        lower(trim(auth.jwt() ->> 'email')) = 'abdelmalikbenidir@gmail.com'
    );


-- 2. SAVED MCP STACKS (Cloud Presets for Claude Desktop, Cursor & Windsurf)
CREATE TABLE IF NOT EXISTS public.mcp_stacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    servers JSONB NOT NULL DEFAULT '["castov"]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_mcp_stacks_user_name UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_mcp_stacks_user ON public.mcp_stacks (user_id);

ALTER TABLE public.mcp_stacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own MCP stacks"
    ON public.mcp_stacks
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- 3. ANALYTICS EVENTS (Telemetry for MCP copies, rerun tools, client inspections)
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name TEXT NOT NULL,
    properties JSONB DEFAULT '{}'::jsonb,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON public.analytics_events (event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON public.analytics_events (created_at DESC);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Telemetry events can be inserted by any client (anon or authenticated)
CREATE POLICY "Allow anonymous and authenticated telemetry insert"
    ON public.analytics_events
    FOR INSERT
    WITH CHECK (true);

-- RESTRICT SELECT: strictly restricted to owner email only (abdelmalikbenidir@gmail.com)
CREATE POLICY "Owner only select on analytics_events"
    ON public.analytics_events
    FOR SELECT
    USING (
        auth.role() = 'service_role' OR
        lower(trim(auth.jwt() ->> 'email')) = 'abdelmalikbenidir@gmail.com'
    );


-- 4. ZERO-KNOWLEDGE ENV VAULTS (E2EE Client-Side Encrypted Secrets)
-- Note: ciphertext, iv, and salt are 100% client-side encrypted before insertion.
-- Plaintext secrets and passphrases are NEVER sent or stored in this table.
CREATE TABLE IF NOT EXISTS public.env_vaults (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    name TEXT NOT NULL,
    ciphertext TEXT NOT NULL,
    iv TEXT NOT NULL,
    salt TEXT NOT NULL,
    encrypted_payload TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_env_vaults_user_slug UNIQUE (user_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_env_vaults_user_slug ON public.env_vaults (user_id, slug);

ALTER TABLE public.env_vaults ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own encrypted env vaults"
    ON public.env_vaults
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
