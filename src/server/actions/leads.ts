"use server";

import { z } from "zod";
import { supabaseConfig } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
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
