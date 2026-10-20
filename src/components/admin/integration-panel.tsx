"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Notice } from "@/components/ui/notice";
import type { ProjectTokenRow } from "@/server/queries/admin";
import { createProjectToken, revokeProjectToken } from "@/server/actions/integration";

/**
 * The project's integration: tokens for the client's pipeline to post to the feed. A new token
 * shows once, here; after that only its name and dates remain.
 */
export function IntegrationPanel({
  projectId,
  tokens,
}: {
  projectId: string;
  tokens: ProjectTokenRow[];
}) {
  const [label, setLabel] = useState("GitHub Actions");
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const labelId = useId();

  return (
    <div className="flex flex-col gap-6">
      <p className="text-ink-muted">
        Com um token, o repositório do cliente publica atualizações neste feed a cada deploy (prints
        e o link do preview). A API só publica: avançar etapa continua aqui no admin. O passo a
        passo está em <code className="type-code">docs/integracao.md</code>.
      </p>

      {tokens.length > 0 && (
        <ul aria-label="Tokens" className="flex flex-col divide-y divide-border">
          {tokens.map((token) => (
            <li
              key={token.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="flex flex-col gap-0.5">
                <span className="type-label">{token.label}</span>
                <span className="type-small text-ink-muted">
                  {token.revoked ? "Revogado" : "Ativo"} · criado em {token.createdAtLabel}
                  {token.lastUsedLabel
                    ? ` · último uso em ${token.lastUsedLabel}`
                    : " · nunca usado"}
                </span>
              </div>
              {!token.revoked && (
                <ConfirmButton
                  variant="ghost"
                  size="sm"
                  title={`Revogar “${token.label}”?`}
                  description="Na hora: a próxima chamada com ele já é recusada. Não dá para desfazer."
                  confirmLabel="Revogar"
                  action={() => revokeProjectToken({ id: token.id, projectId })}
                >
                  Revogar
                </ConfirmButton>
              )}
            </li>
          ))}
        </ul>
      )}

      {created ? (
        <Notice>
          <div className="flex flex-col gap-3">
            <span>
              Token criado. Guarde agora, num segredo do repositório (<code>SDG_TOKEN</code>): ele
              não aparece de novo.
            </span>
            <code className="block overflow-x-auto rounded-sm bg-surface-alt p-3 type-code break-all">
              {created}
            </code>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await navigator.clipboard.writeText(created);
                  setCopied(true);
                }}
              >
                {copied ? "Copiado" : "Copiar"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setCreated(null)}>
                Pronto, guardei
              </Button>
            </div>
          </div>
        </Notice>
      ) : (
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={async (event) => {
            event.preventDefault();
            setError(null);
            setCreating(true);
            const result = await createProjectToken({ projectId, label }).catch(() => null);
            setCreating(false);
            if (!result?.ok) {
              setError(result?.formError ?? "Não conseguimos criar o token.");
              return;
            }
            setCopied(false);
            setCreated(result.token);
          }}
        >
          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor={labelId}>Nome do token</Label>
            <Input
              id={labelId}
              value={label}
              maxLength={80}
              onChange={(event) => setLabel(event.target.value)}
            />
          </div>
          <Button type="submit" disabled={creating}>
            {creating ? "Gerando…" : "Gerar token"}
          </Button>
        </form>
      )}
      {error && <Notice tone="alert">{error}</Notice>}
    </div>
  );
}
