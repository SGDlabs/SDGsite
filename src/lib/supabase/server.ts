import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireSupabase } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Supabase as the signed-in user, from the session cookies. For Server Components, Server Actions
 * and Route Handlers; row level security applies. Create one per request.
 */
export async function createClient() {
  const { url, anonKey } = requireSupabase();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet)
            cookieStore.set(name, value, options);
        } catch {
          // Server Components cannot set cookies; the proxy refreshes the session instead.
        }
      },
    },
  });
}
