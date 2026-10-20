import type { ReactNode } from "react";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import "./landing.css";

// The landing's own type (from the approved prototype); Silkscreen comes from the root layout.
const display = Bricolage_Grotesque({
  variable: "--lf-display",
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
});
const body = Geist({ variable: "--lf-body", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--lf-mono", subsets: ["latin"], weight: ["400", "500"] });

// Runs while the HTML is parsed, before the first paint: the hero's word-by-word entrance and the
// pinned sections depend on these classes, and adding them after hydration would make them flash.
const BOOT = `(function(){var r=document.documentElement,m=matchMedia('(prefers-reduced-motion: reduce)').matches;r.classList.add('js');if(!m)r.classList.add('motion');r.classList.toggle('pin',!m&&innerWidth>=980&&innerHeight>=600)})()`;

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`landing ${display.variable} ${body.variable} ${mono.variable}`}>
      <script dangerouslySetInnerHTML={{ __html: BOOT }} />
      {children}
    </div>
  );
}
