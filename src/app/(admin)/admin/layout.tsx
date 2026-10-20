import { Suspense } from "react";
import { AdminNav, AdminNavList } from "@/components/admin/admin-nav";
import { AreaShell } from "@/components/layout/area-shell";

// The proxy already sent non-admins away; each page checks again with requireRole("admin")
// (layouts do not re-render on navigation, so they are no place for that check).
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <AreaShell homeHref="/admin">
      <div className="mx-auto flex w-full max-w-292 flex-col gap-6 px-4 py-6 md:px-6 lg:flex-row lg:gap-10 lg:py-10">
        <aside className="lg:sticky lg:top-24 lg:w-48 lg:shrink-0 lg:self-start">
          <Suspense fallback={<AdminNavList />}>
            <AdminNav />
          </Suspense>
        </aside>
        <main className="flex min-w-0 flex-1 flex-col gap-8">{children}</main>
      </div>
    </AreaShell>
  );
}
