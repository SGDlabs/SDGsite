import "server-only";
import { createClient } from "@supabase/supabase-js";
import { requireSupabase, serverEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Supabase with the service role: bypasses row level security. Server only, and only after the
 * caller's role was checked (requireRole). Used for invitations and integration tokens.
 */
export function createAdminClient() {
  const { url } = requireSupabase();
  const { SUPABASE_SERVICE_ROLE_KEY } = serverEnv();
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set (see .env.example).");
  }
  return createClient<Database>(url, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
