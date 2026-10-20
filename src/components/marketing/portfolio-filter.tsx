"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PORTFOLIO_CATEGORIES, type PortfolioCategory } from "@/types/portfolio";

export const PORTFOLIO_FILTERS: { category?: PortfolioCategory; label: string }[] = [
  { label: "Todos" },
  { category: "site", label: "Sites" },
  { category: "app", label: "Aplicativos" },
  { category: "sistema", label: "Sistemas" },
  { category: "integracao", label: "Integrações" },
];

const isCategory = (value: unknown): value is PortfolioCategory =>
  typeof value === "string" && value in PORTFOLIO_CATEGORIES;

/** The category chips; `current` gets aria-current. */
export function PortfolioChips({ current }: { current?: PortfolioCategory }) {
  return (
    <nav className="pf-filters" aria-label="Filtrar por categoria">
      {PORTFOLIO_FILTERS.map((filter) => (
        <Link
          key={filter.label}
          href={filter.category ? `/portfolio?categoria=${filter.category}` : "/portfolio"}
          className="pf-chip"
          aria-current={current === filter.category ? "page" : undefined}
          scroll={false}
        >
          {filter.label}
        </Link>
      ))}
    </nav>
  );
}

/**
 * ?categoria= applied in the browser: the cases are all in the page's static HTML (so the
 * largest image paints once and is never swapped), and a style rule hides the other categories.
 * Render inside <Suspense fallback={<PortfolioChips />}> (it reads the URL).
 */
export function PortfolioFilter() {
  const param = useSearchParams().get("categoria");
  const category = isCategory(param) ? param : undefined;
  return (
    <>
      <PortfolioChips current={category} />
      {category && (
        <style>{`.pf-grid .work:not([data-category="${category}"]){display:none}.pf-empty[data-empty-for~="${category}"]{display:block}`}</style>
      )}
    </>
  );
}
