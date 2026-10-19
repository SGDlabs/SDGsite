import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const TONES = {
  default: { text: "text-ink-muted", mark: "bg-accent" },
  brand: { text: "text-on-brand", mark: "bg-on-brand" },
  inverse: { text: "text-ink-inverse", mark: "bg-ink-inverse" },
};

interface EyebrowProps {
  children: ReactNode;
  /** The surface it sits on: default, brand (indigo block) or inverse. */
  tone?: keyof typeof TONES;
  className?: string;
}

/** Pixel label above a heading ("LAB 01 · SERVIÇOS"), led by one 8px pixel of the flask. */
export function Eyebrow({ children, tone = "default", className }: EyebrowProps) {
  return (
    <p className={cn("flex items-center gap-2 type-eyebrow", TONES[tone].text, className)}>
      <span aria-hidden="true" className={cn("size-2 shrink-0", TONES[tone].mark)} />
      {children}
    </p>
  );
}
