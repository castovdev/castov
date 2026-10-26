-- ==============================================================================
-- Castov Security Hardening: Personal Access Tokens & API Keys Table
-- Migration: 20261027_user_api_keys.sql
-- Fixes: CRYPTO-02 (Secure CLI PAT storage with SHA-256 hash & revocation)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.user_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    key_hash TEXT NOT NULL UNIQUE,          -- SHA-256 Hash of the raw secret token (64 hex characters)
    key_prefix TEXT NOT NULL,               -- Display prefix (e.g. "cst_live_a1b2") for safe UI identification
    name TEXT NOT NULL DEFAULT 'Personal Access Token',
    scopes TEXT[] NOT NULL DEFAULT ARRAY['vault:read', 'vault:write']::TEXT[],
    revoked BOOLEAN NOT NULL DEFAULT false,
    revoked_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_user_api_keys_hash ON public.user_api_keys (key_hash) WHERE revoked = false;
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON public.user_api_keys (user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

-- Drop any previous policies
DROP POLICY IF EXISTS "Users can manage own api keys" ON public.user_api_keys;

-- RLS Policy: Users can only see, create, update, or revoke their own API keys
CREATE POLICY "Users can manage own api keys" ON public.user_api_keys
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- RPC for secure key authentication (used by API routes via service_role or authenticated client)
CREATE OR REPLACE FUNCTION public.authenticate_api_key(target_hash TEXT)
RETURNS TABLE (
    user_id UUID,
    name TEXT,
    scopes TEXT[],
    is_valid BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        k.user_id,
        k.name,
        k.scopes,
        (k.revoked = false AND (k.expires_at IS NULL OR k.expires_at > now())) AS is_valid
    FROM public.user_api_keys k
    WHERE k.key_hash = target_hash;
END;
$$;

GRANT EXECUTE ON FUNCTION public.authenticate_api_key(TEXT) TO anon, authenticated, service_role;
