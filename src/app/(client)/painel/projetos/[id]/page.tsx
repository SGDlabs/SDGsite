import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProjectPanel } from "@/components/client/project-panel";
import { Container } from "@/components/layout/container";
import { requireRole } from "@/lib/auth/current-user";
import { getProject } from "@/server/queries/projects";

export const metadata: Metadata = { title: "Projeto", robots: { index: false } };

export default function ProjectPage({ params }: PageProps<"/painel/projetos/[id]">) {
  return (
    <main>
      <Container className="flex flex-col gap-8 py-10 md:py-14">
        <Link href="/painel" className="self-start type-label">
          ← Seus projetos
        </Link>
        <Suspense fallback={<ProjectSkeleton />}>
          <Project params={params} />
        </Suspense>
      </Container>
    </main>
  );
}

async function Project({ params }: Pick<PageProps<"/painel/projetos/[id]">, "params">) {
  await requireRole("client");
  const { id } = await params;
  const project = await getProject(id);
  // someone else's project and a missing one get the same answer
  if (!project) notFound();
  return <ProjectPanel project={project} />;
}

function ProjectSkeleton() {
  return (
    <div role="status" aria-label="Carregando o projeto" className="flex flex-col gap-10">
      <div aria-hidden="true" className="flex flex-col gap-3">
        <span className="h-5 w-24 bg-surface-alt" />
        <span className="h-10 w-2/3 bg-surface-alt" />
        <span className="h-6 w-1/2 bg-surface-alt" />
      </div>
      <span aria-hidden="true" className="h-40 rounded-md bg-surface-alt" />
      <span aria-hidden="true" className="h-64 rounded-md bg-surface-alt" />
    </div>
  );
}
