import { formatDateTime, formatDay } from "@/lib/format";
import type { ProjectDetail, ProjectSummary } from "@/server/queries/projects";

// Sample data for the client area preview: the seed project, with the prototype's pixel-art
// screens standing in for prints. Fixed dates, so the page can be prerendered.

const stage = (
  position: number,
  title: string,
  description: string,
  status: ProjectDetail["stages"][number]["status"],
  startedAt: string | null,
  completedAt: string | null,
) => ({
  id: `stage-${position}`,
  position,
  title,
  description,
  status,
  startedAt,
  completedAt,
  startedAtLabel: startedAt ? formatDay(startedAt) : null,
  completedAtLabel: completedAt ? formatDay(completedAt) : null,
});

const update = (
  id: string,
  kind: ProjectDetail["updates"][number]["kind"],
  title: string,
  body: string | null,
  stageId: string,
  createdAt: string,
  media: ProjectDetail["updates"][number]["media"] = [],
) => ({
  id,
  kind,
  title,
  body,
  stageId,
  createdAt,
  createdAtLabel: formatDateTime(createdAt),
  media,
});

const image = (id: string, url: string) => ({
  id,
  url,
  kind: "image" as const,
  mimeType: "image/png",
  width: 640,
  height: 480,
});

export const SAMPLE_PROJECT: ProjectDetail = {
  id: "amostra",
  name: "App de agendamento",
  type: "app",
  status: "ativo",
  currentPosition: 2,
  startedAt: "2026-09-30T13:00:00Z",
  dueAt: "2026-11-29T13:00:00Z",
  dueAtLabel: formatDay("2026-11-29T13:00:00Z"),
  stages: [
    stage(
      1,
      "Organização de ideias",
      "Briefing, escopo e cronograma.",
      "concluida",
      "2026-09-30T13:00:00Z",
      "2026-10-08T18:00:00Z",
    ),
    stage(2, "Design", "UI/UX e protótipo.", "em_andamento", "2026-10-08T18:00:00Z", null),
    stage(
      3,
      "Desenvolvimento",
      "Construção em entregas curtas, com versões de teste.",
      "pendente",
      null,
      null,
    ),
    stage(4, "Testes e homologação", "Testes e homologação com o cliente.", "pendente", null, null),
    stage(5, "Entrega e publicação", "Publicação e entrega dos acessos.", "pendente", null, null),
  ],
  updates: [
    update("u4", "video", "Vídeo: fluxo de agendamento", null, "stage-2", "2026-10-19T17:20:00Z"),
    update(
      "u3",
      "nota",
      "Protótipo navegável disponível",
      "O link do protótipo está nos arquivos do projeto.",
      "stage-2",
      "2026-10-18T14:05:00Z",
    ),
    update(
      "u2",
      "print",
      "Telas da página inicial",
      "Primeira versão das telas de agenda e de confirmação.",
      "stage-2",
      "2026-10-15T19:40:00Z",
      [
        image("m1", "/portfolio/projeto-app/galeria-1.png"),
        image("m2", "/portfolio/projeto-app/galeria-2.png"),
        image("m3", "/portfolio/projeto-app/cover.png"),
      ],
    ),
    update(
      "u1",
      "marco",
      "Etapa concluída: Organização de ideias",
      null,
      "stage-1",
      "2026-10-08T18:00:00Z",
    ),
  ],
};

export const SAMPLE_CARDS: ProjectSummary[] = [
  {
    id: "amostra",
    name: "App de agendamento",
    type: "app",
    status: "ativo",
    currentPosition: 2,
    stages: SAMPLE_PROJECT.stages,
    lastUpdate: formatDay("2026-10-19T17:20:00Z"),
  },
  {
    id: "amostra-2",
    name: "Site institucional",
    type: "site",
    status: "concluido",
    currentPosition: 5,
    stages: SAMPLE_PROJECT.stages.map((s) => ({ ...s, status: "concluida" as const })),
    lastUpdate: formatDay("2026-08-02T12:00:00Z"),
  },
];
