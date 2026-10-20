import { cacheTag } from "next/cache";
import { portfolio as contentPortfolio } from "@/content/portfolio";
import { supabaseConfig } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import type { Json, Tables } from "@/types/database";
import type {
  GenerativeCover,
  PortfolioCategory,
  PortfolioImage,
  PortfolioItem,
} from "@/types/portfolio";

/** Cache tag of every portfolio read; the admin panel invalidates it after an edit. */
export const PORTFOLIO_TAG = "portfolio";

const bySortOrder = (a: PortfolioItem, b: PortfolioItem) => a.sortOrder - b.sortOrder;

/** A path in the public "portfolio" bucket, or a site path ("/portfolio/...") kept as is. */
export function portfolioImageUrl(path: string) {
  if (path.startsWith("/") || /^https?:\/\//.test(path) || !supabaseConfig) return path;
  return `${supabaseConfig.url}/storage/v1/object/public/portfolio/${path}`;
}

function parseGallery(gallery: Json): PortfolioImage[] {
  if (!Array.isArray(gallery)) return [];
  return gallery.flatMap((image) =>
    image && typeof image === "object" && !Array.isArray(image) && typeof image.path === "string"
      ? [
          {
            src: portfolioImageUrl(image.path),
            alt: typeof image.alt === "string" ? image.alt : "",
          },
        ]
      : [],
  );
}

function fromRow(row: Tables<"portfolio_items">): PortfolioItem {
  return {
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    body: row.body
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean),
    category: row.category,
    stack: row.stack,
    cover: row.cover_path
      ? { src: portfolioImageUrl(row.cover_path), alt: row.cover_alt }
      : undefined,
    gallery: parseGallery(row.gallery),
    liveUrl: row.live_url ?? undefined,
    featured: row.featured,
    sortOrder: row.sort_order,
    generativeCover: (row.generative_cover as GenerativeCover | null) ?? undefined,
    pixelArt: row.pixel_art,
  };
}

/** Every published case, in listing order (Supabase, or src/content when it is not configured). */
async function publishedItems(): Promise<PortfolioItem[]> {
  "use cache";
  cacheTag(PORTFOLIO_TAG);
  if (!supabaseConfig) return [...contentPortfolio].sort(bySortOrder);

  const { data, error } = await createPublicClient()
    .from("portfolio_items")
    .select("*")
    .eq("published", true)
    .order("sort_order");
  if (error) throw new Error(`Could not read portfolio_items: ${error.message}`);
  return data.map(fromRow);
}

export async function getPortfolioItems(
  filter: { category?: PortfolioCategory; featured?: boolean } = {},
): Promise<PortfolioItem[]> {
  const items = await publishedItems();
  return items
    .filter((item) => !filter.category || item.category === filter.category)
    .filter((item) => !filter.featured || item.featured);
}

export async function getPortfolioItem(slug: string): Promise<PortfolioItem | null> {
  const items = await publishedItems();
  return items.find((item) => item.slug === slug) ?? null;
}

/** Previous and next case in the listing order, for the case study pager. */
export async function getAdjacentItems(slug: string) {
  const items = await publishedItems();
  const index = items.findIndex((item) => item.slug === slug);
  return {
    previous: index > 0 ? items[index - 1]! : null,
    next: index >= 0 && index < items.length - 1 ? items[index + 1]! : null,
  };
}
