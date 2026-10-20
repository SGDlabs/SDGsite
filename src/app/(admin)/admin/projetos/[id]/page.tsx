import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StageTracker } from "@/components/client/stage-tracker";
import { ListSkeleton, PageHeader, Panel } from "@/components/admin/page-header";
import {
  AdminUpdateList,
  AdvanceStageButton,
  ProjectStatusActions,
} from "@/components/admin/project-actions";
import { ProjectDetailsForm, StageForm } from "@/components/admin/project-forms";
import { IntegrationPanel } from "@/components/admin/integration-panel";
import { UpdateComposer } from "@/components/admin/update-composer";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/auth/current-user";
import { toDateInput } from "@/lib/format";
import { PROJECT_STATUS_LABELS, PROJECT_TYPE_LABELS, stageLine } from "@/lib/project-labels";
import { getProjectClient, getProjectTokens } from "@/server/queries/admin";
import { getProject } from "@/server/queries/projects";

export const metadata: Metadata = { title: "Projeto", robots: { index: false } };

export default function AdminProjectPage({ params }: PageProps<"/admin/projetos/[id]">) {
  return (
    <>
      <Link href="/admin/projetos" className="self-start type-label">
        ← Projetos
      </Link>
      <Suspense fallback={<ListSkeleton rows={8} label="Carregando o projeto" />}>
        <Project params={params} />
      </Suspense>
    </>
  );
}

async function Project({ params }: Pick<PageProps<"/admin/projetos/[id]">, "params">) {
  await requireRole("admin");
  const { id } = await params;
  const [project, client] = await Promise.all([getProject(id), getProjectClient(id)]);
  if (!project || !client) notFound();
  const tokens = await getProjectTokens(project.id);

  const current = project.stages.find((stage) => stage.status === "em_andamento");
  const isLast = current?.position === project.stages.at(-1)?.position;

  return (
    <>
      <PageHeader
        eyebrow={client.name}
        title={project.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Badge size="sm" variant="outline">
              {PROJECT_TYPE_LABELS[project.type]}
            </Badge>
            <Badge size="sm" variant={project.status === "ativo" ? "outline" : "muted"}>
              {PROJECT_STATUS_LABELS[project.status]}
            </Badge>
            <span>{stageLine(project.currentPosition, project.stages.length, current?.title)}</span>
          </span>
        }
        action={<ProjectStatusActions id={project.id} status={project.status} />}
      />

      <Panel
        title="Etapas"
        action={
          <Link href={`/painel/projetos/${project.id}`} className="type-label">
            Ver como o cliente
          </Link>
        }
      >
        <StageTracker stages={project.stages} />
        {current && project.status !== "concluido" ? (
          <AdvanceStageButton projectId={project.id} currentTitle={current.title} isLast={isLast} />
        ) : (
          <p className="type-small text-ink-muted">Nenhuma etapa em andamento.</p>
        )}
        <details className="group border-t border-border pt-4">
          <summary className="cursor-pointer type-label">
            Editar nomes e descrições das etapas
          </summary>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            {project.stages.map((stage) => (
              <StageForm
                key={stage.id}
                stage={{
                  id: stage.id,
                  projectId: project.id,
                  position: stage.position,
                  title: stage.title,
                  description: stage.description ?? "",
                }}
              />
            ))}
          </div>
        </details>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Nova atualização">
          <UpdateComposer
            projectId={project.id}
            stages={project.stages}
            currentStageId={current?.id ?? ""}
          />
        </Panel>
        <Panel title="Dados do projeto">
          <ProjectDetailsForm
            project={{
              id: project.id,
              name: project.name,
              startedAt: toDateInput(project.startedAt),
              dueAt: toDateInput(project.dueAt),
            }}
          />
        </Panel>
      </div>

      <Panel title="Atualizações publicadas">
        <AdminUpdateList
          projectId={project.id}
          updates={project.updates.map((update) => ({
            id: update.id,
            kind: update.kind,
            title: update.title,
            createdAt: update.createdAt,
            createdAtLabel: update.createdAtLabel,
            mediaCount: update.media.length,
          }))}
        />
      </Panel>

      <Panel title="Integração">
        <IntegrationPanel projectId={project.id} tokens={tokens} />
      </Panel>
    </>
  );
}
