import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ClientForm } from "@/components/admin/client-form";
import { ClientUserActions } from "@/components/admin/client-user-actions";
import { InviteUserForm } from "@/components/admin/invite-user-form";
import { ListSkeleton, PageHeader, Panel } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/auth/current-user";
import { PROJECT_STATUS_LABELS, PROJECT_TYPE_LABELS } from "@/lib/project-labels";
import { getClient, getClientUsers } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Cliente", robots: { index: false } };

export default function ClientPage({ params }: PageProps<"/admin/clientes/[id]">) {
  return (
    <>
      <Link href="/admin/clientes" className="self-start type-label">
        ← Clientes
      </Link>
      <Suspense fallback={<ListSkeleton rows={6} label="Carregando o cliente" />}>
        <Client params={params} />
      </Suspense>
    </>
  );
}

async function Client({ params }: Pick<PageProps<"/admin/clientes/[id]">, "params">) {
  await requireRole("admin");
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  return (
    <>
      <PageHeader eyebrow="Cliente" title={client.name} />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Dados da empresa">
          <ClientForm
            initial={{
              id: client.id,
              name: client.name,
              cnpjCpf: client.cnpj_cpf ?? "",
              contactEmail: client.contact_email ?? "",
              phone: client.phone ?? "",
            }}
          />
        </Panel>
        <div className="flex flex-col gap-6">
          <Panel title="Usuários">
            <Suspense fallback={<ListSkeleton rows={2} label="Carregando os usuários" />}>
              <Users clientId={client.id} />
            </Suspense>
          </Panel>
          <Panel title="Convidar usuário">
            <InviteUserForm clientId={client.id} />
          </Panel>
        </div>
        <div className="xl:col-span-2">
          <Panel
            title="Projetos"
            action={
              <Link href={`/admin/projetos/novo?cliente=${client.id}`} className="type-label">
                Novo projeto
              </Link>
            }
          >
            {client.projects.length === 0 ? (
              <p className="text-ink-muted">Nenhum projeto ainda.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {client.projects.map((project) => (
                  <li
                    key={project.id}
                    className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <Link href={`/admin/projetos/${project.id}`} className="type-label">
                      {project.name}
                    </Link>
                    <Badge size="sm" variant="outline">
                      {PROJECT_TYPE_LABELS[project.type]}
                    </Badge>
                    <span className="type-small text-ink-muted">
                      {PROJECT_STATUS_LABELS[project.status]}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}

async function Users({ clientId }: { clientId: string }) {
  const users = await getClientUsers(clientId);
  if (users.length === 0) {
    return <p className="text-ink-muted">Ninguém com acesso ainda. Convide abaixo.</p>;
  }
  return (
    <ul className="flex flex-col divide-y divide-border">
      {users.map((user) => (
        <li
          key={user.id}
          className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
        >
          <div className="flex flex-col gap-0.5">
            <span className="type-label">{user.name ?? user.email}</span>
            <span className="type-small text-ink-muted">
              {user.email} · {user.status}
            </span>
          </div>
          <ClientUserActions clientId={clientId} user={user} />
        </li>
      ))}
    </ul>
  );
}
