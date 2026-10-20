import { z } from "zod";

export const PROJECT_TYPES = ["site", "app", "sistema", "integracao", "nao-sei"] as const;

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

/** Contact form on the landing. The messages are the ones from the approved prototype. */
export const leadSchema = z.object({
  name: z.string().trim().min(1, "Escreva seu nome.").max(120, "Use até 120 caracteres."),
  email: z
    .string()
    .trim()
    .max(200, "Use até 200 caracteres.")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Use um e-mail válido, como voce@empresa.com.br."),
  company: optionalText(120),
  // a checkbox group arrives as false (none), a string (one) or an array (several)
  types: z.preprocess(
    (value) => (Array.isArray(value) ? value : value ? [value] : []),
    z.array(z.enum(PROJECT_TYPES)),
  ),
  message: optionalText(4000),
});

export type LeadInput = z.input<typeof leadSchema>;
export type Lead = z.output<typeof leadSchema>;
