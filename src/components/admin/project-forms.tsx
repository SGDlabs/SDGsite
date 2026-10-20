"use client";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { fieldClasses, Input, Textarea } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { useActionForm } from "@/hooks/use-action-form";
import { PROJECT_TYPE_LABELS } from "@/lib/project-labels";
import { cn } from "@/lib/utils";
import {
  newProjectSchema,
  PROJECT_TYPES,
  projectDetailsSchema,
  stageSchema,
} from "@/lib/validations/project";
import { createProject, updateProjectDetails, updateStage } from "@/server/actions/projects";

const selectClass = cn(fieldClasses, "min-h-11");

/** /admin/projetos/novo: client, name, type and an optional delivery date. */
export function NewProjectForm({
  clients,
  clientId = "",
}: {
  clients: { id: string; name: string }[];
  clientId?: string;
}) {
  const { form, onSubmit, formError } = useActionForm(newProjectSchema, createProject, {
    clientId,
    name: "",
    type: "site",
    dueAt: "",
  });
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <form noValidate onSubmit={onSubmit} aria-busy={isSubmitting} className="flex flex-col gap-5">
      {formError && <Notice tone="alert">{formError}</Notice>}
      <Field label="Cliente" error={errors.clientId?.message}>
        {(control) => (
          <select {...control} className={selectClass} {...register("clientId")}>
            <option value="">Escolha o cliente</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Field label="Nome do projeto" error={errors.name?.message}>
        {(control) => <Input {...control} autoComplete="off" {...register("name")} />}
      </Field>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Tipo" error={errors.type?.message}>
          {(control) => (
            <select {...control} className={selectClass} {...register("type")}>
              {PROJECT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {PROJECT_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Previsão de entrega" hint="Opcional." error={errors.dueAt?.message}>
          {(control) => <Input {...control} type="date" {...register("dueAt")} />}
        </Field>
      </div>
      <p className="type-small text-ink-muted">
        O projeto nasce com as 5 etapas padrão, a primeira já em andamento.
      </p>
      <Button type="submit" disabled={isSubmitting} className="self-start">
        {isSubmitting ? "Criando…" : "Criar projeto"}
      </Button>
    </form>
  );
}

/** Name and dates of an existing project. */
export function ProjectDetailsForm({
  project,
}: {
  project: { id: string; name: string; startedAt: string; dueAt: string };
}) {
  const { form, onSubmit, formError, message } = useActionForm(
    projectDetailsSchema,
    updateProjectDetails,
    project,
  );
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <form noValidate onSubmit={onSubmit} aria-busy={isSubmitting} className="flex flex-col gap-5">
      {formError && <Notice tone="alert">{formError}</Notice>}
      {message && <Notice>{message}</Notice>}
      <Field label="Nome do projeto" error={errors.name?.message}>
        {(control) => <Input {...control} autoComplete="off" {...register("name")} />}
      </Field>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Início" error={errors.startedAt?.message}>
          {(control) => <Input {...control} type="date" {...register("startedAt")} />}
        </Field>
        <Field label="Previsão de entrega" error={errors.dueAt?.message}>
          {(control) => <Input {...control} type="date" {...register("dueAt")} />}
        </Field>
      </div>
      <Button type="submit" disabled={isSubmitting} className="self-start">
        {isSubmitting ? "Salvando…" : "Salvar projeto"}
      </Button>
    </form>
  );
}

/** One stage's name and the description the client reads under the stage line. */
export function StageForm({
  stage,
}: {
  stage: { id: string; projectId: string; position: number; title: string; description: string };
}) {
  const { form, onSubmit, formError, message } = useActionForm(stageSchema, updateStage, {
    id: stage.id,
    projectId: stage.projectId,
    title: stage.title,
    description: stage.description,
  });
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      aria-busy={isSubmitting}
      aria-label={`Etapa ${stage.position}`}
      className="flex flex-col gap-3"
    >
      {formError && <Notice tone="alert">{formError}</Notice>}
      <Field label={`Etapa ${stage.position}`} error={errors.title?.message}>
        {(control) => <Input {...control} autoComplete="off" {...register("title")} />}
      </Field>
      <Field label={`Descrição da etapa ${stage.position}`} error={errors.description?.message}>
        {(control) => (
          <Textarea {...control} rows={2} className="min-h-16" {...register("description")} />
        )}
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="outline" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "Salvando…" : "Salvar etapa"}
        </Button>
        {message && (
          <span role="status" className="type-small text-ink-muted">
            {message}
          </span>
        )}
      </div>
    </form>
  );
}
