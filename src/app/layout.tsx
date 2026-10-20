import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Silkscreen, Space_Grotesk } from "next/font/google";
import { site, siteUrl } from "@/lib/site";
import "./globals.css";

// Each --nf-* variable feeds the matching --font-* token in src/styles/tokens.css. They are not
// preloaded: this layout wraps every page, and the landing (most visits) uses its own fonts, so
// preloading these would compete with the landing's first paint. They load when a page uses them
// (font-display: swap).
const display = Space_Grotesk({ variable: "--nf-display", subsets: ["latin"], preload: false });
const sans = IBM_Plex_Sans({ variable: "--nf-sans", subsets: ["latin"], preload: false });
const pixel = Silkscreen({
  variable: "--nf-pixel",
  subsets: ["latin"],
  weight: ["400", "700"],
  preload: false,
});
const mono = IBM_Plex_Mono({
  variable: "--nf-mono",
  subsets: ["latin"],
  weight: "400",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: siteUrl,
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
      <body>
        {children}
        {/* Vercel's cookieless analytics: only where Vercel serves the site (no 404s elsewhere) */}
        {process.env.VERCEL && (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        )}
      </body>
    </html>
  );
}
