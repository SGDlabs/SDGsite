import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PROJECT_STATUS_LABELS, PROJECT_TYPE_LABELS, stageLine } from "@/lib/project-labels";
import type { ProjectSummary } from "@/server/queries/projects";

/** A project on /painel: where it stands and when it last moved. The whole card is the link. */
export function ProjectCard({ project }: { project: ProjectSummary }) {
  const total = project.stages.length;
  const done = project.stages.filter((stage) => stage.status === "concluida").length;
  const current = project.stages.find((stage) => stage.position === project.currentPosition);
  const finished = project.status === "concluido";

  return (
    <Card className="relative h-full justify-between gap-6 transition-shadow hover:shadow-pixel">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge size="sm" variant="outline">
            {PROJECT_TYPE_LABELS[project.type]}
          </Badge>
          {project.status !== "ativo" && (
            <Badge size="sm" variant="muted">
              {PROJECT_STATUS_LABELS[project.status]}
            </Badge>
          )}
        </div>
        <h2 className="type-h3">
          {/* the link covers the card (after:inset-0), so the card reads as one target */}
          <Link
            href={`/painel/projetos/${project.id}`}
            prefetch
            className="text-ink no-underline after:absolute after:inset-0 after:rounded-md hover:underline"
          >
            {project.name}
          </Link>
        </h2>
        <p className="type-label text-ink">
          {finished
            ? "Projeto concluído"
            : stageLine(project.currentPosition, total, current?.title)}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <div
          role="progressbar"
          aria-label="Etapas concluídas"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
          aria-valuetext={`${done} de ${total} etapas concluídas`}
          className="h-2 w-full bg-border"
        >
          <div
            className="h-full bg-accent"
            style={{ width: total ? `${(done / total) * 100}%` : "0%" }}
          />
        </div>
        <p className="type-small text-ink-muted">
          {project.lastUpdate
            ? `Última atualização em ${project.lastUpdate}`
            : "Sem atualizações ainda"}
        </p>
      </div>
    </Card>
  );
}

/** Same shape as a card, while the projects load. */
export function ProjectCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex h-52 flex-col gap-4 rounded-md border border-border bg-surface-alt p-6"
    >
      <span className="h-5 w-20 bg-border" />
      <span className="h-7 w-2/3 bg-border" />
      <span className="h-5 w-1/2 bg-border" />
      <span className="mt-auto h-2 w-full bg-border" />
    </div>
  );
}
