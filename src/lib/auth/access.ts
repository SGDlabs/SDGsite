import { hasRole, homeFor, type Role } from "./roles";

/** Pages that only make sense signed out: a signed-in user is sent to their area. */
const SIGNED_OUT_ONLY = ["/login", "/recuperar-senha"];

function under(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** The area a path belongs to and the role it needs, or null when it is open to everyone. */
export function requiredRole(pathname: string): Role | null {
  if (under(pathname, "/admin")) return "admin";
  if (under(pathname, "/painel")) return "client";
  return null;
}

/**
 * The proxy's decision for a request: where to redirect, or null to let it through. This is the
 * optimistic check, from the session's JWT; pages and actions check again with requireRole, and
 * row level security has the final word.
 */
export function redirectFor(pathname: string, search: string, role: Role | null): string | null {
  const required = requiredRole(pathname);

  if (required && !role) {
    return `/login?${new URLSearchParams({ next: `${pathname}${search}` })}`;
  }
  if (required && role && !hasRole(role, required)) return homeFor(role);
  if (role && SIGNED_OUT_ONLY.includes(pathname)) return homeFor(role);
  return null;
}
