import { z } from "zod";
import { emailField, nameField } from "./fields";

export const signInSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Escreva sua senha."),
  /** path to return to, from ?next= (validated again with safeNext) */
  next: z.string().optional(),
});

export const recoverPasswordSchema = z.object({ email: emailField });

// Supabase Auth requires 8 (supabase/config.toml); bcrypt reads at most 72 bytes.
const password = z
  .string()
  .min(8, "Use pelo menos 8 caracteres.")
  .max(72, "Use até 72 caracteres.");

const confirmed = <T extends { password: string; confirm: string }>(value: T) =>
  value.password === value.confirm;
const mismatch = { path: ["confirm"], message: "As duas senhas precisam ser iguais." };

/** token_hash from the e-mail link; it is only spent when the form is sent (see the templates). */
const tokenHash = z.string().max(256).optional();

export const newPasswordSchema = z
  .object({ password, confirm: z.string(), tokenHash })
  .refine(confirmed, mismatch);

/** /convite: the invited client confirms their name and chooses a password. */
export const acceptInviteSchema = z
  .object({ name: nameField, password, confirm: z.string(), tokenHash })
  .refine(confirmed, mismatch);

/** Admin: give someone at a client company access to the client area. */
export const inviteClientUserSchema = z.object({
  clientId: z.uuid("Escolha a empresa."),
  email: emailField,
  name: nameField,
});

/** /painel/conta: the name shown in the menu and to the team. */
export const accountNameSchema = z.object({ name: nameField });

export type SignInInput = z.input<typeof signInSchema>;
export type RecoverPasswordInput = z.input<typeof recoverPasswordSchema>;
export type NewPasswordInput = z.input<typeof newPasswordSchema>;
export type AcceptInviteInput = z.input<typeof acceptInviteSchema>;
export type InviteClientUserInput = z.input<typeof inviteClientUserSchema>;
export type AccountNameInput = z.input<typeof accountNameSchema>;
