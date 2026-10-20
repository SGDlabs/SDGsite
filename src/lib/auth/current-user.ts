import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { supabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { hasRole, homeFor, type Role } from "./roles";

export interface CurrentUser {
  id: string;
  email: string;
  /** full_name, or the e-mail when the user has not set a name yet */
  name: string;
  avatarUrl: string | null;
  role: Role;
  /** the client's company; null for admins */
  clientId: string | null;
}

/**
 * The signed-in user and their profile, or null. Reads the session cookies, so call it inside a
 * <Suspense> boundary. Once per request (React cache), however many components ask.
 *
 * The role comes from `profiles`, the same row that row level security reads.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  // request time only: the session check reads the clock (token expiry), which a prerender
  // (or a prefetch of the page) must not do
  await connection();
  if (!supabaseConfig) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return null;

  const { claims } = data;
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, role, client_id")
    .eq("id", claims.sub)
    .maybeSingle();
  if (!profile) return null;

  const email = typeof claims.email === "string" ? claims.email : "";
  return {
    id: claims.sub,
    email,
    name: profile.full_name?.trim() || email,
    avatarUrl: profile.avatar_url,
    role: profile.role,
    clientId: profile.client_id,
  };
});

/**
 * The signed-in user with that role, for Server Components and Server Actions. Without a session
 * it redirects to /login; with another role, to that role's home. Admins pass requireRole("client").
 */
export async function requireRole(role: Role): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasRole(user.role, role)) redirect(homeFor(user.role));
  return user;
}
