"use client";

import { useEffect, useRef } from "react";
import { Logo } from "@/components/layout/logo";

const PLAYED_KEY = "sdg-logo-played";

function currentTheme(): "light" | "dark" {
  const forced = document.documentElement.dataset.theme;
  if (forced === "light" || forced === "dark") return forced;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function playedThisVisit() {
  try {
    return sessionStorage.getItem(PLAYED_KEY) === "1";
  } catch {
    return false;
  }
}

function markPlayed() {
  try {
    sessionStorage.setItem(PLAYED_KEY, "1");
  } catch {
    // without sessionStorage the animation simply plays again on the next load
  }
}

/**
 * The brand's entrance animation. Plays once per visit when it scrolls into view; later in the
 * same visit (and with prefers-reduced-motion) it shows the final frame straight away.
 */
export function HeroLogo() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let cleanup = () => {};

    import("@/lib/brand/sdg-logo").then(({ default: SDGLogo }) => {
      if (cancelled) return;

      // The player has no destroy(): every mount gets a fresh canvas, removed on cleanup.
      const canvas = document.createElement("canvas");
      canvas.className = "absolute inset-0 size-full";
      host.appendChild(canvas);
      const player = SDGLogo.mount(canvas, { theme: currentTheme(), background: false });

      let visibility: IntersectionObserver | null = null;
      if (playedThisVisit()) {
        player.drawAt(SDGLogo.T_END + 1000);
      } else {
        visibility = new IntersectionObserver(
          (entries) => {
            if (!entries.some((entry) => entry.isIntersecting)) return;
            visibility?.disconnect();
            player.play();
            markPlayed();
          },
          { threshold: 0.5 },
        );
        visibility.observe(canvas);
      }

      const syncTheme = () => player.setTheme(currentTheme());
      const scheme = matchMedia("(prefers-color-scheme: dark)");
      scheme.addEventListener("change", syncTheme);
      const forcedTheme = new MutationObserver(syncTheme);
      forcedTheme.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });

      cleanup = () => {
        visibility?.disconnect();
        scheme.removeEventListener("change", syncTheme);
        forcedTheme.disconnect();
        canvas.remove();
      };
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return (
    // 82:31 is the engine's stage (VW:VH)
    <div
      ref={hostRef}
      role="img"
      aria-label="Logo SDG Labs: o frasco tomba, o líquido vaza e forma o nome SDG LABS"
      className="relative aspect-[82/31] w-full"
    >
      <noscript>
        <Logo variant="horizontal" alt="" className="h-auto w-full" />
      </noscript>
    </div>
  );
}
