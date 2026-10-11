import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rnzgvtsyrhravmqonmhd.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_SMCdiXEJCRZNtTVGtqzbgQ_MPThOPKR';
  return createBrowserClient(url, anonKey);
}
