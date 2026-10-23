import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { CenteredPage } from "./centered-page";

interface StatusPageProps {
  /** "Erro 404", "Erro" */
  eyebrow: string;
  title: string;
  description: ReactNode;
  /** the ways out: links home, a retry button */
  children: ReactNode;
}

/** A page for when there is nothing to show (an address that does not exist, an error). */
export function StatusPage({ eyebrow, title, description, children }: StatusPageProps) {
  return (
    <CenteredPage>
      <Card featured className="gap-6 md:p-8">
        <header className="flex flex-col gap-2">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="type-h2">{title}</h1>
          <p className="type-body text-ink-muted">{description}</p>
        </header>
        <div className="flex flex-wrap gap-3">{children}</div>
      </Card>
    </CenteredPage>
  );
}

/** The error page of the site, inside the root layout (error.tsx) or without it (global-error.tsx). */
export function ErrorStatus({ retry }: { retry: () => void }) {
  return (
    <StatusPage
      eyebrow="Erro"
      title="Algo deu errado"
      description="Não conseguimos mostrar esta página agora. Pode ser a conexão ou uma instabilidade do nosso lado: tente de novo em instantes."
    >
      <Button onClick={() => retry()}>Tentar de novo</Button>
      <Button asChild variant="outline">
        <Link href="/">Ir para o início</Link>
      </Button>
    </StatusPage>
  );
}
