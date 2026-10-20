import { requireRole } from "@/lib/auth/current-user";

/**
 * For admin pages whose content needs no data (a blank form): checks the role at request time
 * without making the rest of the page wait. Render inside <Suspense fallback={null}>.
 */
export async function AdminGuard() {
  await requireRole("admin");
  return null;
}
