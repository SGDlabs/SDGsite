import { portfolio } from "@/content/portfolio";
import type { PortfolioCategory, PortfolioItem } from "@/types/portfolio";

// Reads come from src/content for now; prompt 6 moves them to Supabase without changing callers.

const newestFirst = (a: PortfolioItem, b: PortfolioItem) =>
  b.publishedAt.localeCompare(a.publishedAt);

export async function getPortfolioItems(
  filter: { category?: PortfolioCategory; featured?: boolean } = {},
): Promise<PortfolioItem[]> {
  "use cache";
  return portfolio
    .filter((item) => !filter.category || item.category === filter.category)
    .filter((item) => !filter.featured || item.featured)
    .sort(newestFirst);
}

export async function getPortfolioItem(slug: string): Promise<PortfolioItem | null> {
  "use cache";
  return portfolio.find((item) => item.slug === slug) ?? null;
}

/** Previous and next case in the listing order, for the case study pager. */
export async function getAdjacentItems(slug: string) {
  "use cache";
  const items = [...portfolio].sort(newestFirst);
  const index = items.findIndex((item) => item.slug === slug);
  return {
    previous: index > 0 ? items[index - 1]! : null,
    next: index >= 0 && index < items.length - 1 ? items[index + 1]! : null,
  };
}
