/**
 * In-Memory Zero-Knowledge Key Session Manager
 * Ensures private keys only exist in browser memory during active use (extractable: false).
 * Eliminates plaintext storage in localStorage.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { WrappedPrivateKeyBundle } from "./crypto-team";

// Ephemeral in-memory key storage mapped by user ID
const inMemoryPrivateKeys = new Map<string, CryptoKey>();

export function getInMemoryPrivateKey(userId: string): CryptoKey | null {
  return inMemoryPrivateKeys.get(userId) || null;
}

export function setInMemoryPrivateKey(userId: string, key: CryptoKey): void {
  inMemoryPrivateKeys.set(userId, key);
}

export function clearInMemoryPrivateKey(userId: string): void {
  inMemoryPrivateKeys.delete(userId);
}

/**
 * Removes legacy plaintext private keys from localStorage if any exist from older versions.
 */
export function sanitizeLegacyPlaintextStorage(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    const legacyKey = `castov_priv_key_${userId}`;
    if (localStorage.getItem(legacyKey)) {
      localStorage.removeItem(legacyKey);
    }
  } catch (_e) {
    // Ignore storage access errors
  }
}

export interface UserSecurityKeyRecord {
  user_id: string;
  public_key: string;
  encrypted_private_key_bundle: WrappedPrivateKeyBundle;
  encrypted_recovery_bundle?: string;
  key_version: number;
}

/**
 * Loads user security keys from Supabase database.
 */
export async function fetchUserSecurityRecord(
  supabase: SupabaseClient,
  userId: string
): Promise<UserSecurityKeyRecord | null> {
  const { data, error } = await supabase
    .from("user_security_keys")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as UserSecurityKeyRecord;
}

/**
 * Stores or updates user security keys in Supabase database.
 */
export async function persistUserSecurityRecord(
  supabase: SupabaseClient,
  record: {
    user_id: string;
    public_key: string;
    encrypted_private_key_bundle: WrappedPrivateKeyBundle;
    encrypted_recovery_bundle?: string;
    key_version?: number;
  }
): Promise<void> {
  const { error } = await supabase.from("user_security_keys").upsert({
    user_id: record.user_id,
    public_key: record.public_key,
    encrypted_private_key_bundle: record.encrypted_private_key_bundle,
    encrypted_recovery_bundle: record.encrypted_recovery_bundle || null,
    key_version: record.key_version || 1,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Failed to save user security keys: ${error.message}`);
  }
}
