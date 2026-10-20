import tokens from "@/styles/tokens.json";

type Theme = "light" | "dark";
type ColorValue = string | Partial<Record<Theme, string>>;

const COLORS = new Map<string, ColorValue>(
  tokens.color.tokens.map((token) => [token.name, token.value as ColorValue]),
);
export const THEMES: Theme[] = ["light", "dark"];

/** Resolves a color token to hex for a theme, following "{alias}" references. */
export function resolveColor(name: string, theme: Theme): string {
  const value = COLORS.get(name);
  if (value === undefined) throw new Error(`unknown color token: ${name}`);
  // a token without a value for this theme inherits the first theme's
  const raw = typeof value === "string" ? value : (value[theme] ?? value.light);
  if (!raw) throw new Error(`color token ${name} has no value`);
  const alias = /^\{(.+)\}$/.exec(raw);
  return alias ? resolveColor(alias[1]!, theme) : raw;
}

function luminance(hex: string) {
  const digits = hex.replace("#", "");
  const full = digits.length === 3 ? [...digits].map((c) => c + c).join("") : digits;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const channel = parseInt(full.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

/** WCAG contrast ratio between two hex colors. */
export function contrastRatio(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

export interface ColorPair {
  fg: string;
  bg: string;
  min: number;
  note: string;
}

/** Text pairs the design system promises at 4.5:1 in both themes. */
export const TEXT_PAIRS: ColorPair[] = [
  { fg: "ink", bg: "surface", min: 4.5, note: "texto principal" },
  { fg: "ink", bg: "surface-alt", min: 4.5, note: "texto em cards e seções alternadas" },
  { fg: "ink-muted", bg: "surface", min: 4.5, note: "texto secundário" },
  { fg: "ink-muted", bg: "surface-alt", min: 4.5, note: "texto secundário em cards" },
  { fg: "accent", bg: "surface", min: 4.5, note: "links" },
  { fg: "on-accent", bg: "accent", min: 4.5, note: "botão primário" },
  { fg: "brand", bg: "surface", min: 4.5, note: "brand como texto" },
  { fg: "on-brand", bg: "brand", min: 4.5, note: "texto em blocos brand" },
  { fg: "ink-inverse", bg: "surface-inverse", min: 4.5, note: "CTA final e rodapé" },
];

/** Controls and focus need 3:1 against what surrounds them (WCAG 1.4.11). */
export const UI_PAIRS: ColorPair[] = [
  { fg: "border-strong", bg: "surface", min: 3, note: "contorno de campos" },
  { fg: "focus", bg: "surface", min: 3, note: "anel de foco" },
  { fg: "stage-todo", bg: "surface", min: 3, note: "etapas futuras" },
];

export function pairRatio(pair: ColorPair, theme: Theme) {
  return contrastRatio(resolveColor(pair.fg, theme), resolveColor(pair.bg, theme));
}
