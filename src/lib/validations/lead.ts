import { z } from "zod";
import { emailField, nameField } from "./fields";

export const PROJECT_TYPES = ["site", "app", "sistema", "integracao", "nao-sei"] as const;

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

/** Contact form on the landing. The messages are the ones from the approved prototype. */
export const leadSchema = z.object({
  name: nameField,
  email: emailField,
  company: optionalText(120),
  // a checkbox group arrives as false (none), a string (one) or an array (several)
  types: z.preprocess(
    (value) => (Array.isArray(value) ? value : value ? [value] : []),
    z.array(z.enum(PROJECT_TYPES)),
  ),
  message: optionalText(4000),
  /** LGPD: the visitor agrees to the privacy policy before sending */
  consent: z.boolean().refine(Boolean, "Para enviar, aceite a Política de Privacidade."),
});

export type LeadInput = z.input<typeof leadSchema>;
export type Lead = z.output<typeof leadSchema>;
