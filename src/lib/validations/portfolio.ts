import { z } from "zod";
import { PORTFOLIO_CATEGORIES } from "@/types/portfolio";

const CATEGORIES = Object.keys(PORTFOLIO_CATEGORIES) as [
  keyof typeof PORTFOLIO_CATEGORIES,
  ...(keyof typeof PORTFOLIO_CATEGORIES)[],
];
export const GENERATIVE_COVERS = ["blocks", "wave", "dither", "rings"] as const;
export const PORTFOLIO_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
  "image/gif",
] as const;
export const MAX_PORTFOLIO_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_GALLERY_IMAGES = 12;

const image = z.object({
  path: z.string().min(1).max(400),
  alt: z.string().trim().max(200, "Use até 200 caracteres."),
});

/** A portfolio case, as the admin edits it (table portfolio_items). */
export const portfolioItemSchema = z.object({
  id: z.uuid(),
  title: z.string().trim().min(1, "Escreva o título.").max(120, "Use até 120 caracteres."),
  slug: z
    .string()
    .trim()
    .min(1, "Escreva o endereço.")
    .max(80, "Use até 80 caracteres.")
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "Use letras minúsculas, números e hífens, como app-de-agendamento.",
    ),
  summary: z.string().trim().min(1, "Escreva o resumo.").max(240, "Use até 240 caracteres."),
  body: z.string().trim().max(8000, "Use até 8000 caracteres."),
  category: z.enum(CATEGORIES, "Escolha a categoria."),
  /** "Next.js, Supabase, Vercel" */
  stack: z.string().max(400, "Use até 400 caracteres."),
  liveUrl: z.url("Use um endereço completo, como https://exemplo.com.br.").or(z.literal("")),
  coverPath: z.string().max(400),
  coverAlt: z.string().trim().max(200, "Use até 200 caracteres."),
  gallery: z.array(image).max(MAX_GALLERY_IMAGES, `Use até ${MAX_GALLERY_IMAGES} imagens.`),
  generativeCover: z.enum(GENERATIVE_COVERS).or(z.literal("")),
  pixelArt: z.boolean(),
  featured: z.boolean(),
  published: z.boolean(),
});

export const portfolioUploadSchema = z.object({
  itemId: z.uuid(),
  files: z
    .array(
      z.object({
        name: z.string().min(1).max(200),
        type: z.enum(PORTFOLIO_IMAGE_TYPES, "Envie imagens PNG, JPG, WebP, AVIF ou GIF."),
        size: z
          .number()
          .int()
          .positive()
          .max(MAX_PORTFOLIO_IMAGE_BYTES, "Cada imagem pode ter até 10 MB."),
      }),
    )
    .min(1)
    .max(MAX_GALLERY_IMAGES),
});

/** "Next.js, Supabase ,, Vercel" → ["Next.js", "Supabase", "Vercel"] */
export function splitStack(stack: string) {
  return stack
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export type PortfolioItemInput = z.input<typeof portfolioItemSchema>;
export type PortfolioUploadInput = z.input<typeof portfolioUploadSchema>;
