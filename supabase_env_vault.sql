-- Run this in your Supabase SQL Editor to secure Env Vault and enable automatic cleanup
-- Schema: public.shared_env_vaults (for ephemeral 7-day shared vaults)

-- 1. Create table if not already present with payload size limit (max 100KB)
CREATE TABLE IF NOT EXISTS public.shared_env_vaults (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  encrypted_payload TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days') NOT NULL,
  CONSTRAINT shared_env_vaults_payload_size_limit CHECK (octet_length(encrypted_payload) <= 100000)
);

-- Index on id and expires_at for fast lookups & pruning
CREATE INDEX IF NOT EXISTS idx_shared_env_vaults_expires_at ON public.shared_env_vaults (expires_at);

-- 2. Restrict Direct Row Level Security (RLS)
ALTER TABLE public.shared_env_vaults ENABLE ROW LEVEL SECURITY;

-- Allow anonymous insertion of encrypted payloads with strict 100KB size limit
DROP POLICY IF EXISTS "Anyone can insert into shared_env_vaults" ON public.shared_env_vaults;
CREATE POLICY "Anyone can insert into shared_env_vaults"
ON public.shared_env_vaults FOR INSERT
WITH CHECK (octet_length(encrypted_payload) <= 100000);

-- Deny direct SELECT from client queries (prevents table dump via anon key)
DROP POLICY IF EXISTS "Deny all direct select on shared_env_vaults" ON public.shared_env_vaults;
CREATE POLICY "Deny all direct select on shared_env_vaults"
ON public.shared_env_vaults FOR SELECT
USING (false);

-- 3. Controlled RPC Function to fetch ONLY by exact ID (and only if not expired)
CREATE OR REPLACE FUNCTION public.get_shared_env_vault_payload(target_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payload TEXT;
BEGIN
  SELECT encrypted_payload INTO payload
  FROM public.shared_env_vaults
  WHERE id = target_id
    AND expires_at > NOW();

  RETURN payload;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_shared_env_vault_payload(UUID) TO anon, authenticated;

-- 4. Backward Compatibility Alias: get_env_vault_payload
CREATE OR REPLACE FUNCTION public.get_env_vault_payload(target_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.get_shared_env_vault_payload(target_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_env_vault_payload(UUID) TO anon, authenticated;

-- 5. Function for Automatic Cleanup of Expired Vaults
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
  WHERE expires_at <= NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- 6. Enable pg_cron and schedule daily cleanup at 03:00 UTC (Optional)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule(
--   'daily-cleanup-expired-shared-vaults',
--   '0 3 * * *',
--   $$SELECT public.cleanup_expired_shared_env_vaults();$$
-- );
