import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { leadSchema } from "@/lib/validations/lead";
import { notifyNewLead } from "@/server/notifications";
import { deleteLead, submitLead } from "./leads";

const { requireRole, revalidatePath, deletedRows } = vi.hoisted(() => ({
  requireRole: vi.fn(),
  revalidatePath: vi.fn(),
  deletedRows: vi.fn(),
}));

// work scheduled with after() runs right away here
vi.mock("next/server", () => ({ after: (task: () => unknown) => task() }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/auth/current-user", () => ({ requireRole }));
vi.mock("@/lib/auth/origin", () => ({ requestOrigin: async () => "https://sdglabs.test" }));
vi.mock("@/server/notifications", () => ({ notifyNewLead: vi.fn() }));
// the admin's session client: delete().eq().select() answers what row level security let go
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: () => ({ delete: () => ({ eq: () => ({ select: deletedRows }) }) }),
  }),
}));

afterEach(() => vi.restoreAllMocks());

describe("leadSchema", () => {
  it("normalizes the checkbox group", () => {
    const base = { name: "Maria", email: "maria@empresa.com.br", consent: true };
    expect(leadSchema.parse({ ...base, types: false }).types).toEqual([]);
    expect(leadSchema.parse({ ...base, types: "app" }).types).toEqual(["app"]);
    expect(leadSchema.parse({ ...base, types: ["site", "app"] }).types).toEqual(["site", "app"]);
  });

  it("rejects project types outside the list", () => {
    const result = leadSchema.safeParse({
      name: "Maria",
      email: "maria@empresa.com.br",
      types: ["x"],
      consent: true,
    });
    expect(result.success).toBe(false);
  });
});

describe("submitLead", () => {
  it("returns the prototype's messages for missing name and invalid e-mail", async () => {
    const result = await submitLead({ name: " ", email: "maria@", types: [], consent: false });
    expect(result).toEqual({
      ok: false,
      fieldErrors: {
        name: "Escreva seu nome.",
        email: "Use um e-mail válido, como voce@empresa.com.br.",
        consent: "Para enviar, aceite a Política de Privacidade.",
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
      consent: true,
    });
    expect(result).toEqual({ ok: true });
    // the partners hear about it
    expect(notifyNewLead).toHaveBeenCalledWith({
      lead: expect.objectContaining({ name: "Maria", email: "maria@empresa.com.br" }),
      origin: "https://sdglabs.test",
    });
    const logged = JSON.stringify(info.mock.calls);
    expect(logged).not.toContain("maria@empresa.com.br");
    expect(logged).not.toContain("Maria");
  });
});

describe("deleteLead", () => {
  const id = "55555555-5555-4555-8555-555555555555";

  beforeEach(() => {
    requireRole.mockReset();
    revalidatePath.mockReset();
    deletedRows.mockReset();
  });

  it("is for admins only", async () => {
    requireRole.mockRejectedValue(new Error("redirect /painel"));
    await expect(deleteLead({ id })).rejects.toThrow("redirect /painel");
    expect(requireRole).toHaveBeenCalledWith("admin");
    expect(deletedRows).not.toHaveBeenCalled();
  });

  it("erases the lead and refreshes the lists", async () => {
    deletedRows.mockResolvedValue({ data: [{ id }], error: null });
    expect(await deleteLead({ id })).toEqual({ ok: true, message: "Lead excluído." });
    expect(revalidatePath).toHaveBeenCalledWith("/admin/leads");
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
  });

  it("checks the id before touching the database", async () => {
    expect(await deleteLead({ id: "x" })).toEqual({
      ok: false,
      formError: "Esse lead não existe mais.",
    });
    expect(deletedRows).not.toHaveBeenCalled();
  });

  it("does not report success when nothing was deleted", async () => {
    deletedRows.mockResolvedValue({ data: [], error: null });
    expect(await deleteLead({ id })).toEqual({
      ok: false,
      formError: "Esse lead não existe mais.",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("tells the admin when the database fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    deletedRows.mockResolvedValue({ data: null, error: { code: "57014" } });
    expect(await deleteLead({ id })).toEqual({
      ok: false,
      formError: "Não conseguimos excluir. Tente de novo.",
    });
  });
});
