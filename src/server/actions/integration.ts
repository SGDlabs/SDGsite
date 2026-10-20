"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/current-user";
import { generateToken, hashToken } from "@/lib/integration/tokens";
import { createAdminClient } from "@/lib/supabase/admin";

// Admin: integration tokens. project_tokens has no policies (nothing reaches it from the
// browser), so these run with the service role, after the role check.

const tokenSchema = z.object({
  projectId: z.uuid(),
  label: z.string().trim().min(1, "Dê um nome ao token, como “GitHub Actions”.").max(80),
});

/** A new token for a project. The token itself is returned once and never stored. */
export async function createProjectToken(input: {
  projectId: string;
  label: string;
}): Promise<{ ok: true; token: string } | { ok: false; formError: string }> {
  await requireRole("admin");
  const parsed = tokenSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, formError: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const token = generateToken();
  const { error } = await createAdminClient()
    .from("project_tokens")
    .insert({
      project_id: parsed.data.projectId,
      label: parsed.data.label,
      token_hash: hashToken(token),
    });
  if (error) {
    console.error("[integration] token not created", { code: error.code });
    return { ok: false, formError: "Não conseguimos criar o token. Tente de novo." };
  }
  revalidatePath(`/admin/projetos/${parsed.data.projectId}`);
  return { ok: true, token };
}

/** Stops a token at once (a leaked one, an old pipeline). */
export async function revokeProjectToken(input: {
  id: string;
  projectId: string;
}): Promise<{ ok: true } | { ok: false; formError: string }> {
  await requireRole("admin");
  if (!z.uuid().safeParse(input.id).success || !z.uuid().safeParse(input.projectId).success) {
    return { ok: false, formError: "Token inválido." };
  }
  const { error } = await createAdminClient()
    .from("project_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", input.id)
    .eq("project_id", input.projectId)
    .is("revoked_at", null);
  if (error) return { ok: false, formError: "Não conseguimos revogar. Tente de novo." };
  revalidatePath(`/admin/projetos/${input.projectId}`);
  return { ok: true };
}
