import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const STYLES = {
  display: { tag: "h1", className: "type-display" },
  h1: { tag: "h1", className: "type-h1" },
  h2: { tag: "h2", className: "type-h2" },
  h3: { tag: "h3", className: "type-h3" },
} as const;

type Level = keyof typeof STYLES;

interface HeadingProps extends ComponentProps<"h2"> {
  /** Visual style from the design system. */
  level?: Level;
  /** Document outline tag, when it differs from the style's default. */
  as?: "h1" | "h2" | "h3" | "h4";
}

/** Space Grotesk headings in the design system scale; sentence case, never all caps. */
export function Heading({ level = "h2", as, className, ...props }: HeadingProps) {
  const style = STYLES[level];
  const Tag = as ?? style.tag;
  return <Tag className={cn(style.className, className)} {...props} />;
}
