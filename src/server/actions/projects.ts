"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/current-user";
import { fromDateInput } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { invalid, type FormResult } from "@/lib/validations/form-result";
import {
  newProjectSchema,
  projectDetailsSchema,
  projectStatusSchema,
  publishUpdateSchema,
  stageSchema,
  uploadRequestSchema,
  type NewProjectInput,
  type ProjectDetailsInput,
  type PublishUpdateInput,
  type StageInput,
  type UploadRequest,
} from "@/lib/validations/project";

// Admin operations on projects. Every one checks the role and runs as the admin's session, so row
// level security (and the database functions' own admin check) has the final word.

const BUCKET = "project-media";
const uuid = z.uuid();

/** The pages that show a project: the admin's and the client's. */
function revalidateProject(projectId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/projetos");
  revalidatePath(`/admin/projetos/${projectId}`);
  revalidatePath(`/painel/projetos/${projectId}`);
  revalidatePath("/painel");
}

function failure(step: string, error: { code?: string; message?: string }, message: string) {
  console.error(`[projects] ${step}`, { code: error.code });
  return { ok: false as const, formError: message };
}

/** A new project with the 5-stage template, then its page. */
export async function createProject(
  input: NewProjectInput,
): Promise<FormResult<"clientId" | "name" | "type" | "dueAt">> {
  await requireRole("admin");
  const parsed = newProjectSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createClient();
  const dueAt = fromDateInput(parsed.data.dueAt ?? "");
  const { data, error } = await supabase.rpc("create_project_with_stages", {
    p_client_id: parsed.data.clientId,
    p_name: parsed.data.name,
    p_type: parsed.data.type,
    ...(dueAt ? { p_due_at: dueAt } : {}),
  });
  if (error)
    return failure("not created", error, "Não conseguimos criar o projeto. Tente de novo.");
  revalidatePath("/admin/projetos");
  revalidatePath(`/admin/clientes/${parsed.data.clientId}`);
  redirect(`/admin/projetos/${data.id}`);
}

export async function updateProjectDetails(
  input: ProjectDetailsInput,
): Promise<FormResult<"name" | "startedAt" | "dueAt">> {
  await requireRole("admin");
  const parsed = projectDetailsSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({
      name: parsed.data.name,
      started_at: fromDateInput(parsed.data.startedAt ?? ""),
      due_at: fromDateInput(parsed.data.dueAt ?? ""),
    })
    .eq("id", parsed.data.id);
  if (error) return failure("not saved", error, "Não conseguimos salvar. Tente de novo.");
  revalidateProject(parsed.data.id);
  return { ok: true, message: "Projeto salvo." };
}

/** Pauses, resumes or closes a project. */
export async function setProjectStatus(input: {
  id: string;
  status: "ativo" | "pausado" | "concluido";
}): Promise<FormResult> {
  await requireRole("admin");
  const parsed = projectStatusSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id);
  if (error) return failure("status not saved", error, "Não conseguimos mudar o status.");
  revalidateProject(parsed.data.id);
  return { ok: true };
}

/** A stage's name and description, as the client reads them. */
export async function updateStage(input: StageInput): Promise<FormResult<"title" | "description">> {
  await requireRole("admin");
  const parsed = stageSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase
    .from("project_stages")
    .update({ title: parsed.data.title, description: parsed.data.description || null })
    .eq("id", parsed.data.id)
    .eq("project_id", parsed.data.projectId);
  if (error) return failure("stage not saved", error, "Não conseguimos salvar a etapa.");
  revalidateProject(parsed.data.projectId);
  return { ok: true, message: "Etapa salva." };
}

/** Concludes the current stage and starts the next (advance_project_stage, in one transaction). */
export async function advanceStage(input: { projectId: string }): Promise<FormResult> {
  await requireRole("admin");
  if (!uuid.safeParse(input.projectId).success)
    return { ok: false, formError: "Projeto inválido." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("advance_project_stage", {
    p_project_id: input.projectId,
  });
  if (error) return failure("stage not advanced", error, "Não conseguimos avançar a etapa.");
  revalidateProject(input.projectId);
  return {
    ok: true,
    message: data?.title
      ? `Etapa atual: ${data.title}.`
      : "Última etapa concluída. Projeto concluído.",
  };
}

/** A name Storage accepts and people can read: "Tela Inicial (1).PNG" → "tela-inicial-1.png". */
function safeFileName(name: string, index: number) {
  const dot = name.lastIndexOf(".");
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  const extension =
    dot > 0
      ? name
          .slice(dot + 1)
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
      : "";
  return `${String(index + 1).padStart(2, "0")}-${base || "arquivo"}${extension ? `.${extension}` : ""}`;
}

export type UploadTicket = { path: string; signedUrl: string; contentType: string };

/**
 * First step of posting with files: reserves the update's id and signs one upload per file, so
 * the browser sends them straight to Storage (no size limit of Server Actions on the way).
 */
export async function prepareUpload(
  input: UploadRequest,
): Promise<
  { ok: true; updateId: string; uploads: UploadTicket[] } | { ok: false; formError: string }
> {
  await requireRole("admin");
  const parsed = uploadRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, formError: parsed.error.issues[0]?.message ?? "Arquivos inválidos." };
  }

  const updateId = randomUUID();
  const supabase = await createClient();
  const uploads: UploadTicket[] = [];
  for (const [index, file] of parsed.data.files.entries()) {
    const path = `${parsed.data.projectId}/${updateId}/${safeFileName(file.name, index)}`;
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error) return failure("upload not signed", error, "Não conseguimos preparar o envio.");
    uploads.push({ path, signedUrl: data.signedUrl, contentType: file.type });
  }
  return { ok: true, updateId, uploads };
}

/** Second step: the update and its (already uploaded) media, in one transaction. */
export async function publishUpdate(
  input: PublishUpdateInput,
): Promise<FormResult<"title" | "body" | "kind" | "stageId">> {
  await requireRole("admin");
  const parsed = publishUpdateSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const update = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.rpc("publish_project_update", {
    p_id: update.id,
    p_project_id: update.projectId,
    // the function accepts null (no stage); the generated type does not say so
    p_stage_id: (update.stageId || null) as string,
    p_kind: update.kind,
    p_title: update.title,
    p_body: update.body ?? "",
    p_media: update.media.map((media) => ({
      path: media.path,
      mime_type: media.mimeType,
      width: media.width ?? null,
      height: media.height ?? null,
    })),
  });
  if (error)
    return failure("update not published", error, "Não conseguimos publicar. Tente de novo.");
  revalidateProject(update.projectId);
  return { ok: true, message: "Atualização publicada." };
}

/** The files of an update that will not be published (an upload failed halfway). */
export async function discardUpload(input: { projectId: string; updateId: string }) {
  await requireRole("admin");
  if (!uuid.safeParse(input.projectId).success || !uuid.safeParse(input.updateId).success) return;
  const supabase = await createClient();
  const folder = `${input.projectId}/${input.updateId}`;
  const { data } = await supabase.storage.from(BUCKET).list(folder);
  if (data?.length) {
    await supabase.storage.from(BUCKET).remove(data.map((file) => `${folder}/${file.name}`));
  }
}

/** Removes an update from the feed, with its files. */
export async function deleteUpdate(input: { id: string; projectId: string }): Promise<FormResult> {
  await requireRole("admin");
  if (!uuid.safeParse(input.id).success || !uuid.safeParse(input.projectId).success) {
    return { ok: false, formError: "Atualização inválida." };
  }
  const supabase = await createClient();
  const { data: media } = await supabase
    .from("update_media")
    .select("storage_path")
    .eq("update_id", input.id);
  const { error } = await supabase
    .from("project_updates")
    .delete()
    .eq("id", input.id)
    .eq("project_id", input.projectId);
  if (error) return failure("update not deleted", error, "Não conseguimos excluir.");
  if (media?.length) {
    await supabase.storage.from(BUCKET).remove(media.map((item) => item.storage_path));
  }
  revalidateProject(input.projectId);
  return { ok: true };
}
