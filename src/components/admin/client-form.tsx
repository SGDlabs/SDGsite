"use client";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { useActionForm } from "@/hooks/use-action-form";
import { clientSchema, type ClientInput } from "@/lib/validations/client";
import { saveClient } from "@/server/actions/clients";

/** Creates a client company (no `initial`) or edits one. */
export function ClientForm({ initial }: { initial?: ClientInput & { id: string } }) {
  const { form, onSubmit, formError, message } = useActionForm(clientSchema, saveClient, {
    id: initial?.id,
    name: initial?.name ?? "",
    cnpjCpf: initial?.cnpjCpf ?? "",
    contactEmail: initial?.contactEmail ?? "",
    phone: initial?.phone ?? "",
  });
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <form noValidate onSubmit={onSubmit} aria-busy={isSubmitting} className="flex flex-col gap-5">
      {formError && <Notice tone="alert">{formError}</Notice>}
      {message && <Notice>{message}</Notice>}
      <Field label="Nome da empresa" error={errors.name?.message}>
        {(control) => <Input {...control} autoComplete="organization" {...register("name")} />}
      </Field>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="CNPJ ou CPF" hint="Opcional." error={errors.cnpjCpf?.message}>
          {(control) => <Input {...control} inputMode="numeric" {...register("cnpjCpf")} />}
        </Field>
        <Field label="Telefone" hint="Opcional." error={errors.phone?.message}>
          {(control) => <Input {...control} type="tel" autoComplete="tel" {...register("phone")} />}
        </Field>
      </div>
      <Field
        label="E-mail de contato"
        hint="Opcional. Quem recebe as cobranças e os avisos gerais."
        error={errors.contactEmail?.message}
      >
        {(control) => (
          <Input {...control} type="email" autoComplete="email" {...register("contactEmail")} />
        )}
      </Field>
      <Button type="submit" disabled={isSubmitting} className="self-start">
        {isSubmitting ? "Salvando…" : initial ? "Salvar" : "Criar cliente"}
      </Button>
    </form>
  );
}
