"use client";

import { useEffect, useId, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useProjectRealtime, type RealtimeStatus } from "@/hooks/use-project-realtime";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_TYPE_LABELS,
  STAGE_STATUS_LABELS,
  stageLine,
} from "@/lib/project-labels";
import type { ProjectDetail } from "@/server/queries/projects";
import { StageTracker } from "./stage-tracker";
import { UpdateFeed } from "./update-feed";

/**
 * A project as its client follows it: the stage line, the selected stage's details and the feed.
 * The data comes from the server; Realtime only says when to fetch it again.
 */
export function ProjectPanel({
  project,
  live = true,
}: {
  project: ProjectDetail;
  /** false: no Realtime subscription (the internal preview with sample data) */
  live?: boolean;
}) {
  const [toast, setToast] = useState<string | null>(null);
  const realtime = useProjectRealtime(
    project.id,
    (update) => setToast(`Nova atualização: ${update.title}`),
    { enabled: live },
  );

  const currentIndex = Math.max(
    0,
    project.stages.findIndex((stage) => stage.status === "em_andamento"),
  );
  // until the client picks a stage, the details follow the current one (and move with it)
  const [picked, setPicked] = useState<number | null>(null);
  const selected = Math.min(picked ?? currentIndex, project.stages.length - 1);
  const stage = project.stages[selected];
  const current = project.stages[currentIndex];
  const detailsId = useId();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <div className="flex flex-col gap-10" data-realtime={realtime}>
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge size="sm" variant="outline">
            {PROJECT_TYPE_LABELS[project.type]}
          </Badge>
          {project.status !== "ativo" && (
            <Badge size="sm" variant="muted">
              {PROJECT_STATUS_LABELS[project.status]}
            </Badge>
          )}
          <LiveStatus status={realtime} />
        </div>
        <h1 className="type-h1">{project.name}</h1>
        <p className="type-lead text-ink-muted">
          {project.status === "concluido"
            ? "Projeto concluído."
            : stageLine(project.currentPosition, project.stages.length, current?.title)}
        </p>
        {project.dueAtLabel && project.status !== "concluido" && (
          <p className="type-small text-ink-muted">Previsão de entrega: {project.dueAtLabel}</p>
        )}
      </header>

      <section aria-labelledby={`${detailsId}-heading`} className="flex flex-col gap-4">
        <h2 id={`${detailsId}-heading`} className="type-h2">
          Etapas
        </h2>
        <Card className="gap-8">
          <StageTracker
            stages={project.stages}
            selection={{ selected, onSelect: setPicked, detailsId }}
          />
          {stage && (
            <div
              id={detailsId}
              className="flex flex-col gap-2 border-t border-border pt-6"
              aria-live="polite"
            >
              <p className="type-eyebrow text-ink-muted">
                Etapa {stage.position} · {STAGE_STATUS_LABELS[stage.status]}
              </p>
              <h3 className="type-h3">{stage.title}</h3>
              {stage.description && <p>{stage.description}</p>}
              <StageDates
                started={stage.startedAtLabel}
                completed={stage.completedAtLabel}
                pending={stage.status === "pendente"}
              />
            </div>
          )}
        </Card>
      </section>

      <section aria-labelledby={`${detailsId}-feed`} className="flex flex-col gap-4">
        <h2 id={`${detailsId}-feed`} className="type-h2">
          Atualizações
        </h2>
        <UpdateFeed updates={project.updates} stages={project.stages} />
      </section>

      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-30 flex justify-center"
      >
        {toast && (
          <div className="pointer-events-auto flex max-w-md items-center gap-3 rounded-md border border-border-strong bg-surface p-3 pl-4 text-ink shadow-pixel">
            <span aria-hidden="true" className="size-2 shrink-0 bg-accent" />
            <span className="type-small">{toast}</span>
            <Button variant="ghost" size="sm" onClick={() => setToast(null)}>
              Fechar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function StageDates({
  started,
  completed,
  pending,
}: {
  started: string | null;
  completed: string | null;
  pending: boolean;
}) {
  if (pending) return <p className="type-small text-ink-muted">Ainda não começou.</p>;
  return (
    <p className="type-small text-ink-muted">
      {started && <>Começou em {started}. </>}
      {completed && <>Concluída em {completed}.</>}
    </p>
  );
}

/** Whether the page is following changes live. Silent while it connects. */
function LiveStatus({ status }: { status: RealtimeStatus }) {
  if (status === "connecting") return null;
  return (
    <span className="flex items-center gap-2 type-eyebrow text-ink-muted">
      <span
        aria-hidden="true"
        className={status === "live" ? "size-2 bg-accent" : "size-2 bg-stage-todo"}
      />
      {status === "live" ? "Ao vivo" : "Reconectando"}
    </span>
  );
}
