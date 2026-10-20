import type { PortfolioItem } from "@/types/portfolio";

// Placeholders from the approved prototype: replace with the real cases (text and images in
// public/portfolio/<slug>/). Until then the images are the brand's generative pixel covers.
const BODY = [
  "[O desafio: o que o cliente precisava e por quê.]",
  "[O que a SDG Labs fez, etapa por etapa.]",
  "[O resultado, de preferência com números.]",
];

function placeholder(
  slug: string,
  category: PortfolioItem["category"],
  generativeCover: PortfolioItem["generativeCover"],
  publishedAt: string,
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
    publishedAt,
    generativeCover,
    pixelArt: true,
  };
}

export const portfolio: PortfolioItem[] = [
  placeholder("projeto-site", "site", "blocks", "2026-04-01"),
  placeholder("projeto-app", "app", "wave", "2026-03-01"),
  placeholder("projeto-sistema", "sistema", "dither", "2026-02-01"),
  placeholder("projeto-integracao", "integracao", "rings", "2026-01-01"),
];
