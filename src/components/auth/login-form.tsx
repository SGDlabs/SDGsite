"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { useActionForm } from "@/hooks/use-action-form";
import { signInSchema } from "@/lib/validations/auth";
import { signIn } from "@/server/actions/auth";

/** E-mail and password. Returns to ?next= (set by the proxy) after signing in. */
export function LoginForm() {
  const { form, onSubmit, formError } = useActionForm(
    signInSchema,
    // read at submit time, so the form itself can be part of the static page
    (values) => signIn({ ...values, next: new URLSearchParams(location.search).get("next") ?? "" }),
    { email: "", password: "" },
  );
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <form noValidate onSubmit={onSubmit} aria-busy={isSubmitting} className="flex flex-col gap-5">
      {formError && <Notice tone="alert">{formError}</Notice>}
      <Field label="E-mail" error={errors.email?.message}>
        {(control) => (
          <Input {...control} type="email" autoComplete="username" {...register("email")} />
        )}
      </Field>
      <Field label="Senha" error={errors.password?.message}>
        {(control) => (
          <Input
            {...control}
            type="password"
            autoComplete="current-password"
            {...register("password")}
          />
        )}
      </Field>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Entrando…" : "Entrar"}
      </Button>
      <Link href="/recuperar-senha" className="self-start type-small">
        Esqueci minha senha
      </Link>
    </form>
  );
}
