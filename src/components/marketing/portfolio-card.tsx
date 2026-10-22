import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PORTFOLIO_CATEGORIES, type PortfolioItem } from "@/types/portfolio";

/** Case card of the portfolio listing: the landing carousel's card with the real cover image. */
export function PortfolioCard({ item, first = false }: { item: PortfolioItem; first?: boolean }) {
  return (
    <Link className="work" href={`/portfolio/${item.slug}`} data-category={item.category}>
      <div className="w-cover">
        {item.cover && (
          <Image
            src={item.cover.src}
            alt={item.cover.alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 980px) 50vw, 33vw"
            className={cn("pf-img", item.pixelArt && "pixelated")}
            unoptimized={item.pixelArt}
            // the first cover is the page's largest paint on phones: fetch it right away
            fetchPriority={first ? "high" : undefined}
            loading={first ? "eager" : undefined}
          />
        )}
      </div>
      <div className="w-meta">
        <span className="w-tag">{PORTFOLIO_CATEGORIES[item.category]}</span>
        <h2>{item.title}</h2>
        <p>{item.summary}</p>
      </div>
    </Link>
  );
}
