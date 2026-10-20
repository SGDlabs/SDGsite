import { AreaShell } from "@/components/layout/area-shell";

// The proxy already sent visitors without a session to /login; each page checks again with
// requireRole (layouts do not re-render on navigation, so they are no place for that check).
export default function ClientAreaLayout({ children }: LayoutProps<"/painel">) {
  return <AreaShell homeHref="/painel">{children}</AreaShell>;
}
