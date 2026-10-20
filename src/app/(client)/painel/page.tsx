import type { Metadata } from "next";
import { Suspense } from "react";
import { ProjectCard, ProjectCardSkeleton } from "@/components/client/project-card";
import { Container } from "@/components/layout/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { requireRole } from "@/lib/auth/current-user";
import { getMyProjects } from "@/server/queries/projects";

export const metadata: Metadata = { title: "Seus projetos", robots: { index: false } };

export default function ClientDashboardPage() {
  return (
    <main>
      <Container className="flex flex-col gap-8 py-12 md:py-16">
        <header className="flex flex-col gap-3">
          <Eyebrow>Área do cliente</Eyebrow>
          <h1 className="type-h1">Seus projetos</h1>
          <p className="type-lead text-ink-muted">
            Seu software, etapa por etapa. Abra um projeto para ver a etapa atual e as novidades.
          </p>
        </header>
        <Suspense fallback={<ProjectGridSkeleton />}>
          <ProjectList />
        </Suspense>
      </Container>
    </main>
  );
}

async function ProjectList() {
  await requireRole("client");
  const projects = await getMyProjects();

  if (projects.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border-strong p-6 text-ink-muted">
        Nenhum projeto por aqui ainda. Assim que a gente começar o seu, ele aparece nesta página.
      </p>
    );
  }

  return (
    <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <li key={project.id}>
          <ProjectCard project={project} />
        </li>
      ))}
    </ul>
  );
}

function ProjectGridSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando projetos"
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
    >
      <ProjectCardSkeleton />
      <ProjectCardSkeleton />
    </div>
  );
}
