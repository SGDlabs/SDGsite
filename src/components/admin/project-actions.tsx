"use client";

import { Badge } from "@/components/ui/badge";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { UPDATE_KIND_LABELS, type ProjectStatus, type UpdateKind } from "@/lib/project-labels";
import { advanceStage, deleteUpdate, setProjectStatus } from "@/server/actions/projects";

/** Pause, resume, close or reopen a project. */
export function ProjectStatusActions({ id, status }: { id: string; status: ProjectStatus }) {
  if (status === "ativo") {
    return (
      <div className="flex flex-wrap gap-3">
        <ConfirmButton
          variant="outline"
          size="sm"
          title="Pausar o projeto?"
          description="O cliente vê o projeto como pausado até vocês retomarem."
          confirmLabel="Pausar"
          action={() => setProjectStatus({ id, status: "pausado" })}
        >
          Pausar projeto
        </ConfirmButton>
        <ConfirmButton
          variant="outline"
          size="sm"
          title="Marcar o projeto como concluído?"
          description="As etapas ficam como estão; use “Concluir etapa e avançar” para fechar a última."
          confirmLabel="Marcar como concluído"
          action={() => setProjectStatus({ id, status: "concluido" })}
        >
          Marcar como concluído
        </ConfirmButton>
      </div>
    );
  }
  return (
    <ConfirmButton
      variant="outline"
      size="sm"
      title={status === "pausado" ? "Retomar o projeto?" : "Reabrir o projeto?"}
      confirmLabel={status === "pausado" ? "Retomar" : "Reabrir"}
      action={() => setProjectStatus({ id, status: "ativo" })}
    >
      {status === "pausado" ? "Retomar projeto" : "Reabrir projeto"}
    </ConfirmButton>
  );
}

/** The main action of a running project: close the current stage and start the next. */
export function AdvanceStageButton({
  projectId,
  currentTitle,
  isLast,
}: {
  projectId: string;
  currentTitle: string;
  isLast: boolean;
}) {
  return (
    <ConfirmButton
      title={`Concluir “${currentTitle}”${isLast ? " e o projeto" : " e avançar"}?`}
      description={
        isLast
          ? "É a última etapa: o projeto fica concluído. O cliente vê na hora, e o feed ganha um marco."
          : "A próxima etapa começa agora. O cliente vê a mudança na hora, e o feed ganha um marco."
      }
      confirmLabel={isLast ? "Concluir projeto" : "Concluir e avançar"}
      action={() => advanceStage({ projectId })}
    >
      Concluir etapa e avançar
    </ConfirmButton>
  );
}

/** The project's feed as the admin manages it: what was posted, and a way to take it down. */
export function AdminUpdateList({
  projectId,
  updates,
}: {
  projectId: string;
  updates: {
    id: string;
    kind: UpdateKind;
    title: string;
    createdAt: string;
    createdAtLabel: string;
    mediaCount: number;
  }[];
}) {
  if (updates.length === 0) return <p className="text-ink-muted">Nada publicado ainda.</p>;
  return (
    <ul className="flex flex-col divide-y divide-border">
      {updates.map((update) => (
        <li
          key={update.id}
          className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Badge size="sm" variant={update.kind === "marco" ? "accent" : "muted"}>
              {UPDATE_KIND_LABELS[update.kind]}
            </Badge>
            <span className="type-label">{update.title}</span>
            <span className="type-small text-ink-muted">
              <time dateTime={update.createdAt}>{update.createdAtLabel}</time>
              {update.mediaCount > 0 &&
                ` · ${update.mediaCount} ${update.mediaCount === 1 ? "arquivo" : "arquivos"}`}
            </span>
          </div>
          <ConfirmButton
            variant="ghost"
            size="sm"
            title={`Excluir “${update.title}”?`}
            description="Some do feed do cliente, com os arquivos. Não dá para desfazer."
            confirmLabel="Excluir"
            action={() => deleteUpdate({ id: update.id, projectId })}
          >
            Excluir
          </ConfirmButton>
        </li>
      ))}
    </ul>
  );
}
