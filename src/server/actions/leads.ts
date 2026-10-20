"use server";

import { z } from "zod";
import { leadSchema } from "@/lib/validations/lead";

export type LeadResult =
  { ok: true } | { ok: false; fieldErrors: Partial<Record<"name" | "email", string>> };

/** Contact form submission from the landing. Public: anyone may send a lead. */
export async function submitLead(input: unknown): Promise<LeadResult> {
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    return {
      ok: false,
      fieldErrors: { name: fieldErrors.name?.[0], email: fieldErrors.email?.[0] },
    };
  }

  // Until the leads table exists (prompt 6) the lead is only logged, without contact details.
  const lead = parsed.data;
  console.info("[lead] received", {
    types: lead.types,
    hasCompany: Boolean(lead.company),
    messageLength: lead.message?.length ?? 0,
  });
  return { ok: true };
}
