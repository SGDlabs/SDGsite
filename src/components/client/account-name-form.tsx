"use client";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { useActionForm } from "@/hooks/use-action-form";
import { accountNameSchema } from "@/lib/validations/auth";
import { updateMyName } from "@/server/actions/account";

/** The client's own name: the one in the menu, in the e-mails and in the admin. */
export function AccountNameForm({ name }: { name: string }) {
  const { form, onSubmit, formError, message } = useActionForm(accountNameSchema, updateMyName, {
    name,
  });
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <form noValidate onSubmit={onSubmit} aria-busy={isSubmitting} className="flex flex-col gap-5">
      {formError && <Notice tone="alert">{formError}</Notice>}
      {message && <Notice>{message}</Notice>}
      <Field label="Seu nome" error={errors.name?.message}>
        {(control) => <Input {...control} autoComplete="name" {...register("name")} />}
      </Field>
      <Button type="submit" variant="outline" disabled={isSubmitting} className="self-start">
        {isSubmitting ? "Salvando…" : "Salvar nome"}
      </Button>
    </form>
  );
}
