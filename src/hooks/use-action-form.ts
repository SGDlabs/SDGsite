"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, type DefaultValues, type FieldValues, type Path } from "react-hook-form";
import type { z } from "zod";
import type { FormResult } from "@/lib/validations/form-result";

/**
 * A form validated by the same Zod schema in the browser and in its Server Action. Puts the
 * action's field errors next to their fields and keeps its form-level error and success message.
 * An action that redirects never resolves here: the page changes instead.
 */
export function useActionForm<Input extends FieldValues, Output extends FieldValues>(
  schema: z.ZodType<Output, Input>,
  action: (values: Output) => Promise<FormResult | undefined>,
  defaultValues: DefaultValues<Input>,
  /** clears the form after a success, ready for the next entry */
  { resetOnSuccess = false }: { resetOnSuccess?: boolean } = {},
) {
  const [formError, setFormError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const form = useForm<Input, unknown, Output>({
    resolver: zodResolver(schema),
    // errors only change when the form is sent again, like the contact form
    reValidateMode: "onSubmit",
    defaultValues,
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    setMessage(null);
    const result = await action(values);
    if (!result) return;
    if (result.ok) {
      if (resetOnSuccess) form.reset(defaultValues);
      setMessage(result.message ?? null);
      return;
    }
    for (const [field, text] of Object.entries(result.fieldErrors ?? {})) {
      if (text) form.setError(field as Path<Input>, { message: text }, { shouldFocus: true });
    }
    setFormError(result.formError ?? null);
  });

  return { form, onSubmit, formError, message };
}
