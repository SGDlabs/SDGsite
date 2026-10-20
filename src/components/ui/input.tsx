import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

// Fields: radius-sm, border-strong outline (3:1 against surface), body text.
const fieldClasses =
  "type-body w-full min-w-0 rounded-sm border border-border-strong bg-surface px-3 py-2.5 text-ink placeholder:text-ink-muted disabled:cursor-not-allowed disabled:opacity-50";

function Input({ className, type, ...props }: ComponentProps<"input">) {
  return (
    <input
      data-slot="input"
      type={type}
      className={cn(fieldClasses, "min-h-11", className)}
      {...props}
    />
  );
}

function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(fieldClasses, "min-h-28 resize-y", className)}
      {...props}
    />
  );
}

export { Input, Textarea, fieldClasses };
