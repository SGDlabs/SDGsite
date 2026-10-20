import type { PortfolioItem } from "@/types/portfolio";

// Used when Supabase is not configured (front-end work without a database). The same
// placeholders are seeded into portfolio_items by supabase/seed.sql; real cases are managed in
// the admin panel. Images live in public/portfolio/<slug>/: the prototype's pixel covers for now.
const BODY = [
  "[O desafio: o que o cliente precisava e por quê.]",
  "[O que a SDG Labs fez, etapa por etapa.]",
  "[O resultado, de preferência com números.]",
];

function placeholder(
  slug: string,
  category: PortfolioItem["category"],
  generativeCover: PortfolioItem["generativeCover"],
  sortOrder: number,
): PortfolioItem {
  return {
    slug,
    title: "[Nome do projeto]",
    summary: "[O que foi feito, em uma frase]",
    body: BODY,
    category,
    stack: ["[Tecnologia]", "[Tecnologia]", "[Tecnologia]"],
    cover: { src: `/portfolio/${slug}/cover.png`, alt: "[Descrição da capa]" },
    gallery: [1, 2].map((n) => ({
      src: `/portfolio/${slug}/galeria-${n}.png`,
      alt: `[Descrição da imagem ${n}]`,
    })),
    featured: true,
    sortOrder,
    generativeCover,
    pixelArt: true,
  };
}

export const portfolio: PortfolioItem[] = [
  placeholder("projeto-site", "site", "blocks", 1),
  placeholder("projeto-app", "app", "wave", 2),
  placeholder("projeto-sistema", "sistema", "dither", 3),
  placeholder("projeto-integracao", "integracao", "rings", 4),
];
