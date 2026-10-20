import { z } from "zod";

/** What a form's Server Action returns: success, or the messages to show next to the fields. */
export type FormResult<Field extends string = string> =
  | { ok: true; message?: string }
  | { ok: false; fieldErrors?: Partial<Record<Field, string>>; formError?: string };

/** The first Zod message of each field, in the shape forms read. */
export function invalid<Field extends string>(error: z.ZodError): FormResult<Field> {
  const fieldErrors: Partial<Record<Field, string>> = {};
  for (const [field, messages] of Object.entries(z.flattenError(error).fieldErrors)) {
    const first = (messages as string[] | undefined)?.[0];
    if (first) fieldErrors[field as Field] = first;
  }
  return { ok: false, fieldErrors };
}
