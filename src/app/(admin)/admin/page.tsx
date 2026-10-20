import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/layout/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { requireRole } from "@/lib/auth/current-user";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default function AdminPage() {
  return (
    <main>
      <Container className="flex flex-col gap-4 py-12 md:py-16">
        <Eyebrow>Admin</Eyebrow>
        <h1 className="type-h1">Visão geral</h1>
        <Suspense fallback={<p className="type-lead text-ink-muted">Carregando…</p>}>
          <Welcome />
        </Suspense>
      </Container>
    </main>
  );
}

async function Welcome() {
  const user = await requireRole("admin");
  return (
    <p className="type-lead text-ink-muted">
      Olá, {user.name}. Clientes, projetos, portfólio e leads chegam aqui na próxima etapa.
    </p>
  );
}
