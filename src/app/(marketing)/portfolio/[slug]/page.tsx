import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Gallery } from "@/components/marketing/gallery";
import { LandingChrome, LandingPage } from "@/components/marketing/landing-page";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteNav } from "@/components/marketing/site-nav";
import { cn } from "@/lib/utils";
import { getAdjacentItems, getPortfolioItem, getPortfolioItems } from "@/server/queries/portfolio";
import { PORTFOLIO_CATEGORIES, type PortfolioItem } from "@/types/portfolio";

// The whole case study is static (cached data only). It also means an unknown slug waits for its
// render instead of getting the streamed fallback shell, so notFound() still answers a real 404.
export const ensureStatic = "navigation";

export async function generateStaticParams() {
  const items = await getPortfolioItems();
  return items.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/portfolio/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPortfolioItem(slug);
  if (!item) return { title: "Projeto não encontrado" };
  return { title: item.title, description: item.summary };
}

// params are awaited before any <Suspense>: a 404 status is impossible once streaming starts.
export default async function CasePage({ params }: PageProps<"/portfolio/[slug]">) {
  const { slug } = await params;
  const item = await getPortfolioItem(slug);
  if (!item) notFound();

  return (
    <LandingPage>
      <LandingChrome />
      <SiteNav current="/portfolio" />
      <main>
        <CaseStudy item={item} />
      </main>
      <SiteFooter />
    </LandingPage>
  );
}

async function CaseStudy({ item }: { item: PortfolioItem }) {
  const { previous, next } = await getAdjacentItems(item.slug);

  return (
    <article className="sec pf-top">
      <div className="wrap">
        <Link href="/portfolio" className="pf-back">
          ← Portfólio
        </Link>
        <header className="pf-head">
          <span className="w-tag">{PORTFOLIO_CATEGORIES[item.category]}</span>
          <h1 className="h2">{item.title}</h1>
          <p className="lead">{item.summary}</p>
        </header>
        <div className="pf-hero">
          <Image
            src={item.cover.src}
            alt={item.cover.alt}
            fill
            priority
            sizes="(max-width: 1280px) 100vw, 1280px"
            className={cn("pf-img", item.pixelArt && "pixelated")}
            unoptimized={item.pixelArt}
          />
        </div>
        <div className="pf-body">
          <div className="pf-text">
            {item.body.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
          <aside className="pf-aside">
            <div className="ps-get">
              <span className="ps-lbl">Stack</span>
              <ul>
                {item.stack.map((tech, i) => (
                  <li key={i}>{tech}</li>
                ))}
              </ul>
            </div>
            {item.liveUrl && (
              <a
                className="btn btn-primary"
                href={item.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>Ver o projeto no ar</span>
              </a>
            )}
            <Link className="btn btn-ghost" href="/#contato">
              <span>Começar um projeto</span>
            </Link>
          </aside>
        </div>
        {item.gallery.length > 0 && <Gallery images={item.gallery} pixelArt={item.pixelArt} />}
        <nav className="pf-pager" aria-label="Outros projetos">
          {previous ? (
            <Link href={`/portfolio/${previous.slug}`}>
              <span>Anterior</span>
              <strong>{previous.title}</strong>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={`/portfolio/${next.slug}`} className="next">
              <span>Próximo</span>
              <strong>{next.title}</strong>
            </Link>
          )}
        </nav>
      </div>
    </article>
  );
}
