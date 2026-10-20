import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ListSkeleton, PageHeader } from "@/components/admin/page-header";
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
import { getClients } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Clientes", robots: { index: false } };

export default function ClientsPage() {
  return (
    <>
      <PageHeader
        title="Clientes"
        description="As empresas que contratam a SDG Labs e quem tem acesso à área do cliente."
        action={
          <Button asChild>
            <Link href="/admin/clientes/novo">Novo cliente</Link>
          </Button>
        }
      />
      <Suspense fallback={<ListSkeleton label="Carregando os clientes" />}>
        <ClientTable />
      </Suspense>
    </>
  );
}

async function ClientTable() {
  await requireRole("admin");
  const clients = await getClients();

  if (clients.length === 0) {
    return <p className="text-ink-muted">Nenhum cliente ainda. Comece por “Novo cliente”.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Empresa</TableHead>
          <TableHead>Contato</TableHead>
          <TableHead className="text-right">Projetos</TableHead>
          <TableHead className="text-right">Usuários</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => (
          <TableRow key={client.id}>
            <TableCell>
              <Link href={`/admin/clientes/${client.id}`} className="type-label">
                {client.name}
              </Link>
            </TableCell>
            <TableCell className="text-ink-muted">{client.contactEmail ?? "—"}</TableCell>
            <TableCell className="text-right">{client.projectCount}</TableCell>
            <TableCell className="text-right">{client.userCount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
