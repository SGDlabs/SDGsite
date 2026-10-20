import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "./container";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";

export interface NavItem {
  href: string;
  label: string;
}

interface HeaderProps {
  nav?: NavItem[];
  /** Right-hand slot: a call to action, the user menu… */
  actions?: ReactNode;
}

/** Header of the logged-in and internal areas (the landing has its own). */
export function Header({ nav = [], actions }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface">
      <Container className="relative flex min-h-18 items-center gap-6">
        {/* py-2 keeps the logo's clear space: 4 grid cells at 2px each */}
        <Link href="/" className="flex items-center rounded-sm py-2" aria-label="SDG Labs — início">
          {/* the horizontal logo needs 120px; on very narrow screens only the icon fits */}
          <span className="max-[379px]:hidden">
            <Logo variant="horizontal" alt="" />
          </span>
          <span className="min-[380px]:hidden">
            <Logo variant="icon" scale={1} alt="" />
          </span>
        </Link>
        {nav.length > 0 && (
          <nav aria-label="Principal" className="ml-auto hidden lg:block">
            <ul className="flex gap-6">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="type-label text-ink hover:text-accent hover:underline"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
        <div className="ml-auto flex items-center gap-3 lg:ml-0">
          {actions}
          {nav.length > 0 && <MobileMenu nav={nav} />}
        </div>
      </Container>
    </header>
  );
}
