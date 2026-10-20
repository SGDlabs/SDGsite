"use client";

import { useId, useState } from "react";
import { useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { fieldClasses, Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Notice } from "@/components/ui/notice";
import { useActionForm } from "@/hooks/use-action-form";
import { portfolioImageUrl } from "@/lib/portfolio-image";
import { slugify } from "@/lib/slug";
import { uploadToSignedUrl } from "@/lib/upload";
import { cn } from "@/lib/utils";
import {
  GENERATIVE_COVERS,
  MAX_GALLERY_IMAGES,
  PORTFOLIO_IMAGE_TYPES,
  portfolioItemSchema,
  type PortfolioItemInput,
} from "@/lib/validations/portfolio";
import { preparePortfolioUpload, savePortfolioItem } from "@/server/actions/portfolio";
import { PORTFOLIO_CATEGORIES } from "@/types/portfolio";

// Admin previews of public bucket images: plain <img>, no optimizer round trip.
/* eslint-disable @next/next/no-img-element */

const selectClass = cn(fieldClasses, "min-h-11");
const fileClass = cn(
  fieldClasses,
  "cursor-pointer file:mr-3 file:cursor-pointer file:rounded-sm file:border-0 file:bg-surface-alt file:px-3 file:py-1.5 file:type-label file:text-ink",
);
const COVER_LABELS: Record<(typeof GENERATIVE_COVERS)[number], string> = {
  blocks: "Blocos",
  wave: "Onda",
  dither: "Pontilhado",
  rings: "Anéis",
};

/** Creates or edits a portfolio case. Images upload as soon as they are picked. */
export function PortfolioForm({ initial, isNew }: { initial: PortfolioItemInput; isNew: boolean }) {
  const { form, onSubmit, formError, message } = useActionForm(
    portfolioItemSchema,
    savePortfolioItem,
    initial,
  );
  const {
    register,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = form;
  const gallery = useFieldArray({ control, name: "gallery" });
  // a new case's address follows its title until someone types one
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [uploading, setUploading] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const coverInput = useId();
  const galleryInput = useId();
  const coverPath = watch("coverPath");

  async function upload(files: File[]) {
    setUploadError(null);
    const prepared = await preparePortfolioUpload({
      itemId: initial.id,
      files: files.map((file) => ({
        name: file.name,
        type: file.type as (typeof PORTFOLIO_IMAGE_TYPES)[number],
        size: file.size,
      })),
    });
    if (!prepared.ok) {
      setUploadError(prepared.formError);
      return [];
    }
    const total = files.reduce((sum, file) => sum + file.size, 0);
    const sent = files.map(() => 0);
    setUploading(0);
    try {
      for (const [index, file] of files.entries()) {
        await uploadToSignedUrl(prepared.uploads[index]!.signedUrl, file, (bytes) => {
          sent[index] = bytes;
          setUploading(Math.round((sent.reduce((a, b) => a + b, 0) / total) * 100));
        });
      }
      return prepared.uploads.map((ticket) => ticket.path);
    } catch {
      setUploadError("O envio de uma imagem falhou. Tente de novo.");
      return [];
    } finally {
      setUploading(null);
    }
  }

  const busy = isSubmitting || uploading !== null;

  return (
    <form noValidate onSubmit={onSubmit} aria-busy={busy} className="flex flex-col gap-6">
      {formError && <Notice tone="alert">{formError}</Notice>}
      {message && <Notice>{message}</Notice>}

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Título" error={errors.title?.message}>
          {(control) => (
            <Input
              {...control}
              autoComplete="off"
              {...register("title", {
                onChange: (event) => {
                  if (!slugTouched) setValue("slug", slugify(event.target.value));
                },
              })}
            />
          )}
        </Field>
        <Field label="Endereço" hint="Aparece em /portfolio/endereço." error={errors.slug?.message}>
          {(control) => (
            <Input
              {...control}
              autoComplete="off"
              {...register("slug", { onChange: () => setSlugTouched(true) })}
            />
          )}
        </Field>
      </div>
      <Field label="Resumo" hint="Uma frase, para o card." error={errors.summary?.message}>
        {(control) => <Input {...control} autoComplete="off" {...register("summary")} />}
      </Field>
      <Field
        label="Texto"
        hint="Separe os parágrafos com uma linha em branco."
        error={errors.body?.message}
      >
        {(control) => <Textarea {...control} rows={8} {...register("body")} />}
      </Field>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Categoria" error={errors.category?.message}>
          {(control) => (
            <select {...control} className={selectClass} {...register("category")}>
              {Object.entries(PORTFOLIO_CATEGORIES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field
          label="Stack"
          hint="Separada por vírgulas: Next.js, Supabase, Vercel."
          error={errors.stack?.message}
        >
          {(control) => <Input {...control} autoComplete="off" {...register("stack")} />}
        </Field>
      </div>
      <Field label="Link do projeto no ar" hint="Opcional." error={errors.liveUrl?.message}>
        {(control) => <Input {...control} type="url" autoComplete="off" {...register("liveUrl")} />}
      </Field>

      <fieldset className="flex flex-col gap-4 border-t border-border pt-5">
        <legend className="type-h3">Capa</legend>
        {coverPath && (
          <img
            src={portfolioImageUrl(coverPath)}
            alt=""
            className="aspect-video w-full max-w-md rounded-sm border border-border object-cover"
          />
        )}
        <div className="flex flex-col gap-2">
          <Label htmlFor={coverInput}>{coverPath ? "Trocar a capa" : "Imagem da capa"}</Label>
          <input
            id={coverInput}
            type="file"
            accept={PORTFOLIO_IMAGE_TYPES.join(",")}
            disabled={busy}
            className={fileClass}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              const [path] = await upload([file]);
              if (path) setValue("coverPath", path, { shouldDirty: true });
            }}
          />
        </div>
        <Field
          label="Descrição da capa"
          hint="O que a imagem mostra, para quem não a vê."
          error={errors.coverAlt?.message}
        >
          {(control) => <Input {...control} autoComplete="off" {...register("coverAlt")} />}
        </Field>
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Capa gerada na landing"
            hint="Opcional: desenho em pixel no lugar da imagem."
          >
            {(control) => (
              <select {...control} className={selectClass} {...register("generativeCover")}>
                <option value="">Nenhuma (usa a imagem)</option>
                {GENERATIVE_COVERS.map((cover) => (
                  <option key={cover} value={cover}>
                    {COVER_LABELS[cover]}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <label className="flex items-center gap-3 self-end py-3">
            <input type="checkbox" className="size-5 accent-accent" {...register("pixelArt")} />
            <span className="type-label">Imagens em pixel art (sem suavizar)</span>
          </label>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4 border-t border-border pt-5">
        <legend className="type-h3">Galeria</legend>
        {gallery.fields.length > 0 && (
          <ul className="flex flex-col gap-4">
            {gallery.fields.map((image, index) => (
              <li key={image.id} className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <img
                  src={portfolioImageUrl(image.path)}
                  alt=""
                  className="aspect-4/3 w-full rounded-sm border border-border object-cover sm:w-40"
                />
                <div className="flex flex-1 flex-col gap-2">
                  <Field
                    label={`Descrição da imagem ${index + 1}`}
                    error={errors.gallery?.[index]?.alt?.message}
                  >
                    {(control) => (
                      <Input
                        {...control}
                        autoComplete="off"
                        {...register(`gallery.${index}.alt`)}
                      />
                    )}
                  </Field>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={index === 0}
                      onClick={() => gallery.move(index, index - 1)}
                    >
                      Subir
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={index === gallery.fields.length - 1}
                      onClick={() => gallery.move(index, index + 1)}
                    >
                      Descer
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => gallery.remove(index)}>
                      Tirar da galeria
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-col gap-2">
          <Label htmlFor={galleryInput}>Adicionar imagens</Label>
          <input
            id={galleryInput}
            type="file"
            multiple
            accept={PORTFOLIO_IMAGE_TYPES.join(",")}
            disabled={busy || gallery.fields.length >= MAX_GALLERY_IMAGES}
            className={fileClass}
            onChange={async (event) => {
              const files = [...(event.target.files ?? [])].slice(
                0,
                MAX_GALLERY_IMAGES - gallery.fields.length,
              );
              event.target.value = "";
              if (files.length === 0) return;
              const paths = await upload(files);
              gallery.append(paths.map((path) => ({ path, alt: "" })));
            }}
          />
          <p className="type-small text-ink-muted">
            Até {MAX_GALLERY_IMAGES} imagens de até 10 MB. Elas sobem na hora; o caso só muda quando
            você salvar.
          </p>
        </div>
      </fieldset>

      {uploading !== null && (
        <div
          role="progressbar"
          aria-label="Enviando imagens"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={uploading}
          className="h-2 w-full bg-border"
        >
          <div className="h-full bg-accent" style={{ width: `${uploading}%` }} />
        </div>
      )}
      {uploadError && <Notice tone="alert">{uploadError}</Notice>}

      <fieldset className="flex flex-col gap-3 border-t border-border pt-5">
        <legend className="type-h3">Publicação</legend>
        <label className="flex items-center gap-3">
          <input type="checkbox" className="size-5 accent-accent" {...register("published")} />
          <span className="type-label">Publicado no site</span>
        </label>
        <label className="flex items-center gap-3">
          <input type="checkbox" className="size-5 accent-accent" {...register("featured")} />
          <span className="type-label">Em destaque na landing</span>
        </label>
      </fieldset>

      <Button type="submit" disabled={busy} className="self-start">
        {isSubmitting ? "Salvando…" : isNew ? "Criar caso" : "Salvar"}
      </Button>
    </form>
  );
}
