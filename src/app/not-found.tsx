import type { Metadata } from "next";
import Link from "next/link";
import { StatusPage } from "@/components/layout/status-page";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Página não encontrada" };

/** Any address the site does not have, and every notFound() without a page of its own. */
export default function NotFound() {
  return (
    <StatusPage
      eyebrow="Erro 404"
      title="Página não encontrada"
      description="Procuramos em todas as bancadas e essa página não está aqui. Confira o endereço ou siga por um destes caminhos."
    >
      <Button asChild>
        <Link href="/">Ir para o início</Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="/portfolio">Ver portfólio</Link>
      </Button>
    </StatusPage>
  );
}
