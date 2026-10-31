/**
 * In-Memory Zero-Knowledge Key Session Manager
 * Ensures private keys only exist in browser memory during active use (extractable: false).
 * Eliminates plaintext storage in localStorage.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { WrappedPrivateKeyBundle } from "./crypto-team";

interface SessionEntry {
  key: CryptoKey;
  expiresAt: number;
  ttlMs: number;
  timer: any;
}

// Default inactivity timeout: 30 minutes
export const DEFAULT_KEY_SESSION_TTL_MS = 30 * 60 * 1000;

// Ephemeral in-memory key storage mapped by user ID with automatic inactivity timeout
const inMemoryPrivateKeys = new Map<string, SessionEntry>();

export function getInMemoryPrivateKey(userId: string): CryptoKey | null {
  const entry = inMemoryPrivateKeys.get(userId);
  if (!entry) return null;

  const now = Date.now();
  if (now > entry.expiresAt) {
    clearInMemoryPrivateKey(userId);
    return null;
  }

  // Active touch: sliding expiration window on active use
  entry.expiresAt = now + entry.ttlMs;
  if (entry.timer) clearTimeout(entry.timer);
  entry.timer = setTimeout(() => {
    clearInMemoryPrivateKey(userId);
  }, entry.ttlMs);
  if (typeof entry.timer?.unref === "function") {
    entry.timer.unref();
  }

  return entry.key;
}

export function setInMemoryPrivateKey(
  userId: string,
  key: CryptoKey,
  ttlMs: number = DEFAULT_KEY_SESSION_TTL_MS
): void {
  // Clear any existing session timer
  const existing = inMemoryPrivateKeys.get(userId);
  if (existing?.timer) clearTimeout(existing.timer);

  const timer = setTimeout(() => {
    clearInMemoryPrivateKey(userId);
  }, ttlMs);
  if (typeof timer?.unref === "function") {
    timer.unref();
  }

  inMemoryPrivateKeys.set(userId, {
    key,
    expiresAt: Date.now() + ttlMs,
    ttlMs,
    timer,
  });
}

export function clearInMemoryPrivateKey(userId: string): void {
  const entry = inMemoryPrivateKeys.get(userId);
  if (entry?.timer) clearTimeout(entry.timer);
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
