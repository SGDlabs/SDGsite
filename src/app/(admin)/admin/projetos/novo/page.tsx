import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ListSkeleton, PageHeader, Panel } from "@/components/admin/page-header";
import { NewProjectForm } from "@/components/admin/project-forms";
import { requireRole } from "@/lib/auth/current-user";
import { getClientOptions } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Novo projeto", robots: { index: false } };

export default function NewProjectPage({ searchParams }: PageProps<"/admin/projetos/novo">) {
  return (
    <>
      <Link href="/admin/projetos" className="self-start type-label">
        ← Projetos
      </Link>
      <PageHeader title="Novo projeto" />
      <Panel title="Projeto">
        <Suspense fallback={<ListSkeleton rows={3} label="Carregando os clientes" />}>
          <Form searchParams={searchParams} />
        </Suspense>
      </Panel>
    </>
  );
}

async function Form({ searchParams }: Pick<PageProps<"/admin/projetos/novo">, "searchParams">) {
  await requireRole("admin");
  const [{ cliente }, clients] = await Promise.all([searchParams, getClientOptions()]);
  if (clients.length === 0) {
    return (
      <p className="text-ink-muted">
        Cadastre um cliente antes: <Link href="/admin/clientes/novo">novo cliente</Link>.
      </p>
    );
  }
  const preselected = clients.some((client) => client.id === cliente) ? (cliente as string) : "";
  return <NewProjectForm clients={clients} clientId={preselected} />;
}
