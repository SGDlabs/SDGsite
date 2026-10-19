import Image from "next/image";
import { cn } from "@/lib/utils";

// Size of each SVG in pixel-grid cells (its viewBox). Scale only by whole numbers.
const CELLS = {
  horizontal: { width: 80, height: 26 },
  vertical: { width: 48, height: 44 },
  icon: { width: 26, height: 33 },
} as const;

interface LogoProps {
  variant: keyof typeof CELLS;
  /** Screen pixels per grid cell. */
  scale?: number;
  /** On surface-inverse the background flips, so each theme shows the other file. */
  inverse?: boolean;
  alt?: string;
  className?: string;
}

/** The SDG Labs logo from public/brand, showing the -light or -dark file for the current theme. */
export function Logo({
  variant,
  scale = 2,
  inverse = false,
  alt = "SDG Labs",
  className,
}: LogoProps) {
  const { width, height } = CELLS[variant];
  const [lightThemeFile, darkThemeFile] = inverse ? ["dark", "light"] : ["light", "dark"];
  const size = { width: width * scale, height: height * scale };

  return (
    <>
      <Image
        {...size}
        alt={alt}
        unoptimized
        src={`/brand/sdglabs-${variant}-${lightThemeFile}.svg`}
        className={cn("[image-rendering:pixelated] dark:hidden", className)}
      />
      <Image
        {...size}
        alt={alt}
        unoptimized
        src={`/brand/sdglabs-${variant}-${darkThemeFile}.svg`}
        className={cn("hidden [image-rendering:pixelated] dark:block", className)}
      />
    </>
  );
}
