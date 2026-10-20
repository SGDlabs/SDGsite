"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { clientSchema, type ClientInput } from "@/lib/validations/client";
import { invalid, type FormResult } from "@/lib/validations/form-result";

type ClientField = "name" | "cnpjCpf" | "contactEmail" | "phone";

/**
 * Admin: creates a client company (then opens it) or saves changes to one. Runs as the admin's
 * session, so row level security checks the role again.
 */
export async function saveClient(input: ClientInput): Promise<FormResult<ClientField>> {
  await requireRole("admin");
  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const { id, name, cnpjCpf, contactEmail, phone } = parsed.data;
  const row = {
    name,
    cnpj_cpf: cnpjCpf || null,
    contact_email: contactEmail || null,
    phone: phone || null,
  };
  const supabase = await createClient();

  if (!id) {
    const { data, error } = await supabase.from("clients").insert(row).select("id").single();
    if (error) {
      console.error("[clients] not created", { code: error.code });
      return { ok: false, formError: "Não conseguimos criar o cliente. Tente de novo." };
    }
    revalidatePath("/admin/clientes");
    redirect(`/admin/clientes/${data.id}`);
  }

  const { error } = await supabase.from("clients").update(row).eq("id", id);
  if (error) {
    console.error("[clients] not saved", { code: error.code });
    return { ok: false, formError: "Não conseguimos salvar. Tente de novo." };
  }
  revalidatePath("/admin/clientes");
  revalidatePath(`/admin/clientes/${id}`);
  return { ok: true, message: "Dados salvos." };
}
