import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/layout/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { requireRole } from "@/lib/auth/current-user";

export const metadata: Metadata = { title: "Seus projetos", robots: { index: false } };

export default function ClientDashboardPage() {
  return (
    <main>
      <Container className="flex flex-col gap-4 py-12 md:py-16">
        <Eyebrow>Área do cliente</Eyebrow>
        <h1 className="type-h1">Seus projetos</h1>
        <Suspense fallback={<p className="type-lead text-ink-muted">Carregando…</p>}>
          <Welcome />
        </Suspense>
      </Container>
    </main>
  );
}

async function Welcome() {
  const user = await requireRole("client");
  return (
    <p className="type-lead text-ink-muted">
      Olá, {user.name}. O acompanhamento dos seus projetos, etapa por etapa, aparece aqui em breve.
    </p>
  );
}
