import { z } from "zod";
import { MEDIA_TYPES } from "./project";

/**
 * Vercel functions take request bodies up to 4.5 MB, so the files of one call add up to 4 MB.
 * Screenshots of a deploy fit easily; a long video does not (post its link in the text).
 */
export const MAX_API_FILES_BYTES = 4 * 1024 * 1024;
export const MAX_API_FILES = 12;

/** What a client's pipeline may post. Milestones ("marco") belong to the admins. */
export const API_KINDS = ["nota", "print", "video", "deploy"] as const;

export const integrationUpdateSchema = z.object({
  kind: z.enum(API_KINDS, `kind deve ser um destes: ${API_KINDS.join(", ")}.`),
  title: z
    .string("title é obrigatório.")
    .trim()
    .min(1, "title é obrigatório.")
    .max(200, "title aceita até 200 caracteres."),
  body: z.string().trim().max(4000, "body aceita até 4000 caracteres.").optional(),
  /** stage position (1 to 7); default: the stage in progress */
  stage: z.coerce.number().int().min(1).max(7, "stage vai de 1 a 7.").optional(),
});

export const isApiMediaType = (type: string): type is (typeof MEDIA_TYPES)[number] =>
  (MEDIA_TYPES as readonly string[]).includes(type);

export type IntegrationUpdate = z.output<typeof integrationUpdateSchema>;
