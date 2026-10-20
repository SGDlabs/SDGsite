export const PORTFOLIO_CATEGORIES = {
  site: "Site institucional",
  app: "Aplicativo",
  sistema: "Sistema sob medida",
  integracao: "Integração",
} as const;

export type PortfolioCategory = keyof typeof PORTFOLIO_CATEGORIES;

/** Generative pixel covers drawn on the landing's portfolio carousel. */
export type GenerativeCover = "blocks" | "wave" | "dither" | "rings";

export interface PortfolioImage {
  src: string;
  alt: string;
}

export interface PortfolioItem {
  slug: string;
  title: string;
  summary: string;
  /** Case study text, one string per paragraph. */
  body: string[];
  category: PortfolioCategory;
  stack: string[];
  cover: PortfolioImage;
  gallery: PortfolioImage[];
  liveUrl?: string;
  featured: boolean;
  /** ISO date; newest first. */
  publishedAt: string;
  /** Cover drawn on the landing carousel (the approved prototype's pixel art). */
  generativeCover: GenerativeCover;
  /** Pixel-art images keep hard edges: no resizing, image-rendering: pixelated. */
  pixelArt?: boolean;
}
