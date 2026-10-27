import { createClient } from "@supabase/supabase-js";

/**
 * Creates an administrative Supabase client using SUPABASE_SERVICE_ROLE_KEY.
 * Strictly used in server-side API routes and scheduled cron tasks.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rnzgvtsyrhravmqonmhd.supabase.co";
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "sb_publishable_SMCdiXEJCRZNtTVGtqzbgQ_MPThOPKR";

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
