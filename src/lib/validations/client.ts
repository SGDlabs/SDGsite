import { z } from "zod";
import { emailField } from "./fields";

const optional = <T extends z.ZodType>(schema: T) => schema.optional().or(z.literal(""));

/** A client company (table `clients`), created and edited in the admin. */
export const clientSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(1, "Escreva o nome da empresa.").max(160, "Use até 160 caracteres."),
  cnpjCpf: optional(
    z
      .string()
      .trim()
      .regex(/^[\d./-]{11,18}$/, "Use só números, pontos, barra e traço, como no documento."),
  ),
  contactEmail: optional(emailField),
  phone: optional(z.string().trim().max(30, "Use até 30 caracteres.")),
});

export type ClientInput = z.input<typeof clientSchema>;
