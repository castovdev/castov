-- Migration: User Zero-Knowledge Keys & Team Key Rotation
-- Description: Stores passphrase-wrapped private keys for cross-device sync and adds key_version tracking for rotation.

-- 1. User Security Keys (Encrypted Private Key Bundle & Public Key)
CREATE TABLE IF NOT EXISTS public.user_security_keys (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    public_key TEXT NOT NULL, -- User's RSA-OAEP Public Key (Base64 SPKI)
    encrypted_private_key_bundle JSONB NOT NULL, -- PBKDF2(600k) + AES-GCM-256 wrapped private key
    encrypted_recovery_bundle TEXT, -- Optional recovery-key encrypted private key
    key_version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_security_keys ENABLE ROW LEVEL SECURITY;

-- 2. Strict RLS Policies for user_security_keys
-- Strict Owner-Only Policy: A user can only view, insert, or update their OWN private key bundle!
CREATE POLICY "Users can manage own security keys" ON public.user_security_keys
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 3. Secure Public Function to retrieve a user's public key (for team member invitations)
-- Returns ONLY the public_key, never exposing the encrypted_private_key_bundle to other users.
CREATE OR REPLACE FUNCTION public.get_user_public_key(target_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    found_key TEXT;
BEGIN
    SELECT public_key INTO found_key
    FROM public.user_security_keys
    WHERE user_id = target_user_id;
    
    RETURN found_key;
END;
$$;

-- 4. Key Rotation Support Columns
-- Add key_version to team_members if not present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'team_members' 
        AND column_name = 'key_version'
    ) THEN
        ALTER TABLE public.team_members ADD COLUMN key_version INTEGER NOT NULL DEFAULT 1;
    END IF;
END $$;

-- Add key_version to team_vaults if not present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'team_vaults' 
        AND column_name = 'key_version'
    ) THEN
        ALTER TABLE public.team_vaults ADD COLUMN key_version INTEGER NOT NULL DEFAULT 1;
    END IF;
END $$;
