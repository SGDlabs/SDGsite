"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import SDGLogo from "@/lib/brand/sdg-logo";
import { startLanding } from "./landing-script";

/** Runs the landing's scroll, canvas and pointer effects once the page has hydrated. */
export function LandingEffects() {
  useEffect(() => {
    const page = document.querySelector<HTMLElement>(".landing");
    if (!page) return;
    return startLanding(page, SDGLogo, Lenis);
  }, []);

  return null;
}
