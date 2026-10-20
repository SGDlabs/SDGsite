"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/current-user";
import { supabaseConfig } from "@/lib/env";
import type { LeadStatus } from "@/lib/lead-labels";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { invalid, type FormResult } from "@/lib/validations/form-result";
import { leadSchema } from "@/lib/validations/lead";

export type LeadResult =
  | { ok: true }
  | {
      ok: false;
      fieldErrors?: Partial<Record<"name" | "email", string>>;
      formError?: string;
    };

/** Contact form submission from the landing. Public: anyone may send a lead (RLS: status novo). */
export async function submitLead(input: unknown): Promise<LeadResult> {
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    return {
      ok: false,
      fieldErrors: { name: fieldErrors.name?.[0], email: fieldErrors.email?.[0] },
    };
  }

  const lead = parsed.data;
  // never log contact details
  const summary = {
    types: lead.types,
    hasCompany: Boolean(lead.company),
    messageLength: lead.message?.length ?? 0,
  };

  if (!supabaseConfig) {
    console.info("[lead] received (no database configured, not stored)", summary);
    return { ok: true };
  }

  const { error } = await createPublicClient()
    .from("leads")
    .insert({
      name: lead.name,
      email: lead.email,
      company: lead.company || null,
      message: lead.message || null,
      service_interest: lead.types,
    });
  if (error) {
    console.error("[lead] could not be stored", { ...summary, code: error.code });
    return {
      ok: false,
      formError: "Não conseguimos enviar agora. Tente de novo em alguns minutos.",
    };
  }
  return { ok: true };
}

const leadStatusSchema = z.object({
  id: z.uuid(),
  status: z.enum(["novo", "em_contato", "fechado", "perdido"]),
});

/** Admin: moves a lead along (novo, em contato, fechado, perdido). */
export async function updateLeadStatus(input: {
  id: string;
  status: LeadStatus;
}): Promise<FormResult<"status">> {
  await requireRole("admin");
  const parsed = leadStatusSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id);
  if (error) {
    console.error("[lead] status not saved", { code: error.code });
    return { ok: false, formError: "Não conseguimos mudar o status. Tente de novo." };
  }
  revalidatePath("/admin/leads");
  revalidatePath("/admin");
  return { ok: true };
}
