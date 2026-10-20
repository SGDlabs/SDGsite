import { afterEach, describe, expect, it, vi } from "vitest";
import { leadSchema } from "@/lib/validations/lead";
import { submitLead } from "./leads";

afterEach(() => vi.restoreAllMocks());

describe("leadSchema", () => {
  it("normalizes the checkbox group", () => {
    const base = { name: "Maria", email: "maria@empresa.com.br" };
    expect(leadSchema.parse({ ...base, types: false }).types).toEqual([]);
    expect(leadSchema.parse({ ...base, types: "app" }).types).toEqual(["app"]);
    expect(leadSchema.parse({ ...base, types: ["site", "app"] }).types).toEqual(["site", "app"]);
  });

  it("rejects project types outside the list", () => {
    const result = leadSchema.safeParse({
      name: "Maria",
      email: "maria@empresa.com.br",
      types: ["x"],
    });
    expect(result.success).toBe(false);
  });
});

describe("submitLead", () => {
  it("returns the prototype's messages for missing name and invalid e-mail", async () => {
    const result = await submitLead({ name: " ", email: "maria@", types: [] });
    expect(result).toEqual({
      ok: false,
      fieldErrors: {
        name: "Escreva seu nome.",
        email: "Use um e-mail válido, como voce@empresa.com.br.",
      },
    });
  });

  it("accepts a valid lead and logs it without contact details", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const result = await submitLead({
      name: "Maria",
      email: "maria@empresa.com.br",
      company: "",
      types: ["site"],
      message: "Um site novo",
    });
    expect(result).toEqual({ ok: true });
    const logged = JSON.stringify(info.mock.calls);
    expect(logged).not.toContain("maria@empresa.com.br");
    expect(logged).not.toContain("Maria");
  });
});
