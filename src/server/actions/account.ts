"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";

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
