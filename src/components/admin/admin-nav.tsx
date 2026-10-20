"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const ADMIN_SECTIONS = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/clientes", label: "Clientes" },
  { href: "/admin/projetos", label: "Projetos" },
  { href: "/admin/portfolio", label: "Portfólio" },
  { href: "/admin/leads", label: "Leads" },
];

const isCurrent = (pathname: string, href: string) =>
  href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

/**
 * The admin's sections: a sidebar from lg up, a row that scrolls sideways on smaller screens.
 * Render inside <Suspense> (it reads the URL); the fallback is the same list without a marker.
 */
export function AdminNav() {
  return <AdminNavList pathname={usePathname()} />;
}

export function AdminNavList({ pathname }: { pathname?: string }) {
  return (
    <nav aria-label="Admin" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
      <ul className="flex gap-1 lg:flex-col">
        {ADMIN_SECTIONS.map((section) => {
          const current = pathname !== undefined && isCurrent(pathname, section.href);
          return (
            <li key={section.href} className="shrink-0">
              <Link
                href={section.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center rounded-sm px-3 type-label whitespace-nowrap text-ink no-underline hover:bg-surface-alt",
                  current &&
                    "bg-surface-alt underline decoration-accent decoration-2 underline-offset-6",
                )}
              >
                {section.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
