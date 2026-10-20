import type { Enums } from "@/types/database";
import type { PROJECT_TYPES } from "@/lib/validations/lead";

export type LeadStatus = Enums<"lead_status">;

/** In the order a lead moves through. */
export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  novo: "Novo",
  em_contato: "Em contato",
  fechado: "Fechado",
  perdido: "Perdido",
};

export const LEAD_STATUSES = Object.keys(LEAD_STATUS_LABELS) as LeadStatus[];

/** What the contact form's checkboxes mean. */
export const INTEREST_LABELS: Record<(typeof PROJECT_TYPES)[number], string> = {
  site: "Site",
  app: "Aplicativo",
  sistema: "Sistema",
  integracao: "Integração",
  "nao-sei": "Ainda não sabe",
};

export const interestLabel = (value: string) =>
  INTEREST_LABELS[value as keyof typeof INTEREST_LABELS] ?? value;
