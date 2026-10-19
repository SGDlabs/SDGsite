import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildTokensCss } from "./build-tokens.mjs";

const fixture = {
  name: "Fixture",
  color: {
    themes: [{ id: "light" }, { id: "dark" }],
    tokens: [
      { name: "white", value: "#FFFFFF" },
      { name: "surface", value: { light: "{white}", dark: "#111111" } },
      { name: "focus", value: "{surface}" },
      { name: "same", value: { light: "#222222", dark: "#222222" } },
    ],
  },
  radius: { tokens: [{ name: "radius-md", value: "8px" }] },
  shadow: {
    tokens: [
      { name: "shadow-pixel", value: { light: "4px 4px 0 0 #000", dark: "4px 4px 0 0 #fff" } },
    ],
  },
  type: {
    families: { sans: '"Plex", system-ui, sans-serif' },
    groups: [
      {
        family: "sans",
        styles: [{ name: "body", fontSize: "16px", lineHeight: "24px", fontWeight: 400 }],
      },
    ],
  },
};

const css = buildTokensCss(fixture);
const blockAfter = (selector: string) => {
  const start = css.indexOf(selector);
  return css.slice(start, css.indexOf("}", start));
};

describe("buildTokensCss", () => {
  it("turns aliases into CSS variables", () => {
    expect(blockAfter(":root {")).toContain("--surface: var(--white);");
    expect(blockAfter(":root {")).toContain("--focus: var(--surface);");
  });

  it("overrides only the values that change in the dark theme", () => {
    const dark = blockAfter(':root[data-theme="dark"]');
    expect(dark).toContain("--surface: #111111;");
    expect(dark).toContain("--shadow-pixel: 4px 4px 0 0 #fff;");
    expect(dark).not.toContain("--same");
    expect(css).toContain(
      '@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"])',
    );
  });

  it("maps colors, radii and fonts into the Tailwind theme without the default palette", () => {
    const theme = blockAfter("@theme inline");
    expect(theme).toContain("--color-*: initial;");
    expect(theme).toContain("--color-surface: var(--surface);");
    expect(theme).toContain("--radius-md: 8px;");
    expect(theme).toContain('--font-sans: var(--nf-sans, "Plex"), system-ui, sans-serif;');
  });

  it("emits utilities for shadows and type styles", () => {
    expect(css).toContain("@utility shadow-pixel {\n  box-shadow: var(--shadow-pixel);\n}");
    expect(css).toContain("@utility type-body {\n  font-family: var(--font-sans);");
  });
});

describe("src/styles/tokens.css", () => {
  it("is up to date with src/styles/tokens.json (run `pnpm tokens`)", () => {
    const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
    const tokens = JSON.parse(read("../src/styles/tokens.json"));
    expect(read("../src/styles/tokens.css")).toBe(buildTokensCss(tokens));
  });
});
