"use client";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { useActionForm } from "@/hooks/use-action-form";
import { acceptInviteSchema, newPasswordSchema } from "@/lib/validations/auth";
import { acceptInvite, resetPassword } from "@/server/actions/auth";

/** token_hash from the e-mail link, read at submit time (the token is spent only then). */
const linkToken = () => new URLSearchParams(location.search).get("token_hash") ?? undefined;

const PASSWORD_HINT = "Pelo menos 8 caracteres.";

/** /redefinir-senha: the new password, twice. */
export function NewPasswordForm() {
  const { form, onSubmit, formError } = useActionForm(
    newPasswordSchema,
    (values) => resetPassword({ ...values, tokenHash: linkToken() }),
    { password: "", confirm: "" },
  );
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <form noValidate onSubmit={onSubmit} aria-busy={isSubmitting} className="flex flex-col gap-5">
      {formError && <Notice tone="alert">{formError}</Notice>}
      <Field label="Nova senha" hint={PASSWORD_HINT} error={errors.password?.message}>
        {(control) => (
          <Input
            {...control}
            type="password"
            autoComplete="new-password"
            {...register("password")}
          />
        )}
      </Field>
      <Field label="Repita a nova senha" error={errors.confirm?.message}>
        {(control) => (
          <Input
            {...control}
            type="password"
            autoComplete="new-password"
            {...register("confirm")}
          />
        )}
      </Field>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Salvando…" : "Salvar e entrar"}
      </Button>
    </form>
  );
}

/** /convite: the invited client's name and password. */
export function InviteForm() {
  const { form, onSubmit, formError } = useActionForm(
    acceptInviteSchema,
    (values) => acceptInvite({ ...values, tokenHash: linkToken() }),
    { name: "", password: "", confirm: "" },
  );
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <form noValidate onSubmit={onSubmit} aria-busy={isSubmitting} className="flex flex-col gap-5">
      {formError && <Notice tone="alert">{formError}</Notice>}
      <Field label="Seu nome" error={errors.name?.message}>
        {(control) => <Input {...control} autoComplete="name" {...register("name")} />}
      </Field>
      <Field label="Senha" hint={PASSWORD_HINT} error={errors.password?.message}>
        {(control) => (
          <Input
            {...control}
            type="password"
            autoComplete="new-password"
            {...register("password")}
          />
        )}
      </Field>
      <Field label="Repita a senha" error={errors.confirm?.message}>
        {(control) => (
          <Input
            {...control}
            type="password"
            autoComplete="new-password"
            {...register("confirm")}
          />
        )}
      </Field>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Criando acesso…" : "Criar acesso"}
      </Button>
    </form>
  );
}
