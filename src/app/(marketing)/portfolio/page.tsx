import type { Metadata } from "next";
import { Suspense } from "react";
import { LandingChrome, LandingPage } from "@/components/marketing/landing-page";
import { PortfolioCard } from "@/components/marketing/portfolio-card";
import { PortfolioChips, PortfolioFilter } from "@/components/marketing/portfolio-filter";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteNav } from "@/components/marketing/site-nav";
import { getPortfolioItems } from "@/server/queries/portfolio";
import { PORTFOLIO_CATEGORIES, type PortfolioCategory } from "@/types/portfolio";

export const metadata: Metadata = {
  title: "Portfólio",
  description: "Sites, aplicativos, sistemas e integrações feitos pela SDG Labs.",
};

export default function PortfolioPage() {
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
            {/* every case is in the static HTML; the filter from the URL applies in the browser */}
            <Suspense fallback={<PortfolioChips />}>
              <PortfolioFilter />
            </Suspense>
            <PortfolioList />
          </div>
        </section>
      </main>
      <SiteFooter />
    </LandingPage>
  );
}

async function PortfolioList() {
  const items = await getPortfolioItems();
  // categories with no case, for the filter's empty message
  const empty = (Object.keys(PORTFOLIO_CATEGORIES) as PortfolioCategory[]).filter(
    (category) => !items.some((item) => item.category === category),
  );
  return (
    <>
      {items.length > 0 && (
        <div className="pf-grid">
          {items.map((item, index) => (
            <PortfolioCard key={item.slug} item={item} first={index === 0} />
          ))}
        </div>
      )}
      <p className="pf-empty" data-empty-for={empty.join(" ")} hidden={items.length > 0}>
        Ainda não tem projeto publicado nesta categoria.
      </p>
    </>
  );
}
