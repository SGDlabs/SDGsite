"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { accountNameSchema, type AccountNameInput } from "@/lib/validations/auth";
import { invalid, type FormResult } from "@/lib/validations/form-result";

/** /painel/conta: whether the signed-in user gets the feed's news by e-mail. */
export async function setEmailPreferences(input: {
  notifyUpdates: boolean;
}): Promise<{ ok: true; message: string } | { ok: false; formError: string }> {
  await requireRole("client");
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_my_email_preferences", {
    p_notify_updates: Boolean(input.notifyUpdates),
  });
  if (error) {
    console.error("[account] preferences not saved", { code: error.code });
    return { ok: false, formError: "Não conseguimos salvar. Tente de novo." };
  }
  revalidatePath("/painel/conta");
  return {
    ok: true,
    message: input.notifyUpdates
      ? "Pronto: você recebe as novidades por e-mail."
      : "Pronto: as novidades ficam só na área do cliente.",
  };
}

/** /painel/conta: the signed-in user's name, as they confirmed it when accepting the invitation. */
export async function updateMyName(input: AccountNameInput): Promise<FormResult<"name">> {
  await requireRole("client");
  const parsed = accountNameSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createClient();
  // profiles.full_name follows user_metadata (see the migrations)
  const { error } = await supabase.auth.updateUser({ data: { full_name: parsed.data.name } });
  if (error) {
    console.error("[account] name not saved", { status: error.status, code: error.code });
    return { ok: false, formError: "Não conseguimos salvar. Tente de novo." };
  }
  // the name also shows in the user menu, on every page of the area
  revalidatePath("/painel", "layout");
  return { ok: true, message: "Nome salvo." };
}
