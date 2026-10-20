import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

// Status seals (the design system's pixel-tag): Silkscreen, uppercase, square corners, space-2 padding.
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1 rounded-none border border-transparent px-2 py-1 whitespace-nowrap [&>svg]:size-3",
  {
    variants: {
      variant: {
        accent: "bg-accent text-on-accent",
        brand: "bg-brand text-on-brand",
        outline: "border-border-strong text-ink",
        muted: "bg-surface-alt text-ink-muted",
      },
      size: {
        /** pixel-tag: status seals and stage numbers */
        default: "type-pixel-tag",
        /** eyebrow size, for dense lists and table cells */
        sm: "type-eyebrow",
      },
    },
    defaultVariants: {
      variant: "accent",
      size: "default",
    },
  },
);

function Badge({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";
  return (
    <Comp
      data-slot="badge"
      data-variant={variant ?? "accent"}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

/** The design system calls status seals "pixel tags"; same component. */
const PixelTag = Badge;

export { Badge, PixelTag, badgeVariants };
