"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/current-user";
import { requestOrigin } from "@/lib/auth/origin";
import { createAdminClient } from "@/lib/supabase/admin";
import { inviteClientUserSchema, type InviteClientUserInput } from "@/lib/validations/auth";
import { invalid, type FormResult } from "@/lib/validations/form-result";

/**
 * Admin only: gives someone at a client company access to the client area. Supabase sends the
 * invitation e-mail (supabase/templates/invite.html), which links to /convite; role and company
 * go to app_metadata, which only the service role can write and the profile trigger reads.
 */
export async function inviteClientUser(
  input: InviteClientUserInput,
): Promise<FormResult<"clientId" | "email" | "name">> {
  await requireRole("admin");
  const parsed = inviteClientUserSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { clientId, email, name } = parsed.data;

  const admin = createAdminClient();
  const { data: client } = await admin
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .maybeSingle();
  if (!client) return { ok: false, fieldErrors: { clientId: "Essa empresa não existe mais." } };

  const invited = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: name },
    redirectTo: `${await requestOrigin()}/auth/callback?next=/convite`,
  });
  if (invited.error) {
    // only admins see this, so it may say that the e-mail is taken
    if (invited.error.code === "email_exists") {
      return { ok: false, fieldErrors: { email: "Esse e-mail já tem acesso." } };
    }
    console.error("[invite] not sent", { status: invited.error.status, code: invited.error.code });
    return { ok: false, formError: "Não conseguimos enviar o convite. Tente de novo." };
  }

  const userId = invited.data.user.id;
  const updated = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role: "client", client_id: clientId },
  });
  if (updated.error) {
    // without a company the account would be useless: undo the invitation
    await admin.auth.admin.deleteUser(userId);
    console.error("[invite] role not set", {
      status: updated.error.status,
      code: updated.error.code,
    });
    return { ok: false, formError: "Não conseguimos enviar o convite. Tente de novo." };
  }

  return { ok: true, message: `Convite enviado para ${email}.` };
}

const accessSchema = z.object({ userId: z.uuid(), clientId: z.uuid() });

/** The person, if they are a client user of that company (never an admin, never another company's). */
async function clientUserOf(input: { userId: string; clientId: string }) {
  const parsed = accessSchema.safeParse(input);
  if (!parsed.success) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, role, client_id")
    .eq("id", parsed.data.userId)
    .maybeSingle();
  if (!profile || profile.role !== "client" || profile.client_id !== parsed.data.clientId) {
    return null;
  }
  const { data } = await admin.auth.admin.getUserById(profile.id);
  return data.user ? { admin, user: data.user } : null;
}

/** Admin: sends the invitation again to someone who has not accepted it yet (it lasts 24 hours). */
export async function resendInvite(input: {
  userId: string;
  clientId: string;
}): Promise<FormResult> {
  await requireRole("admin");
  const found = await clientUserOf(input);
  if (!found?.user.email) return { ok: false, formError: "Essa pessoa não é deste cliente." };
  if (found.user.email_confirmed_at) {
    return { ok: false, formError: "Essa pessoa já aceitou o convite." };
  }

  // for someone who has not confirmed yet, Supabase sends the invitation again
  const { error } = await found.admin.auth.admin.inviteUserByEmail(found.user.email, {
    data: found.user.user_metadata,
    redirectTo: `${await requestOrigin()}/auth/callback?next=/convite`,
  });
  if (error) {
    console.error("[invite] not resent", { status: error.status, code: error.code });
    return { ok: false, formError: "Não conseguimos reenviar o convite. Tente de novo." };
  }
  revalidatePath(`/admin/clientes/${input.clientId}`);
  return { ok: true, message: `Convite reenviado para ${found.user.email}.` };
}

/**
 * Admin: takes away someone's access to the client area (they left the company, the contract
 * ended). Deletes the Auth user: the profile goes with it, so the next request already finds no
 * session, and row level security no longer gives them anything.
 */
export async function removeClientUser(input: {
  userId: string;
  clientId: string;
}): Promise<FormResult> {
  await requireRole("admin");
  const found = await clientUserOf(input);
  if (!found) return { ok: false, formError: "Essa pessoa não é deste cliente." };

  const { error } = await found.admin.auth.admin.deleteUser(found.user.id);
  if (error) {
    console.error("[access] not removed", { status: error.status, code: error.code });
    return { ok: false, formError: "Não conseguimos remover o acesso. Tente de novo." };
  }
  revalidatePath(`/admin/clientes/${input.clientId}`);
  return { ok: true, message: "Acesso removido." };
}
