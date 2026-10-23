import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "./logo";

/** A page with one card in the middle of the screen and the logo back to the site above it. */
export function CenteredPage({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-surface px-4 py-12">
      <div className="flex w-full max-w-110 flex-col gap-8">
        {/* py-2 keeps the logo's clear space */}
        <Link
          href="/"
          className="self-center rounded-sm py-2"
          aria-label="SDG Labs — voltar ao site"
        >
          <Logo variant="horizontal" alt="" />
        </Link>
        {children}
      </div>
    </main>
  );
}
