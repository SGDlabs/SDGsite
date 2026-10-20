import { describe, expect, it } from "vitest";
import { safeFileName, slugify } from "./slug";

describe("slugify", () => {
  it("keeps lowercase ASCII words joined by hyphens", () => {
    expect(slugify("App de Agendamento — Versão 2")).toBe("app-de-agendamento-versao-2");
    expect(slugify("  --Ação!!  ")).toBe("acao");
    expect(slugify("a".repeat(100), 10)).toBe("aaaaaaaaaa");
  });
});

describe("safeFileName", () => {
  it("keeps a readable name and a clean extension", () => {
    expect(safeFileName("Tela Inicial (1).PNG")).toBe("tela-inicial-1.png");
    expect(safeFileName(".env")).toBe("env");
    expect(safeFileName("???.jpg")).toBe("arquivo.jpg");
  });
});
