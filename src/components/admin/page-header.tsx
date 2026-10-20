import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/eyebrow";

/** Title of an admin page, with an optional action on the right ("Novo cliente"…). */
export function PageHeader({
  eyebrow = "Admin",
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-2">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="type-h1">{title}</h1>
        {description && <p className="type-body text-ink-muted">{description}</p>}
      </div>
      {action}
    </header>
  );
}

/** A titled block inside an admin page. */
export function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-md border border-border bg-surface-alt p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="type-h3">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Shapes of a list while it loads. */
export function ListSkeleton({ rows = 4, label }: { rows?: number; label: string }) {
  return (
    <div role="status" aria-label={label} className="flex flex-col gap-2">
      {Array.from({ length: rows }, (_, i) => (
        <span key={i} aria-hidden="true" className="h-11 rounded-sm bg-surface-alt" />
      ))}
    </div>
  );
}
