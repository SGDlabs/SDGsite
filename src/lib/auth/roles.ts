// Roles and where each one lands. Pure functions, shared by the proxy, the pages and the actions.

export const ROLES = ["admin", "client"] as const;
export type Role = (typeof ROLES)[number];

/**
 * The role inside a session's JWT. It comes from app_metadata, which only the service role can
 * write (never from user_metadata, which the user can edit). Anything unexpected is a client.
 */
export function roleFromClaims(
  claims: { app_metadata?: Record<string, unknown> } | null | undefined,
): Role {
  return claims?.app_metadata?.role === "admin" ? "admin" : "client";
}

/** Where a signed-in user goes by default. */
export function homeFor(role: Role) {
  return role === "admin" ? "/admin" : "/painel";
}

/** Admins can also open the client area, to see what the client sees. */
export function hasRole(userRole: Role, required: Role) {
  return userRole === "admin" || userRole === required;
}

/**
 * A path inside this site to return to after signing in, or null. Rejects absolute URLs and
 * protocol-relative paths ("//evil.com", "/\\evil.com") so the login cannot become an open redirect.
 */
export function safeNext(value: unknown): string | null {
  if (typeof value !== "string" || !value.startsWith("/")) return null;
  if (value.startsWith("//") || value.startsWith("/\\")) return null;
  try {
    const url = new URL(value, "http://site.invalid");
    if (url.origin !== "http://site.invalid") return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
