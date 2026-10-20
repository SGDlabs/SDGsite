import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { redirectFor } from "@/lib/auth/access";
import { roleFromClaims, type Role } from "@/lib/auth/roles";
import { supabaseConfig } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Runs before the client area, the admin and the sign-in pages: refreshes the Supabase session
 * (Server Components cannot write cookies) and redirects by role. This is the optimistic check;
 * pages and actions call requireRole, and row level security protects the data itself.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  let role: Role | null = null;

  if (supabaseConfig) {
    const supabase = createServerClient<Database>(supabaseConfig.url, supabaseConfig.anonKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet)
            response.cookies.set(name, value, options);
          // responses that set auth cookies must never be cached by a CDN
          for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
        },
      },
    });

    // Verifies the JWT (and refreshes it when it is about to expire). Nothing may run between
    // creating the client and this call, or sessions can drop at random.
    const { data } = await supabase.auth.getClaims();
    if (data?.claims) role = roleFromClaims(data.claims);
  }

  const target = redirectFor(request.nextUrl.pathname, request.nextUrl.search, role);
  if (!target) return response;

  const redirect = NextResponse.redirect(new URL(target, request.url));
  // keep the refreshed session cookies, and their no-cache headers, on the redirect too
  for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
  for (const key of ["cache-control", "expires", "pragma"]) {
    const value = response.headers.get(key);
    if (value) redirect.headers.set(key, value);
  }
  return redirect;
}

export const config = {
  matcher: [
    "/painel/:path*",
    "/admin/:path*",
    "/login",
    "/recuperar-senha",
    "/redefinir-senha",
    "/convite",
  ],
};
