import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ListSkeleton, PageHeader, Panel } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/auth/current-user";
import { stageLine, UPDATE_KIND_LABELS } from "@/lib/project-labels";
import { getOverview } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default function AdminOverviewPage() {
  return (
    <>
      <PageHeader
        title="Visão geral"
        description="Projetos em andamento, leads novos e o que saiu no feed."
      />
      <Suspense fallback={<ListSkeleton rows={6} label="Carregando a visão geral" />}>
        <Overview />
      </Suspense>
    </>
  );
}

async function Overview() {
  await requireRole("admin");
  const { projects, newLeadCount, newLeads, updates } = await getOverview();

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Panel title="Projetos em andamento">
        {projects.length === 0 ? (
          <p className="text-ink-muted">Nenhum projeto ativo.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {projects.map((project) => (
              <li key={project.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
                <span className="type-label">{project.name}</span>
                <span className="type-small text-ink-muted">
                  {project.clientName} ·{" "}
                  {stageLine(project.currentPosition, project.stageCount, project.currentTitle)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel
        title={newLeadCount === 1 ? "1 lead novo" : `${newLeadCount} leads novos`}
        action={
          <Link href="/admin/leads?status=novo" className="type-label">
            Ver leads
          </Link>
        }
      >
        {newLeads.length === 0 ? (
          <p className="text-ink-muted">Nenhum lead esperando resposta.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {newLeads.map((lead) => (
              <li
                key={lead.id}
                className="flex items-baseline justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span>
                  <span className="type-label">{lead.name}</span>
                  {lead.company && (
                    <span className="type-small text-ink-muted"> · {lead.company}</span>
                  )}
                </span>
                <span className="type-small whitespace-nowrap text-ink-muted">
                  {lead.createdAtLabel}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="xl:col-span-2">
        <Panel title="Últimas atualizações">
          {updates.length === 0 ? (
            <p className="text-ink-muted">Nada publicado ainda.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {updates.map((update) => (
                <li
                  key={update.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 first:pt-0 last:pb-0"
                >
                  <Badge size="sm" variant={update.kind === "marco" ? "accent" : "muted"}>
                    {UPDATE_KIND_LABELS[update.kind]}
                  </Badge>
                  <span className="type-label">{update.title}</span>
                  <span className="type-small text-ink-muted">
                    {update.projectName} ·{" "}
                    <time dateTime={update.createdAt}>{update.createdAtLabel}</time>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
