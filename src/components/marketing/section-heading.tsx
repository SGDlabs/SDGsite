import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  id: string;
  eyebrow: string;
  title: string;
  lead?: ReactNode;
  tone?: "default" | "brand" | "inverse";
  className?: string;
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  lead,
  tone = "default",
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("mb-8 flex max-w-160 flex-col gap-3", className)}>
      <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
      <h2 id={id} className="type-h2">
        {title}
      </h2>
      {lead && <p className={cn("type-lead", tone === "default" && "text-ink-muted")}>{lead}</p>}
    </div>
  );
}
