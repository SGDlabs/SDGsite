"use client";

import { useEffect } from "react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

/** The client area could not load (database or network): say so and offer to try again. */
export default function ClientAreaError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main>
      <Container className="flex flex-col items-start gap-4 py-16">
        <h1 className="type-h1">Não conseguimos carregar agora</h1>
        <p className="type-lead text-ink-muted">
          Pode ser a conexão ou uma instabilidade do nosso lado. Tente de novo em instantes.
        </p>
        <Button onClick={() => retry()}>Tentar de novo</Button>
      </Container>
    </main>
  );
}
