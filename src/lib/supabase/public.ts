import "server-only";
import { createClient } from "@supabase/supabase-js";
import { requireSupabase } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Supabase as an anonymous visitor, without cookies: for public data that can be cached across
 * requests ("use cache"), such as published portfolio items, and for sending leads.
 */
export function createPublicClient() {
  const { url, anonKey } = requireSupabase();
  return createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
