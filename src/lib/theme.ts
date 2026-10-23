// The color theme someone picked in the user menu, kept in this browser (localStorage: a
// preference, not a cookie). "system" follows the device; tokens.css reads data-theme on <html>.

export const THEME_KEY = "sdg-theme";

export const THEMES = ["system", "light", "dark"] as const;
export type ThemeChoice = (typeof THEMES)[number];

/**
 * Runs while the HTML is parsed, before the first paint (root layout), so a page never shows the
 * other theme for a moment. Storage may be blocked (private mode): then the device decides.
 */
export const THEME_BOOT = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

// this page's latest choice, which also covers a browser that blocks storage
let chosen: ThemeChoice | undefined;
const listeners = new Set<() => void>();

/** For useSyncExternalStore: calls back whenever applyTheme changes the choice. */
export function subscribeTheme(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/** The current choice, read in the browser (the server always renders "system"). */
export function readTheme(): ThemeChoice {
  if (chosen) return chosen;
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

/** Applies a choice to the page right away and remembers it for the next visits. */
export function applyTheme(choice: ThemeChoice) {
  chosen = choice;
  const root = document.documentElement;
  if (choice === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", choice);
  try {
    if (choice === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, choice);
  } catch {
    // storage blocked: the choice lasts until the page is closed
  }
  listeners.forEach((listener) => listener());
}
