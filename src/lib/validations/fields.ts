import { z } from "zod";

/** E-mail as the forms ask for it: trimmed, with the message from the approved prototype. */
export const emailField = z
  .string()
  .trim()
  .max(200, "Use até 200 caracteres.")
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Use um e-mail válido, como voce@empresa.com.br.");

/** A person's name. */
export const nameField = z
  .string()
  .trim()
  .min(1, "Escreva seu nome.")
  .max(120, "Use até 120 caracteres.");
