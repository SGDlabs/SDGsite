// Builds src/styles/tokens.css from src/styles/tokens.json, a copy of the SDG Labs design system
// tokens. Run with `pnpm tokens` (dev and build run it first).
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const SOURCE = new URL("../src/styles/tokens.json", import.meta.url);
const TARGET = new URL("../src/styles/tokens.css", import.meta.url);
const NON_FAMILIES = new Set(["name", "version", "meta", "type"]);

/** "{petroleo}" → "var(--petroleo)" */
const toCss = (value) => String(value).replace(/\{([^}]+)\}/g, "var(--$1)");

const block = (selector, lines, indent = "") =>
  `${indent}${selector} {\n${lines.map((line) => `${indent}  ${line}`).join("\n")}\n${indent}}`;

/**
 * @param {any} tokens the design system's tokens.json
 * @returns {string} tokens.css: raw variables per theme, the Tailwind theme mapping and type utilities
 */
export function buildTokensCss(tokens) {
  const [baseTheme, ...otherThemes] = tokens.color.themes.map((theme) => theme.id);
  const base = [];
  const themed = Object.fromEntries(otherThemes.map((id) => [id, []]));
  const theme = ["--color-*: initial;"];
  const utilities = [];

  for (const [family, group] of Object.entries(tokens)) {
    if (NON_FAMILIES.has(family) || !Array.isArray(group?.tokens)) continue;
    for (const { name, value } of group.tokens) {
      if (value && typeof value === "object") {
        base.push(`--${name}: ${toCss(value[baseTheme])};`);
        for (const id of otherThemes) {
          if (value[id] !== undefined && value[id] !== value[baseTheme]) {
            themed[id].push(`--${name}: ${toCss(value[id])};`);
          }
        }
      } else {
        base.push(`--${name}: ${toCss(value)};`);
      }

      if (family === "color") theme.push(`--color-${name}: var(--${name});`);
      // Radius values never change per theme, so Tailwind gets the literal value.
      if (family === "radius") theme.push(`--${name}: ${toCss(value)};`);
      if (family === "shadow")
        utilities.push(`@utility ${name} {\n  box-shadow: var(--${name});\n}`);
    }
  }

  // The first family in each stack is loaded by next/font, which exposes it as --nf-<key>.
  for (const [key, stack] of Object.entries(tokens.type.families)) {
    const [first, ...rest] = stack.split(",").map((part) => part.trim());
    const fontStack = `var(--nf-${key}, ${first}), ${rest.join(", ")}`;
    base.push(`--font-${key}: ${fontStack};`);
    theme.push(`--font-${key}: ${fontStack};`);
  }

  for (const group of tokens.type.groups) {
    for (const style of group.styles) {
      const lines = [
        `font-family: var(--font-${group.family});`,
        `font-size: ${style.fontSize};`,
        `line-height: ${style.lineHeight};`,
        `font-weight: ${style.fontWeight};`,
      ];
      if (style.letterSpacing) lines.push(`letter-spacing: ${style.letterSpacing};`);
      utilities.push(block(`@utility type-${style.name}`, lines));
    }
  }

  // Other themes follow the system preference; data-theme on <html> forces one or the other.
  const themeBlocks = otherThemes.flatMap((id) => [
    `@media (prefers-color-scheme: ${id}) {\n${block(`:root:not([data-theme="${baseTheme}"])`, themed[id], "  ")}\n}`,
    block(`:root[data-theme="${id}"]`, themed[id]),
  ]);

  return [
    `/* ${tokens.name} — generated from src/styles/tokens.json by scripts/build-tokens.mjs. Do not edit. */`,
    block(":root", base),
    ...themeBlocks,
    `/* Tailwind theme: only the brand's colors exist (the default palette is turned off). */\n${block("@theme inline", theme)}`,
    ...utilities,
    "",
  ].join("\n\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const tokens = JSON.parse(readFileSync(SOURCE, "utf8"));
  writeFileSync(TARGET, buildTokensCss(tokens));
  console.log(`tokens.css generated from ${tokens.name} tokens`);
}
