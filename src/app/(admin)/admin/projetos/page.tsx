import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ListSkeleton, PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireRole } from "@/lib/auth/current-user";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_TYPE_LABELS,
  stageLine,
  type ProjectStatus,
} from "@/lib/project-labels";
import { cn } from "@/lib/utils";
import { getAdminProjects, getClientOptions } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Projetos", robots: { index: false } };

const STATUSES = Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[];
const isStatus = (value: unknown): value is ProjectStatus =>
  typeof value === "string" && (STATUSES as string[]).includes(value);

export default function ProjectsPage({ searchParams }: PageProps<"/admin/projetos">) {
  return (
    <>
      <PageHeader
        title="Projetos"
        description="Etapas, prazos e o feed de cada projeto."
        action={
          <Button asChild>
            <Link href="/admin/projetos/novo">Novo projeto</Link>
          </Button>
        }
      />
      <Suspense fallback={<ListSkeleton label="Carregando os projetos" />}>
        <Projects searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Projects({ searchParams }: Pick<PageProps<"/admin/projetos">, "searchParams">) {
  await requireRole("admin");
  const params = await searchParams;
  const status = isStatus(params.status) ? params.status : undefined;
  const clientId = typeof params.cliente === "string" ? params.cliente : undefined;
  const [projects, clients] = await Promise.all([
    getAdminProjects({ status, clientId }),
    getClientOptions(),
  ]);
  const href = (next: { status?: string; cliente?: string }) => {
    const query = new URLSearchParams(
      Object.entries({ status, cliente: clientId, ...next }).filter(
        (entry): entry is [string, string] => Boolean(entry[1]),
      ),
    ).toString();
    return query ? `/admin/projetos?${query}` : "/admin/projetos";
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <nav aria-label="Filtrar por status" className="flex flex-wrap gap-2">
          {[undefined, ...STATUSES].map((option) => (
            <Link
              key={option ?? "todos"}
              href={href({ status: option ?? "" })}
              aria-current={status === option ? "page" : undefined}
              className={cn(
                "inline-flex min-h-9 items-center rounded-sm border px-4 type-label no-underline",
                status === option
                  ? "border-accent bg-accent text-on-accent"
                  : "border-border-strong text-ink hover:bg-surface-alt",
              )}
            >
              {option ? PROJECT_STATUS_LABELS[option] : "Todos"}
            </Link>
          ))}
        </nav>
        {/* a plain GET form: the filter lives in the URL and works without JavaScript */}
        <form action="/admin/projetos" className="flex items-end gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <label className="flex flex-col gap-2">
            <span className="type-label">Cliente</span>
            <select
              name="cliente"
              defaultValue={clientId ?? ""}
              className="min-h-9 rounded-sm border border-border-strong bg-surface px-3 type-body text-ink"
            >
              <option value="">Todos os clientes</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" variant="outline" size="sm">
            Filtrar
          </Button>
        </form>
      </div>

      {projects.length === 0 ? (
        <p className="text-ink-muted">Nenhum projeto com esses filtros.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Projeto</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Etapa</TableHead>
              <TableHead>Entrega</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Link href={`/admin/projetos/${project.id}`} className="type-label">
                      {project.name}
                    </Link>
                    <span className="text-ink-muted">{PROJECT_TYPE_LABELS[project.type]}</span>
                  </div>
                </TableCell>
                <TableCell>{project.clientName}</TableCell>
                <TableCell>
                  {stageLine(project.currentPosition, project.stageCount, project.currentTitle)}
                </TableCell>
                <TableCell className="whitespace-nowrap">{project.dueAtLabel ?? "—"}</TableCell>
                <TableCell>
                  <Badge size="sm" variant={project.status === "ativo" ? "outline" : "muted"}>
                    {PROJECT_STATUS_LABELS[project.status]}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
