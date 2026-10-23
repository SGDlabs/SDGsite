import { publicEnv } from "@/lib/env";

export const site = {
  name: "SDG Labs",
  slogan: "A fórmula do seu software.",
  description: "Sites, aplicativos e sistemas sob medida, com o andamento visível em tempo real.",
};

/**
 * The public address, for absolute links (sitemap, Open Graph, structured data): the domain in
 * production, the deployment's own address on a Vercel preview, localhost in development.
 */
export const siteUrl = new URL(
  publicEnv.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
);
