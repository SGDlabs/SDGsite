import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const VARIANTS = {
  primary: "bg-accent text-on-accent hover:shadow-pixel",
  secondary: "border-border-strong text-ink hover:bg-surface-alt",
  // On surface-inverse (final CTA) the button turns back into the regular surface.
  inverse: "bg-surface text-ink hover:bg-surface-alt",
};

type Variant = keyof typeof VARIANTS;

export function buttonClasses(variant: Variant = "primary", className?: string) {
  return cn(
    "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-sm border border-transparent px-6 py-3 type-label no-underline transition-[box-shadow,background-color] duration-150 ease-out",
    VARIANTS[variant],
    className,
  );
}

export function ButtonLink({
  variant,
  className,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant }) {
  return <a className={buttonClasses(variant, className)} {...props} />;
}

export function Button({
  variant,
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type={type} className={buttonClasses(variant, className)} {...props} />;
}
