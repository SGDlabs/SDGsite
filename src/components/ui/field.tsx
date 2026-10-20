import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Label } from "./label";

/** Props a field's control needs so the label, the hint and the error reach screen readers. */
export interface FieldControlProps {
  id: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
}

interface FieldProps {
  /**
   * Leave it out: a generated id stays unique even when Next keeps visited pages in the document
   * (hidden with <Activity>), where a fixed id like "email" would repeat and break the label.
   */
  id?: string;
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: (control: FieldControlProps) => ReactNode;
}

/**
 * Label, control, hint and error message, wired together. The design system has no error color,
 * so an invalid control gets the `ink` outline and the message says what to fix.
 */
export function Field({ id: fixedId, label, hint, error, className, children }: FieldProps) {
  const generatedId = useId();
  const id = fixedId ?? generatedId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
      })}
      {hint && (
        <p id={hintId} className="type-small text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="flex items-start gap-2 type-small text-ink">
          <span aria-hidden="true" className="mt-2 size-2 shrink-0 bg-ink" />
          {error}
        </p>
      )}
    </div>
  );
}
