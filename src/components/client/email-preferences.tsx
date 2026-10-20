"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { setEmailPreferences } from "@/server/actions/account";

/** Whether the feed's news arrives by e-mail (stage changes always do). */
export function EmailPreferences({ notifyUpdates }: { notifyUpdates: boolean }) {
  const [checked, setChecked] = useState(notifyUpdates);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof setEmailPreferences>> | null>(
    null,
  );

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setSaving(true);
        setResult(await setEmailPreferences({ notifyUpdates: checked }).catch(() => null));
        setSaving(false);
      }}
    >
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-0.5 size-5 shrink-0 accent-accent"
          checked={checked}
          onChange={(event) => setChecked(event.target.checked)}
        />
        <span className="flex flex-col gap-1">
          <span className="type-label">Receber as novidades do projeto por e-mail</span>
          <span className="type-small text-ink-muted">
            No máximo um e-mail a cada 2 horas por projeto, com tudo o que saiu. O aviso de etapa
            concluída chega sempre.
          </span>
        </span>
      </label>
      <Button type="submit" variant="outline" disabled={saving} className="self-start">
        {saving ? "Salvando…" : "Salvar preferência"}
      </Button>
      {result?.ok && <Notice>{result.message}</Notice>}
      {result && !result.ok && <Notice tone="alert">{result.formError}</Notice>}
    </form>
  );
}
