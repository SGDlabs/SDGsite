import type { CSSProperties } from "react";
import type SDGLogo from "@/lib/brand/sdg-logo";

/** The landing's palette: the design system colors on a deepened graphite ground. */
export const PAL = {
  ground: "#1C1F20",
  ground2: "#262A2B",
  raised: "#353535",
  teal: "#3C6E71",
  glow: "#6FA8AC",
  yale: "#284B63",
  dust: "#D9D9D9",
  white: "#FFFFFF",
};

/** Logo engine theme for the dark landing: white flask, lit teal liquid, graphite glass. */
export function registerSiteTheme(engine: typeof SDGLogo) {
  engine.THEMES.site = {
    bg: PAL.ground,
    K: PAL.white,
    H: PAL.dust,
    W: PAL.ground,
    L: PAL.glow,
    sdg: PAL.white,
    labs: PAL.glow,
    floor: PAL.yale,
  };
}

/** Icons of the client panel feed, as markup strings: the live feed builds new items from them. */
export const FEED_ICONS = {
  print:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16"/><path d="M3 16l5-5 4 4 3-3 6 6"/></svg>',
  video:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="13" height="14"/><path d="M16 10l5-3v10l-5-3"/></svg>',
  deploy:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12"/><path d="M7 8l5-5 5 5"/><path d="M4 15v6h16v-6"/></svg>',
  stage:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v12H8l-4 4z"/></svg>',
};

export type FeedIcon = keyof typeof FEED_ICONS;

/** Inline CSS custom properties, e.g. style={cssVars({ "--i": 2 })}. */
export const cssVars = (vars: Record<`--${string}`, string | number>) => vars as CSSProperties;
