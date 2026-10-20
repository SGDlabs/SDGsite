import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminGuard } from "@/components/admin/admin-guard";
import { ClientForm } from "@/components/admin/client-form";
import { PageHeader, Panel } from "@/components/admin/page-header";

export const metadata: Metadata = { title: "Novo cliente", robots: { index: false } };

// The blank form is static; the guard and saveClient check the role at request time.
export default function NewClientPage() {
  return (
    <>
      <Suspense fallback={null}>
        <AdminGuard />
      </Suspense>
      <Link href="/admin/clientes" className="self-start type-label">
        ← Clientes
      </Link>
      <PageHeader
        title="Novo cliente"
        description="Depois de criar, você convida as pessoas da empresa e abre os projetos."
      />
      <Panel title="Dados da empresa">
        <ClientForm />
      </Panel>
    </>
  );
}
