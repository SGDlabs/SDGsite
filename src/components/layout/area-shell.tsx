import { Suspense, type ReactNode } from "react";
import { Header } from "./header";
import { UserMenu, UserMenuSkeleton } from "./user-menu";

/** Header with the user menu, for the client area and the admin. */
export function AreaShell({ homeHref, children }: { homeHref: string; children: ReactNode }) {
  return (
    <>
      <Header
        homeHref={homeHref}
        actions={
          <Suspense fallback={<UserMenuSkeleton />}>
            <UserMenu />
          </Suspense>
        }
      />
      {children}
    </>
  );
}
