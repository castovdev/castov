import crypto from "crypto";
import type { User } from "@supabase/supabase-js";

/**
 * Server-side owner check for private admin surfaces.
 * - ADMIN_EMAIL must be configured; if unset, nobody is the owner (fail closed).
 * - Only trusts a session whose email has been verified by Supabase Auth.
 * - Case-insensitive, constant-time comparison.
 */
export function getConfiguredOwnerEmail(): string | null {
  const raw = process.env.ADMIN_EMAIL;
  if (!raw || !raw.trim()) return null;
  return raw.trim().toLowerCase();
}

export function isVerifiedOwner(user: User | null | undefined): boolean {
  const owner = getConfiguredOwnerEmail();
  if (!owner || !user?.email) return false;
  if (!user.email_confirmed_at) return false;

  const a = Buffer.from(user.email.trim().toLowerCase());
  const b = Buffer.from(owner);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
