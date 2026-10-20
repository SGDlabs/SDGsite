"use client";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { useActionForm } from "@/hooks/use-action-form";
import { inviteClientUserSchema } from "@/lib/validations/auth";
import { inviteClientUser } from "@/server/actions/invitations";

/** Gives someone at this client company access to the client area. */
export function InviteUserForm({ clientId }: { clientId: string }) {
  const { form, onSubmit, formError, message } = useActionForm(
    inviteClientUserSchema,
    inviteClientUser,
    { clientId, email: "", name: "" },
    { resetOnSuccess: true },
  );
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <form noValidate onSubmit={onSubmit} aria-busy={isSubmitting} className="flex flex-col gap-5">
      {formError && <Notice tone="alert">{formError}</Notice>}
      {message && <Notice>{message}</Notice>}
      <input type="hidden" {...register("clientId")} />
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Nome" error={errors.name?.message}>
          {(control) => <Input {...control} autoComplete="off" {...register("name")} />}
        </Field>
        <Field label="E-mail" error={errors.email?.message}>
          {(control) => (
            <Input {...control} type="email" autoComplete="off" {...register("email")} />
          )}
        </Field>
      </div>
      <p className="type-small text-ink-muted">
        A pessoa recebe um e-mail para confirmar o nome e escolher a senha. O link vale por 24
        horas.
      </p>
      <Button type="submit" disabled={isSubmitting} className="self-start">
        {isSubmitting ? "Enviando…" : "Convidar usuário"}
      </Button>
    </form>
  );
}
