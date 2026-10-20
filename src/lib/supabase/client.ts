import { createBrowserClient } from "@supabase/ssr";
import { requireSupabase } from "@/lib/env";
import type { Database } from "@/types/database";

/** Supabase in the browser (Client Components), sharing the session cookies with the server. */
export function createClient() {
  const { url, anonKey } = requireSupabase();
  return createBrowserClient<Database>(url, anonKey);
}
