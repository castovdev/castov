-- ==============================================================================
-- Castov Schema Hardening: Separation of Ephemeral Shared Vaults from Cloud Vaults
-- Migration: 20261027_shared_env_vaults.sql
-- Fixes: CRYPTO-03 (Resolves env_vaults table name conflict)
-- ==============================================================================

-- 1. Create dedicated table for ephemeral 7-day shared environment vaults
CREATE TABLE IF NOT EXISTS public.shared_env_vaults (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encrypted_payload TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + INTERVAL '7 days'),
    CONSTRAINT shared_env_vaults_payload_size_limit CHECK (octet_length(encrypted_payload) <= 100000)
);

-- Index on expires_at for efficient cleanup and lookups
CREATE INDEX IF NOT EXISTS idx_shared_env_vaults_expires_at ON public.shared_env_vaults (expires_at);

-- 2. Non-destructive Data Migration from legacy env_vaults if applicable
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'env_vaults' 
          AND column_name = 'expires_at'
    ) THEN
        INSERT INTO public.shared_env_vaults (id, encrypted_payload, created_at, expires_at)
        SELECT id, encrypted_payload, created_at, expires_at 
        FROM public.env_vaults 
        WHERE expires_at IS NOT NULL
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- 3. Row Level Security for shared_env_vaults
ALTER TABLE public.shared_env_vaults ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert into shared_env_vaults" ON public.shared_env_vaults;
DROP POLICY IF EXISTS "Deny all direct select on shared_env_vaults" ON public.shared_env_vaults;

-- Allow anonymous insertion of encrypted payloads (max 100KB)
CREATE POLICY "Anyone can insert into shared_env_vaults"
    ON public.shared_env_vaults
    FOR INSERT
    WITH CHECK (octet_length(encrypted_payload) <= 100000);

-- Deny direct SELECT from client queries to prevent whole-table scraping
CREATE POLICY "Deny all direct select on shared_env_vaults"
    ON public.shared_env_vaults
    FOR SELECT
    USING (false);

-- 4. Controlled RPC to fetch by exact UUID (only unexpired payloads)
CREATE OR REPLACE FUNCTION public.get_shared_env_vault_payload(target_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    found_payload TEXT;
BEGIN
    SELECT encrypted_payload INTO found_payload
    FROM public.shared_env_vaults
    WHERE id = target_id
      AND expires_at > timezone('utc'::text, now());

    RETURN found_payload;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_shared_env_vault_payload(UUID) TO anon, authenticated, service_role;

-- 5. Backward Compatibility Shim: Maintain legacy function alias for older links
CREATE OR REPLACE FUNCTION public.get_env_vault_payload(target_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    found_payload TEXT;
BEGIN
    -- 1. Check shared_env_vaults first
    SELECT encrypted_payload INTO found_payload
    FROM public.shared_env_vaults
    WHERE id = target_id
      AND expires_at > timezone('utc'::text, now());

    IF found_payload IS NOT NULL THEN
        RETURN found_payload;
    END IF;

    -- 2. Fallback check on legacy env_vaults if it had expires_at
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'env_vaults' 
          AND column_name = 'expires_at'
    ) THEN
        EXECUTE 'SELECT encrypted_payload FROM public.env_vaults WHERE id = $1 AND expires_at > timezone(''utc''::text, now())'
        INTO found_payload
        USING target_id;
    END IF;

    RETURN found_payload;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_env_vault_payload(UUID) TO anon, authenticated, service_role;

-- 6. Scheduled Cleanup Function for Expired Shared Vaults
CREATE OR REPLACE FUNCTION public.cleanup_expired_shared_env_vaults()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.shared_env_vaults
    WHERE expires_at <= timezone('utc'::text, now());
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;
