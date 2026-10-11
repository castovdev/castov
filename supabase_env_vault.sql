-- Run this in your Supabase SQL Editor to secure Env Vault and enable automatic cleanup

-- 1. Create table if not already present with payload size limit (max 100KB)
CREATE TABLE IF NOT EXISTS public.env_vaults (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  encrypted_payload TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days') NOT NULL,
  CONSTRAINT env_vaults_payload_size_limit CHECK (octet_length(encrypted_payload) <= 100000)
);

-- Index on id and expires_at for fast lookups & pruning
CREATE INDEX IF NOT EXISTS idx_env_vaults_expires_at ON public.env_vaults (expires_at);

-- 2. Restrict Direct Row Level Security (RLS)
ALTER TABLE public.env_vaults ENABLE ROW LEVEL SECURITY;

-- Drop insecure open-read policy
DROP POLICY IF EXISTS "Anyone can read" ON public.env_vaults;
DROP POLICY IF EXISTS "Anyone can insert" ON public.env_vaults;
DROP POLICY IF EXISTS "Deny all direct select" ON public.env_vaults;

-- Allow anonymous insertion of encrypted payloads with strict 100KB size limit
CREATE POLICY "Anyone can insert" 
ON public.env_vaults FOR INSERT 
WITH CHECK (octet_length(encrypted_payload) <= 100000);

-- Deny direct SELECT from client queries (prevents table dump via anon key)
-- Direct reads on public.env_vaults are blocked for anon & authenticated roles:
CREATE POLICY "Deny all direct select" 
ON public.env_vaults FOR SELECT 
USING (false);

-- 3. Controlled RPC Function to fetch ONLY by exact ID (and only if not expired)
CREATE OR REPLACE FUNCTION public.get_env_vault_payload(target_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payload TEXT;
BEGIN
  SELECT encrypted_payload INTO payload
  FROM public.env_vaults
  WHERE id = target_id
    AND expires_at > NOW();

  RETURN payload;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_env_vault_payload(UUID) TO anon, authenticated;

-- 4. Function for Automatic Cleanup of Expired Vaults
CREATE OR REPLACE FUNCTION public.cleanup_expired_env_vaults()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.env_vaults
  WHERE expires_at <= NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- 5. Enable pg_cron and schedule daily cleanup at 03:00 UTC
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'daily-cleanup-expired-vaults',
  '0 3 * * *',
  $$SELECT public.cleanup_expired_env_vaults();$$
);
