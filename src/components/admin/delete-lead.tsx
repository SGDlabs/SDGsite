"use client";

import { ConfirmButton } from "@/components/ui/confirm-button";
import { deleteLead } from "@/server/actions/leads";

/** Erases a lead and its contact details, after asking: a sender's request under the LGPD. */
export function DeleteLead({ id, leadName }: { id: string; leadName: string }) {
  return (
    <ConfirmButton
      variant="ghost"
      size="sm"
      title={`Excluir o lead de ${leadName}?`}
      description="Nome, contato e mensagem saem do banco. Não dá para desfazer."
      confirmLabel="Excluir"
      action={() => deleteLead({ id })}
    >
      Excluir
    </ConfirmButton>
  );
}
