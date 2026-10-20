import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { getPortfolioItems } from "@/server/queries/portfolio";

/** The public pages and every published case. The private areas stay out (see robots.ts). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = (path: string) => new URL(path, siteUrl).href;
  const cases = await getPortfolioItems();
  return [
    { url: url("/"), changeFrequency: "monthly", priority: 1 },
    { url: url("/portfolio"), changeFrequency: "weekly", priority: 0.8 },
    ...cases.map((item) => ({
      url: url(`/portfolio/${item.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    { url: url("/privacidade"), changeFrequency: "yearly", priority: 0.2 },
    { url: url("/termos"), changeFrequency: "yearly", priority: 0.2 },
  ];
}
