import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { takeRequest } from "@/lib/integration/rate-limit";
import { bearerToken, hashToken } from "@/lib/integration/tokens";
import { serverEnv, supabaseConfig } from "@/lib/env";
import { safeFileName } from "@/lib/slug";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  integrationUpdateSchema,
  isApiMediaType,
  MAX_API_FILES,
  MAX_API_FILES_BYTES,
} from "@/lib/validations/integration";

// POST /api/integrations/updates: a client's own pipeline (a deploy, a test run) posts to its
// project's feed with a token generated in the admin. JSON for text only, multipart/form-data
// with "files" for prints and videos. It only posts: advancing a stage stays with the admins.
// See docs/integracao.md.

const BUCKET = "project-media";
// a little room over the files for the form fields
const MAX_REQUEST_BYTES = MAX_API_FILES_BYTES + 256 * 1024;

function problem(status: number, code: string, message: string, headers?: HeadersInit) {
  return NextResponse.json({ error: { code, message } }, { status, headers });
}

export async function POST(request: Request) {
  if (!supabaseConfig || !serverEnv().SUPABASE_SERVICE_ROLE_KEY) {
    return problem(503, "unavailable", "A integração não está disponível neste ambiente.");
  }

  const token = bearerToken(request.headers.get("authorization"));
  if (!token) {
    return problem(401, "missing_token", "Envie o token no cabeçalho Authorization: Bearer sdg_…");
  }

  const supabase = createAdminClient();
  const { data: stored, error: tokenError } = await supabase
    .from("project_tokens")
    .select("id, project_id, revoked_at")
    .eq("token_hash", hashToken(token))
    .maybeSingle();
  if (tokenError) return problem(500, "internal_error", "Não conseguimos conferir o token.");
  if (!stored) return problem(401, "invalid_token", "Token inválido.");
  if (stored.revoked_at) {
    return problem(401, "revoked_token", "Esse token foi revogado. Peça um novo à SDG Labs.");
  }

  const limit = takeRequest(stored.id, Date.now());
  if (!limit.ok) {
    return problem(
      429,
      "rate_limited",
      `Muitas chamadas com esse token. Tente de novo em ${limit.retryAfterSeconds} segundos.`,
      { "Retry-After": String(limit.retryAfterSeconds) },
    );
  }

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_REQUEST_BYTES) {
    return problem(413, "payload_too_large", "Os arquivos de uma chamada somam no máximo 4 MB.");
  }

  // the fields and the files, from JSON or a multipart form
  const type = request.headers.get("content-type") ?? "";
  let fields: unknown;
  let files: File[] = [];
  if (type.startsWith("application/json")) {
    fields = await request.json().catch(() => undefined);
  } else if (type.startsWith("multipart/form-data")) {
    const form = await request.formData().catch(() => null);
    if (!form) return problem(400, "invalid_request", "Formulário multipart inválido.");
    const text = (name: string) => form.get(name) ?? undefined;
    fields = { kind: text("kind"), title: text("title"), body: text("body"), stage: text("stage") };
    files = form.getAll("files").filter((value): value is File => value instanceof File);
  } else {
    return problem(415, "unsupported_media_type", "Envie application/json ou multipart/form-data.");
  }

  const parsed = integrationUpdateSchema.safeParse(fields);
  if (!parsed.success) {
    return problem(400, "invalid_request", z.prettifyError(parsed.error));
  }
  if (files.length > MAX_API_FILES) {
    return problem(400, "too_many_files", `Envie até ${MAX_API_FILES} arquivos por chamada.`);
  }
  const unsupported = files.find((file) => !isApiMediaType(file.type));
  if (unsupported) {
    return problem(
      415,
      "unsupported_file_type",
      `${unsupported.name}: envie imagens (PNG, JPG, WebP, GIF, AVIF) ou vídeos (MP4, WebM, MOV).`,
    );
  }
  if (files.reduce((sum, file) => sum + file.size, 0) > MAX_API_FILES_BYTES) {
    return problem(413, "payload_too_large", "Os arquivos de uma chamada somam no máximo 4 MB.");
  }

  // files first, under the update's folder; then the update and its media in one transaction
  const updateId = randomUUID();
  const media: { path: string; mime_type: string }[] = [];
  const removeUploaded = () =>
    media.length > 0 && supabase.storage.from(BUCKET).remove(media.map((item) => item.path));
  for (const [index, file] of files.entries()) {
    const path = `${stored.project_id}/${updateId}/${String(index + 1).padStart(2, "0")}-${safeFileName(file.name)}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) {
      await removeUploaded();
      return problem(502, "upload_failed", `Não conseguimos guardar ${file.name}. Tente de novo.`);
    }
    media.push({ path, mime_type: file.type });
  }

  const update = parsed.data;
  const { data, error } = await supabase.rpc("publish_integration_update", {
    p_token_id: stored.id,
    p_id: updateId,
    // the function accepts null (the stage in progress); the generated type does not say so
    p_stage_position: (update.stage ?? null) as number,
    p_kind: update.kind,
    p_title: update.title,
    p_body: update.body ?? "",
    p_media: media,
  });
  if (error) {
    await removeUploaded();
    if (error.code === "22023") {
      return problem(400, "invalid_stage", "Esse projeto não tem essa etapa.");
    }
    if (error.code === "28000") return problem(401, "revoked_token", "Esse token foi revogado.");
    console.error("[integration] update not published", { code: error.code });
    return problem(500, "internal_error", "Não conseguimos publicar. Tente de novo.");
  }

  return NextResponse.json(
    {
      id: data.id,
      project_id: data.project_id,
      kind: data.kind,
      title: data.title,
      media: media.length,
    },
    { status: 201 },
  );
}
