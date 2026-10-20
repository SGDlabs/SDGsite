import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getPortfolioItems } from "@/server/queries/portfolio";
import { PORTFOLIO_CATEGORIES } from "@/types/portfolio";

/** The landing's horizontal portfolio: featured cases with the prototype's generative covers. */
export async function Portfolio() {
  const items = await getPortfolioItems({ featured: true });
  return (
    <section className="works" id="portfolio">
      <div className="w-sticky">
        <div className="wrap w-head">
          <h2 className="h2 fill-text">Portfólio</h2>
          <p className="lead">
            Os projetos da SDG Labs entram aqui. Role para o lado para ver todos.
          </p>
          <span className="w-count" aria-hidden="true">
            <b id="wIdx">01</b>/{String(items.length + 1).padStart(2, "0")}
          </span>
        </div>
        <div className="w-viewport" id="wViewport">
          <div className="w-track" id="wTrack">
            {items.map((item) => (
              <Link key={item.slug} className="work" href={`/portfolio/${item.slug}`}>
                <div className="w-cover">
                  {item.generativeCover ? (
                    <canvas data-cover={item.generativeCover} aria-hidden="true"></canvas>
                  ) : (
                    item.cover && (
                      <Image
                        src={item.cover.src}
                        alt={item.cover.alt}
                        fill
                        sizes="(max-width: 980px) 80vw, 470px"
                        className={cn("pf-img", item.pixelArt && "pixelated")}
                        unoptimized={item.pixelArt}
                      />
                    )
                  )}
                </div>
                <div className="w-meta">
                  <span className="w-tag">{PORTFOLIO_CATEGORIES[item.category]}</span>
                  <h3>{item.title}</h3>
                  <p>{item.summary}</p>
                </div>
              </Link>
            ))}
            <a className="work cta" href="#contato">
              <h3>O próximo case pode ser o seu.</h3>
              <p>Conta pra gente o que você quer construir.</p>
              <span className="go">Começar um projeto</span>
            </a>
          </div>
        </div>
        <div className="wrap">
          <div className="w-bar">
            <span id="wBar"></span>
          </div>
        </div>
      </div>
    </section>
  );
}
