import type { ReactNode } from "react";
import { LandingChrome, LandingPage } from "./landing-page";
import { SiteFooter } from "./site-footer";
import { SiteNav } from "./site-nav";

/** A long text page (privacy policy, terms) in the landing's look. */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  /** "20 de outubro de 2026" */
  updated: string;
  children: ReactNode;
}) {
  return (
    <LandingPage>
      <LandingChrome />
      <SiteNav />
      <main>
        <section className="sec legal">
          <div className="wrap">
            <div className="sec-head">
              <h1 className="h2 fill-text">{title}</h1>
              <p className="lead">Versão de {updated}.</p>
            </div>
            <div className="legal-body">{children}</div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </LandingPage>
  );
}
