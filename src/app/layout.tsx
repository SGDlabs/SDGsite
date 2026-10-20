import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Silkscreen, Space_Grotesk } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

// Each --nf-* variable feeds the matching --font-* token in src/styles/tokens.css.
const display = Space_Grotesk({ variable: "--nf-display", subsets: ["latin"] });
const sans = IBM_Plex_Sans({ variable: "--nf-sans", subsets: ["latin"] });
const pixel = Silkscreen({ variable: "--nf-pixel", subsets: ["latin"], weight: ["400", "700"] });
const mono = IBM_Plex_Mono({ variable: "--nf-mono", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: {
    default: `${site.name} — ${site.slogan}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  openGraph: {
    title: site.name,
    description: site.description,
    locale: "pt_BR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#353535" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The landing's boot script adds classes to <html> before hydration (see (marketing)/layout.tsx).
    <html
      lang="pt-BR"
      className={`${display.variable} ${sans.variable} ${pixel.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
