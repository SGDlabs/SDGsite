"use client";

import { ConfirmButton } from "@/components/ui/confirm-button";
import { removeClientUser, resendInvite } from "@/server/actions/invitations";
import type { ClientUser } from "@/server/queries/admin";

/** Next to each person on the client page: invite again while they have not accepted, or take access away. */
export function ClientUserActions({ clientId, user }: { clientId: string; user: ClientUser }) {
  const ids = { userId: user.id, clientId };
  return (
    <div className="flex flex-wrap gap-2">
      {!user.accepted && (
        <ConfirmButton
          variant="outline"
          size="sm"
          title={`Reenviar o convite para ${user.email}?`}
          description="A pessoa recebe um e-mail novo, com um link que vale por 24 horas."
          confirmLabel="Reenviar"
          action={() => resendInvite(ids)}
        >
          Reenviar convite
        </ConfirmButton>
      )}
      <ConfirmButton
        variant="ghost"
        size="sm"
        title={`Remover o acesso de ${user.name ?? user.email}?`}
        description="A pessoa deixa de ver os projetos na hora. Para dar acesso de novo, convide outra vez."
        confirmLabel="Remover acesso"
        action={() => removeClientUser(ids)}
      >
        Remover acesso
      </ConfirmButton>
    </div>
  );
}
