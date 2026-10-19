import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const TONES = {
  default: "",
  alt: "bg-surface-alt",
  // accent and ink-muted lack contrast on surface-inverse, so text and focus use ink-inverse here.
  inverse: "bg-surface-inverse text-ink-inverse [--focus:var(--ink-inverse)]",
};

interface SectionProps extends HTMLAttributes<HTMLElement> {
  tone?: keyof typeof TONES;
}

/** A landing page band: 64px of vertical space on phones, space-24 (96px) on desktop. */
export function Section({ tone = "default", className, ...props }: SectionProps) {
  return <section className={cn("py-16 lg:py-24", TONES[tone], className)} {...props} />;
}
