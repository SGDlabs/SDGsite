"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/current-user";
import { safeFileName } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";
import { invalid, type FormResult } from "@/lib/validations/form-result";
import {
  portfolioItemSchema,
  portfolioUploadSchema,
  splitStack,
  type PortfolioItemInput,
  type PortfolioUploadInput,
} from "@/lib/validations/portfolio";
import { PORTFOLIO_TAG } from "@/server/queries/portfolio";

// Admin: the portfolio cases. The public pages read them through "use cache" (PORTFOLIO_TAG), so
// every change expires that cache right away (updateTag) for the next visitor.

const BUCKET = "portfolio";
const uuid = z.uuid();

function published() {
  updateTag(PORTFOLIO_TAG);
  revalidatePath("/admin/portfolio");
}

type PortfolioField = keyof PortfolioItemInput;

/** Creates a case (then opens it) or saves one. */
export async function savePortfolioItem(
  input: PortfolioItemInput,
): Promise<FormResult<PortfolioField>> {
  await requireRole("admin");
  const parsed = portfolioItemSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const item = parsed.data;

  const row = {
    title: item.title,
    slug: item.slug,
    summary: item.summary,
    body: item.body,
    category: item.category,
    stack: splitStack(item.stack),
    live_url: item.liveUrl || null,
    cover_path: item.coverPath || null,
    cover_alt: item.coverAlt,
    gallery: item.gallery,
    generative_cover: item.generativeCover || null,
    pixel_art: item.pixelArt,
    featured: item.featured,
    published: item.published,
  };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("portfolio_items")
    .select("id")
    .eq("id", item.id)
    .maybeSingle();

  let error;
  if (existing) {
    ({ error } = await supabase.from("portfolio_items").update(row).eq("id", item.id));
  } else {
    // new cases go to the end of the list
    const { data: last } = await supabase
      .from("portfolio_items")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    ({ error } = await supabase
      .from("portfolio_items")
      .insert({ ...row, id: item.id, sort_order: (last?.sort_order ?? 0) + 1 }));
  }

  if (error?.code === "23505") {
    return { ok: false, fieldErrors: { slug: "Já existe um caso com esse endereço." } };
  }
  if (error) {
    console.error("[portfolio] not saved", { code: error.code });
    return { ok: false, formError: "Não conseguimos salvar. Tente de novo." };
  }
  published();
  revalidatePath(`/admin/portfolio/${item.id}`);
  if (!existing) redirect(`/admin/portfolio/${item.id}`);
  return { ok: true, message: item.published ? "Salvo e publicado." : "Salvo como rascunho." };
}

/** Signs uploads to the public bucket, under the case's folder. */
export async function preparePortfolioUpload(
  input: PortfolioUploadInput,
): Promise<
  { ok: true; uploads: { path: string; signedUrl: string }[] } | { ok: false; formError: string }
> {
  await requireRole("admin");
  const parsed = portfolioUploadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, formError: parsed.error.issues[0]?.message ?? "Imagens inválidas." };
  }
  const supabase = await createClient();
  const uploads = [];
  for (const file of parsed.data.files) {
    // a short random prefix: the same name can be uploaded twice without overwriting
    const path = `${parsed.data.itemId}/${randomUUID().slice(0, 8)}-${safeFileName(file.name)}`;
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error) {
      console.error("[portfolio] upload not signed", { message: error.message });
      return { ok: false, formError: "Não conseguimos preparar o envio." };
    }
    uploads.push({ path, signedUrl: data.signedUrl });
  }
  return { ok: true, uploads };
}

/** Publishes, unpublishes, highlights on the landing or not. */
export async function setPortfolioFlag(input: {
  id: string;
  flag: "published" | "featured";
  value: boolean;
}): Promise<FormResult> {
  await requireRole("admin");
  if (!uuid.safeParse(input.id).success || !["published", "featured"].includes(input.flag)) {
    return { ok: false, formError: "Caso inválido." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("portfolio_items")
    .update(
      input.flag === "published"
        ? { published: Boolean(input.value) }
        : { featured: Boolean(input.value) },
    )
    .eq("id", input.id);
  if (error) return { ok: false, formError: "Não conseguimos salvar." };
  published();
  return { ok: true };
}

/** Moves a case one place up or down in the listing order. */
export async function movePortfolioItem(input: {
  id: string;
  direction: "up" | "down";
}): Promise<FormResult> {
  await requireRole("admin");
  if (!uuid.safeParse(input.id).success) return { ok: false, formError: "Caso inválido." };
  const supabase = await createClient();
  const { data: items, error } = await supabase
    .from("portfolio_items")
    .select("id, sort_order")
    .order("sort_order")
    .order("created_at");
  if (error) return { ok: false, formError: "Não conseguimos mudar a ordem." };

  const index = items.findIndex((item) => item.id === input.id);
  const other = items[input.direction === "up" ? index - 1 : index + 1];
  if (index < 0 || !other) return { ok: true };
  // renumber the whole list in its new order: no ties left behind
  const order = items.map((item) => item.id);
  [order[index], order[items.indexOf(other)]] = [other.id, input.id];
  for (const [position, id] of order.entries()) {
    const { error: moveError } = await supabase
      .from("portfolio_items")
      .update({ sort_order: position + 1 })
      .eq("id", id);
    if (moveError) return { ok: false, formError: "Não conseguimos mudar a ordem." };
  }
  published();
  return { ok: true };
}

/** Deletes a case and its images. */
export async function deletePortfolioItem(input: { id: string }): Promise<FormResult> {
  await requireRole("admin");
  if (!uuid.safeParse(input.id).success) return { ok: false, formError: "Caso inválido." };
  const supabase = await createClient();
  const { error } = await supabase.from("portfolio_items").delete().eq("id", input.id);
  if (error) return { ok: false, formError: "Não conseguimos excluir." };
  const { data: files } = await supabase.storage.from(BUCKET).list(input.id);
  if (files?.length) {
    await supabase.storage.from(BUCKET).remove(files.map((file) => `${input.id}/${file.name}`));
  }
  published();
  redirect("/admin/portfolio");
}
