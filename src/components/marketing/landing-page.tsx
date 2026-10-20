"use client";

import Lenis from "lenis";
import { useEffect, useRef, type ReactNode } from "react";
import SDGLogo from "@/lib/brand/sdg-logo";
import { startLanding } from "./landing-script";

/**
 * Wraps one page of the marketing area and runs its scroll, canvas and pointer effects inside it.
 * `display: contents` keeps the layout of the approved prototype; the wrapper only scopes the script,
 * since a page hidden by client navigation may still be in the DOM with the same ids.
 */
export function LandingPage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const page = ref.current;
    if (!page) return;
    return startLanding(page, SDGLogo, Lenis);
  }, []);

  return (
    <div ref={ref} style={{ display: "contents" }}>
      {children}
    </div>
  );
}

/** Grain overlay, custom cursor and the scroll tube: present on every marketing page. */
export function LandingChrome() {
  return (
    <>
      <div className="grain" aria-hidden="true"></div>
      <div className="cursor" id="cursor" aria-hidden="true"></div>
      <div className="tube" id="tube" aria-hidden="true">
        <i></i>
        <b></b>
      </div>
    </>
  );
}
