"use client";

import { useId, useRef, useState, type ComponentProps } from "react";
import type { FormResult } from "@/lib/validations/form-result";
import { Button } from "./button";
import { Notice } from "./notice";

interface ConfirmButtonProps {
  children: string;
  /** the question in the dialog */
  title: string;
  description?: string;
  confirmLabel: string;
  action: () => Promise<FormResult>;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
}

/**
 * A button for actions that are hard to undo: asks first in a modal (native <dialog>, Escape
 * cancels), then runs the action and shows its answer below the button.
 */
export function ConfirmButton({
  children,
  title,
  description,
  confirmLabel,
  action,
  variant = "primary",
  size,
}: ConfirmButtonProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  // plain state, not a transition: actions revalidate the page, and the button must come back
  // when the action answers, not when the refreshed page has finished rendering
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<FormResult | null>(null);
  const titleId = useId();

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        variant={variant}
        size={size}
        disabled={pending}
        onClick={() => {
          setResult(null);
          dialog.current?.showModal();
        }}
      >
        {pending ? "Aguarde…" : children}
      </Button>
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-md border border-border-strong bg-surface p-6 text-ink shadow-pixel backdrop:bg-grafite/60"
      >
        <h2 id={titleId} className="type-h3">
          {title}
        </h2>
        {description && <p className="mt-2 text-ink-muted">{description}</p>}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button variant="outline" onClick={() => dialog.current?.close()} autoFocus>
            Cancelar
          </Button>
          <Button
            onClick={async () => {
              dialog.current?.close();
              setPending(true);
              setResult(
                await action().catch(() => ({
                  ok: false as const,
                  formError: "Não conseguimos concluir. Tente de novo.",
                })),
              );
              setPending(false);
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </dialog>
      {result && !result.ok && result.formError && <Notice tone="alert">{result.formError}</Notice>}
      {result?.ok && result.message && <Notice>{result.message}</Notice>}
    </div>
  );
}
