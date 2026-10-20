"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, type BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";
import { leadSchema, type Lead, type LeadInput } from "@/lib/validations/lead";
import { submitLead } from "@/server/actions/leads";
import { LEAD_SENT_EVENT } from "./brand";

const TYPES = [
  { id: "t-site", value: "site", label: "Site" },
  { id: "t-app", value: "app", label: "Aplicativo" },
  { id: "t-sys", value: "sistema", label: "Sistema" },
  { id: "t-int", value: "integracao", label: "Integração" },
  { id: "t-idk", value: "nao-sei", label: "Ainda não sei" },
];

/** The prototype's contact form, validated with Zod on both sides and sent to a Server Action. */
export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitted, isSubmitting },
  } = useForm<LeadInput, unknown, Lead>({
    resolver: zodResolver(leadSchema),
    // like the prototype: errors only change when the form is sent again
    reValidateMode: "onSubmit",
    defaultValues: { name: "", email: "", company: "", types: [], message: "" },
  });

  async function onSubmit(values: Lead, event?: BaseSyntheticEvent) {
    const form = event?.target as HTMLFormElement | undefined;
    setFormError(null);
    const result = await submitLead(values);
    if (!result.ok) {
      for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
        if (message) setError(field as "name" | "email", { message }, { shouldFocus: true });
      }
      setFormError(result.formError ?? null);
      return;
    }
    setSent(true);
    form?.dispatchEvent(new CustomEvent(LEAD_SENT_EVENT, { bubbles: true }));
  }

  // aria-invalid appears after the first send, as in the prototype
  const invalid = (field: "name" | "email") => (isSubmitted ? Boolean(errors[field]) : undefined);

  return (
    <form
      className="form"
      id="form"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      aria-busy={isSubmitting}
    >
      <div className="f-row">
        <div className={errors.name ? "field-w err" : "field-w"}>
          <label htmlFor="f-name">Nome</label>
          <input
            id="f-name"
            autoComplete="name"
            placeholder="Seu nome"
            aria-invalid={invalid("name")}
            aria-describedby="e-name"
            {...register("name")}
          />
          <span className="err-msg" id="e-name">
            {errors.name?.message}
          </span>
        </div>
        <div className={errors.email ? "field-w err" : "field-w"}>
          <label htmlFor="f-email">E-mail</label>
          <input
            id="f-email"
            type="email"
            autoComplete="email"
            placeholder="voce@empresa.com.br"
            aria-invalid={invalid("email")}
            aria-describedby="e-email"
            {...register("email")}
          />
          <span className="err-msg" id="e-email">
            {errors.email?.message}
          </span>
        </div>
      </div>
      <div className="field-w">
        <label htmlFor="f-company">Empresa (opcional)</label>
        <input
          id="f-company"
          autoComplete="organization"
          placeholder="Nome da empresa"
          {...register("company")}
        />
      </div>
      <fieldset className="chips">
        <legend>O que você quer construir?</legend>
        {TYPES.map((type) => (
          <label key={type.id} className="chip">
            <input type="checkbox" id={type.id} value={type.value} {...register("types")} />
            <span>{type.label}</span>
          </label>
        ))}
      </fieldset>
      <div className="field-w">
        <label htmlFor="f-msg">Conta um pouco do projeto</label>
        <textarea
          id="f-msg"
          placeholder="O que você precisa, para quando e qualquer referência que ajude"
          {...register("message")}
        ></textarea>
      </div>
      <button className="btn btn-primary btn-lg magnetic" id="f-submit" type="submit">
        <span>Enviar mensagem</span>
      </button>
      <div id="formNote" role="status" aria-live="polite">
        {sent && (
          <div className="form-ok">
            <b aria-hidden="true">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="3"
              >
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </b>
            <div>
              <strong>Mensagem enviada.</strong>A gente responde por e-mail com as próximas etapas e
              um horário para conversar.
            </div>
          </div>
        )}
        {formError && <span className="err-msg">{formError}</span>}
      </div>
    </form>
  );
}
