import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { homeFor } from "@/lib/auth/roles";
import { supabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Where requireRole sends a request without a profile. A session can outlive its profile (the
 * admin removed the access): its token still passes the proxy until it expires, and /login would
 * send it straight back to the area. This ends it on this device, then /login. Someone who still
 * has a profile goes to their area instead, so a link to here cannot sign anyone out.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user.role));
  if (supabaseConfig) {
    const supabase = await createClient();
    await supabase.auth.signOut({ scope: "local" });
  }
  redirect("/login");
}
