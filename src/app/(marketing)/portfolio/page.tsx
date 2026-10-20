import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LandingChrome, LandingPage } from "@/components/marketing/landing-page";
import { PortfolioCard } from "@/components/marketing/portfolio-card";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteNav } from "@/components/marketing/site-nav";
import { getPortfolioItems } from "@/server/queries/portfolio";
import { PORTFOLIO_CATEGORIES, type PortfolioCategory } from "@/types/portfolio";

export const metadata: Metadata = {
  title: "Portfólio",
  description: "Sites, aplicativos, sistemas e integrações feitos pela SDG Labs.",
};

const FILTERS: { category?: PortfolioCategory; label: string }[] = [
  { label: "Todos" },
  { category: "site", label: "Sites" },
  { category: "app", label: "Aplicativos" },
  { category: "sistema", label: "Sistemas" },
  { category: "integracao", label: "Integrações" },
];

const isCategory = (value: unknown): value is PortfolioCategory =>
  typeof value === "string" && value in PORTFOLIO_CATEGORIES;

export default function PortfolioPage({ searchParams }: PageProps<"/portfolio">) {
  return (
    <LandingPage>
      <LandingChrome />
      <SiteNav current="/portfolio" />
      <main>
        <section className="sec pf-top">
          <div className="wrap">
            <div className="sec-head">
              <h1 className="h2 fill-text">Portfólio</h1>
              <p className="lead">
                Sites, aplicativos, sistemas e integrações que saíram do nosso laboratório.
              </p>
            </div>
            {/* the static shell lists every case; the filter from the URL streams in */}
            <Suspense fallback={<PortfolioList />}>
              <FilteredList searchParams={searchParams} />
            </Suspense>
          </div>
        </section>
      </main>
      <SiteFooter />
    </LandingPage>
  );
}

async function FilteredList({ searchParams }: Pick<PageProps<"/portfolio">, "searchParams">) {
  const { categoria } = await searchParams;
  return <PortfolioList category={isCategory(categoria) ? categoria : undefined} />;
}

async function PortfolioList({ category }: { category?: PortfolioCategory }) {
  const items = await getPortfolioItems({ category });
  return (
    <>
      <nav className="pf-filters" aria-label="Filtrar por categoria">
        {FILTERS.map((filter) => (
          <Link
            key={filter.label}
            href={filter.category ? `/portfolio?categoria=${filter.category}` : "/portfolio"}
            className="pf-chip"
            aria-current={category === filter.category ? "page" : undefined}
            scroll={false}
          >
            {filter.label}
          </Link>
        ))}
      </nav>
      {items.length > 0 ? (
        <div className="pf-grid">
          {items.map((item) => (
            <PortfolioCard key={item.slug} item={item} />
          ))}
        </div>
      ) : (
        <p className="pf-empty">Ainda não tem projeto publicado nesta categoria.</p>
      )}
    </>
  );
}
