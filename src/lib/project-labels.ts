import type { Enums } from "@/types/database";

export type ProjectType = Enums<"project_type">;
export type ProjectStatus = Enums<"project_status">;
export type StageStatus = Enums<"stage_status">;
export type UpdateKind = Enums<"update_kind">;

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  site: "Site",
  app: "Aplicativo",
  sistema: "Sistema",
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  ativo: "Em andamento",
  pausado: "Pausado",
  concluido: "Concluído",
};

export const STAGE_STATUS_LABELS: Record<StageStatus, string> = {
  pendente: "A fazer",
  em_andamento: "Em andamento",
  concluida: "Concluída",
};

/** In the order of the feed's filter. */
export const UPDATE_KIND_LABELS: Record<UpdateKind, string> = {
  nota: "Nota",
  print: "Prints",
  video: "Vídeo",
  deploy: "Deploy",
  marco: "Marco",
};

/** "Etapa 2 de 5 — Design", the design system's status line. */
export function stageLine(position: number, total: number, title: string | undefined) {
  return title ? `Etapa ${position} de ${total} — ${title}` : `Etapa ${position} de ${total}`;
}
