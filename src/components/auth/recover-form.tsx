"use client";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { useActionForm } from "@/hooks/use-action-form";
import { recoverPasswordSchema } from "@/lib/validations/auth";
import { requestPasswordReset } from "@/server/actions/auth";

/** Asks for the recovery e-mail. The answer is the same whether or not the e-mail has an account. */
export function RecoverForm() {
  const { form, onSubmit, formError, message } = useActionForm(
    recoverPasswordSchema,
    requestPasswordReset,
    { email: "" },
  );
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  if (message) return <Notice>{message}</Notice>;

  return (
    <form noValidate onSubmit={onSubmit} aria-busy={isSubmitting} className="flex flex-col gap-5">
      {formError && <Notice tone="alert">{formError}</Notice>}
      <Field label="E-mail" error={errors.email?.message}>
        {(control) => (
          <Input {...control} type="email" autoComplete="email" {...register("email")} />
        )}
      </Field>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Enviando…" : "Enviar link"}
      </Button>
    </form>
  );
}
