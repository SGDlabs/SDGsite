"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { fieldClasses, Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Notice } from "@/components/ui/notice";
import { useActionForm } from "@/hooks/use-action-form";
import { UPDATE_KIND_LABELS } from "@/lib/project-labels";
import { imageSize, uploadToSignedUrl } from "@/lib/upload";
import { cn } from "@/lib/utils";
import {
  MAX_MEDIA_BYTES,
  MAX_MEDIA_FILES,
  MEDIA_TYPES,
  UPDATE_KINDS,
  updateFormSchema,
} from "@/lib/validations/project";
import { discardUpload, prepareUpload, publishUpdate } from "@/server/actions/projects";

const selectClass = cn(fieldClasses, "min-h-11");
const megabytes = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;

function checkFiles(files: File[]) {
  if (files.length > MAX_MEDIA_FILES)
    return `Envie até ${MAX_MEDIA_FILES} arquivos por atualização.`;
  for (const file of files) {
    if (!(MEDIA_TYPES as readonly string[]).includes(file.type)) {
      return `${file.name}: envie imagens (PNG, JPG, WebP, GIF, AVIF) ou vídeos (MP4, WebM, MOV).`;
    }
    if (file.size > MAX_MEDIA_BYTES) return `${file.name}: cada arquivo pode ter até 50 MB.`;
  }
  return null;
}

/**
 * Posts to a project's feed. The files go straight from the browser to the private bucket
 * (signed uploads, with progress); then the update and its media are published in one
 * transaction. If anything fails on the way, nothing is published and the files are removed.
 */
export function UpdateComposer({
  projectId,
  stages,
  currentStageId,
}: {
  projectId: string;
  stages: { id: string; position: number; title: string }[];
  currentStageId: string;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const fileInput = useId();

  const { form, onSubmit, formError, message } = useActionForm(
    updateFormSchema,
    async (values) => {
      const problem = checkFiles(files);
      if (problem) return { ok: false, formError: problem };

      let updateId = crypto.randomUUID();
      const media = [];
      if (files.length > 0) {
        const prepared = await prepareUpload({
          projectId,
          // checkFiles already accepted every type
          files: files.map(({ name, type, size }) => ({
            name,
            type: type as (typeof MEDIA_TYPES)[number],
            size,
          })),
        });
        if (!prepared.ok) return prepared;
        updateId = prepared.updateId;

        const total = files.reduce((sum, file) => sum + file.size, 0);
        const sent = files.map(() => 0);
        setProgress(0);
        try {
          for (const [index, file] of files.entries()) {
            const ticket = prepared.uploads[index]!;
            await uploadToSignedUrl(ticket.signedUrl, file, (bytes) => {
              sent[index] = bytes;
              setProgress(Math.round((sent.reduce((a, b) => a + b, 0) / total) * 100));
            });
            media.push({
              path: ticket.path,
              mimeType: file.type as (typeof MEDIA_TYPES)[number],
              ...(await imageSize(file)),
            });
          }
        } catch {
          setProgress(null);
          await discardUpload({ projectId, updateId });
          return {
            ok: false,
            formError: "O envio de um arquivo falhou. Nada foi publicado; tente de novo.",
          };
        }
      }

      const result = await publishUpdate({ ...values, id: updateId, projectId, media });
      setProgress(null);
      if (!result.ok) {
        if (media.length > 0) await discardUpload({ projectId, updateId });
        return result;
      }
      setFiles([]);
      return result;
    },
    { title: "", body: "", kind: "nota", stageId: currentStageId },
    { resetOnSuccess: true },
  );
  const {
    register,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <form noValidate onSubmit={onSubmit} aria-busy={isSubmitting} className="flex flex-col gap-5">
      {formError && <Notice tone="alert">{formError}</Notice>}
      {message && <Notice>{message}</Notice>}
      <Field label="Título" error={errors.title?.message}>
        {(control) => <Input {...control} autoComplete="off" {...register("title")} />}
      </Field>
      <Field label="Texto" hint="Opcional." error={errors.body?.message}>
        {(control) => <Textarea {...control} {...register("body")} />}
      </Field>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Tipo" error={errors.kind?.message}>
          {(control) => (
            <select {...control} className={selectClass} {...register("kind")}>
              {UPDATE_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {UPDATE_KIND_LABELS[kind]}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Etapa" error={errors.stageId?.message}>
          {(control) => (
            <select {...control} className={selectClass} {...register("stageId")}>
              <option value="">Sem etapa</option>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.position}. {stage.title}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={fileInput}>Prints e vídeos</Label>
        <input
          id={fileInput}
          type="file"
          multiple
          accept={MEDIA_TYPES.join(",")}
          aria-describedby={`${fileInput}-hint`}
          disabled={isSubmitting}
          className={cn(
            fieldClasses,
            "cursor-pointer file:mr-3 file:cursor-pointer file:rounded-sm file:border-0 file:bg-surface-alt file:px-3 file:py-1.5 file:type-label file:text-ink",
          )}
          onChange={(event) => {
            const chosen = [...(event.target.files ?? [])];
            event.target.value = "";
            const next = [...files, ...chosen];
            setFileError(checkFiles(next));
            setFiles(next);
            // a post with media is usually prints or a video
            if (chosen.length > 0 && getValues("kind") === "nota") {
              setValue("kind", chosen[0]!.type.startsWith("video/") ? "video" : "print");
            }
          }}
        />
        <p id={`${fileInput}-hint`} className="type-small text-ink-muted">
          Opcional. Até {MAX_MEDIA_FILES} arquivos de até 50 MB: imagens ou vídeos.
        </p>
        {fileError && (
          <p role="alert" className="type-small text-ink">
            {fileError}
          </p>
        )}
        {files.length > 0 && (
          <ul aria-label="Arquivos escolhidos" className="flex flex-col gap-1">
            {files.map((file, index) => (
              <li
                key={`${index}-${file.name}`}
                className="flex items-center justify-between gap-3 type-small"
              >
                <span className="truncate">
                  {file.name} <span className="text-ink-muted">({megabytes(file.size)})</span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isSubmitting}
                  aria-label={`Tirar ${file.name}`}
                  onClick={() => {
                    const next = files.filter((_, i) => i !== index);
                    setFiles(next);
                    setFileError(checkFiles(next));
                  }}
                >
                  Tirar
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {progress !== null && (
        <div className="flex flex-col gap-2">
          <div
            role="progressbar"
            aria-label="Enviando arquivos"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            className="h-2 w-full bg-border"
          >
            <div
              className="h-full bg-accent transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="type-small text-ink-muted">Enviando arquivos: {progress}%</span>
        </div>
      )}

      <Button type="submit" disabled={isSubmitting || Boolean(fileError)} className="self-start">
        {isSubmitting ? "Publicando…" : "Publicar atualização"}
      </Button>
    </form>
  );
}
