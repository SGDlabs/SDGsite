import { getCurrentUser } from "@/lib/auth/current-user";
import { initials } from "@/lib/initials";
import { UserMenuButton } from "./user-menu-button";

/** The header's user menu. Reads the session: render it inside <Suspense>. */
export async function UserMenu() {
  const user = await getCurrentUser();
  if (!user) return null;
  return (
    <UserMenuButton
      name={user.name}
      email={user.email}
      initials={initials(user.name)}
      avatarUrl={user.avatarUrl?.startsWith("https://") ? user.avatarUrl : null}
      isAdmin={user.role === "admin"}
    />
  );
}

/** Same size as the button, while the session loads. */
export function UserMenuSkeleton() {
  return <span aria-hidden="true" className="block size-11 rounded-sm bg-surface-alt" />;
}
