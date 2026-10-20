import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

// shadcn/ui button on the SDG Labs tokens. Focus uses the global ring (2px solid `focus`,
// 2px offset), so no ring utilities here.
const buttonVariants = cva(
  "type-label inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-sm border border-transparent whitespace-nowrap no-underline transition-[box-shadow,background-color,border-color] duration-150 ease-out select-none disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        /** The action color: one per screen area. The pixel shadow is the brand's hover. */
        primary: "bg-accent text-on-accent hover:shadow-pixel",
        /** Filled, quieter: a second action next to the primary. */
        secondary: "bg-surface-alt text-ink hover:bg-border",
        /** Outlined with border-strong, which holds 3:1 against surface for controls. */
        outline: "border-border-strong bg-transparent text-ink hover:bg-surface-alt",
        ghost: "bg-transparent text-ink hover:bg-surface-alt",
        /** On surface-inverse (final CTA, footer): flips back to the regular surface. */
        inverse: "bg-surface text-ink hover:bg-surface-alt",
        link: "h-auto min-h-0 border-0 px-0 py-0 text-accent underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-11 px-6 py-3",
        sm: "min-h-9 px-4 py-2",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  type,
  ...props
}: ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      data-variant={variant ?? "primary"}
      // a <button> without a type submits forms; default to "button" unless asked otherwise
      type={asChild ? type : (type ?? "button")}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
