import { runInNewContext } from "node:vm";
import { afterEach, describe, expect, it, vi } from "vitest";
import { applyTheme, readTheme, subscribeTheme, THEME_BOOT, THEME_KEY } from "./theme";

/** A <html> element and a localStorage, enough for what the theme code touches. */
function browser(stored: string | null, { blocked = false } = {}) {
  const attributes = new Map<string, string>();
  const storage = new Map<string, string>(stored === null ? [] : [[THEME_KEY, stored]]);
  const guard = () => {
    if (blocked) throw new Error("SecurityError");
  };
  return {
    attributes,
    storage,
    document: {
      documentElement: {
        setAttribute: (name: string, value: string) => attributes.set(name, value),
        removeAttribute: (name: string) => attributes.delete(name),
      },
    },
    localStorage: {
      getItem: (key: string) => (guard(), storage.get(key) ?? null),
      setItem: (key: string, value: string) => (guard(), storage.set(key, value)),
      removeItem: (key: string) => (guard(), storage.delete(key)),
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("THEME_BOOT", () => {
  it.each(["light", "dark"])("forces a stored %s theme before the first paint", (theme) => {
    const page = browser(theme);
    runInNewContext(THEME_BOOT, page);
    expect(page.attributes.get("data-theme")).toBe(theme);
  });

  it.each([null, "system", "purple"])("leaves the device's theme for %s", (stored) => {
    const page = browser(stored);
    runInNewContext(THEME_BOOT, page);
    expect(page.attributes.has("data-theme")).toBe(false);
  });

  it("does not break the page when storage is blocked", () => {
    const page = browser("dark", { blocked: true });
    expect(() => runInNewContext(THEME_BOOT, page)).not.toThrow();
    expect(page.attributes.has("data-theme")).toBe(false);
  });
});

describe("applyTheme and readTheme", () => {
  it("forces and remembers a theme, and goes back to the device's", () => {
    const page = browser(null);
    vi.stubGlobal("document", page.document);
    vi.stubGlobal("localStorage", page.localStorage);

    applyTheme("dark");
    expect(page.attributes.get("data-theme")).toBe("dark");
    expect(readTheme()).toBe("dark");

    applyTheme("system");
    expect(page.attributes.has("data-theme")).toBe(false);
    expect(page.storage.has(THEME_KEY)).toBe(false);
    expect(readTheme()).toBe("system");
  });

  it("still applies the theme, for this page, when storage is blocked", () => {
    const page = browser(null, { blocked: true });
    vi.stubGlobal("document", page.document);
    vi.stubGlobal("localStorage", page.localStorage);

    applyTheme("light");
    expect(page.attributes.get("data-theme")).toBe("light");
    expect(readTheme()).toBe("light");
  });

  it("tells the menu when the choice changes", () => {
    const page = browser(null);
    vi.stubGlobal("document", page.document);
    vi.stubGlobal("localStorage", page.localStorage);
    const listener = vi.fn();
    const unsubscribe = subscribeTheme(listener);

    applyTheme("dark");
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    applyTheme("system");
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
