"use client";

import { ConfirmButton } from "@/components/ui/confirm-button";
import { deletePortfolioItem } from "@/server/actions/portfolio";

/** Removes a case and its images, after asking. */
export function DeletePortfolioItem({ id, title }: { id: string; title: string }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-ink-muted">
        O caso sai do site e as imagens são apagadas. Para tirar do ar sem perder nada, desmarque
        “Publicado no site”.
      </p>
      <ConfirmButton
        variant="outline"
        title={`Excluir “${title}”?`}
        description="Não dá para desfazer."
        confirmLabel="Excluir"
        action={() => deletePortfolioItem({ id })}
      >
        Excluir caso
      </ConfirmButton>
    </div>
  );
}
