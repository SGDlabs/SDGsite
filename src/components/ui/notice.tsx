import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * A message about the whole form or page: a failure (role="alert" interrupts the screen reader)
 * or a confirmation (role="status" waits its turn). Same look for both; the text carries the meaning.
 */
export function Notice({
  tone = "status",
  className,
  children,
  ...props
}: ComponentProps<"div"> & { tone?: "status" | "alert" }) {
  return (
    <div
      role={tone}
      data-slot="notice"
      className={cn(
        "flex items-start gap-3 rounded-sm border border-border-strong bg-surface p-3 type-small text-ink",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn("mt-2 size-2 shrink-0", tone === "alert" ? "bg-ink" : "bg-accent")}
      />
      <div>{children}</div>
    </div>
  );
}
