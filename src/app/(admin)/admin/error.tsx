"use client";

import { useEffect } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";

/** An admin page could not load (database or network): the sidebar stays, with a way to retry. */
export default function AdminError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <PageHeader
        eyebrow="Erro"
        title="Não conseguimos carregar agora"
        description="Pode ser a conexão ou uma instabilidade do banco. Tente de novo em instantes."
      />
      <Button onClick={() => retry()} className="self-start">
        Tentar de novo
      </Button>
    </>
  );
}
