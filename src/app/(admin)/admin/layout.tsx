import { AreaShell } from "@/components/layout/area-shell";

// The proxy already sent non-admins away; each page checks again with requireRole("admin")
// (layouts do not re-render on navigation, so they are no place for that check).
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <AreaShell homeHref="/admin">{children}</AreaShell>;
}
