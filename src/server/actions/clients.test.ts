import { afterEach, describe, expect, it, vi } from "vitest";

// The session client and requireRole are replaced; what is under test is the validation, the
// role check and the rows the actions write.

class Redirected extends Error {
  constructor(readonly to: string) {
    super(`redirect ${to}`);
  }
}

const requireRole = vi.fn();
const insertSingle = vi.fn();
const update = vi.fn();
const updateEq = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Redirected(to);
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/current-user", () => ({ requireRole }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: () => ({
      insert: (row: unknown) => ({ select: () => ({ single: () => insertSingle(row) }) }),
      update: (row: unknown) => {
        update(row);
        return { eq: updateEq };
      },
    }),
  }),
}));

const { saveClient } = await import("./clients");
const { updateLeadStatus } = await import("./leads");

const CLIENT_ID = "11111111-1111-4111-8111-111111111111";

afterEach(() => {
  vi.resetAllMocks();
});

describe("saveClient", () => {
  it("is for admins only", async () => {
    requireRole.mockRejectedValue(new Error("redirect /painel"));
    await expect(saveClient({ name: "Empresa" })).rejects.toThrow("redirect /painel");
    expect(requireRole).toHaveBeenCalledWith("admin");
    expect(insertSingle).not.toHaveBeenCalled();
  });

  it("validates the company", async () => {
    expect(await saveClient({ name: " ", cnpjCpf: "abc", contactEmail: "x@" })).toEqual({
      ok: false,
      fieldErrors: {
        name: "Escreva o nome da empresa.",
        cnpjCpf: "Use só números, pontos, barra e traço, como no documento.",
        contactEmail: "Use um e-mail válido, como voce@empresa.com.br.",
      },
    });
  });

  it("creates a company, with empty fields stored as null, and opens it", async () => {
    insertSingle.mockResolvedValue({ data: { id: CLIENT_ID }, error: null });
    const result = await saveClient({
      name: " Empresa ",
      cnpjCpf: "",
      contactEmail: "",
      phone: "",
    }).catch((error: unknown) => error);
    expect(result).toBeInstanceOf(Redirected);
    expect((result as Redirected).to).toBe(`/admin/clientes/${CLIENT_ID}`);
    expect(insertSingle).toHaveBeenCalledWith({
      name: "Empresa",
      cnpj_cpf: null,
      contact_email: null,
      phone: null,
    });
  });

  it("saves changes to an existing company", async () => {
    updateEq.mockResolvedValue({ error: null });
    const result = await saveClient({
      id: CLIENT_ID,
      name: "Empresa",
      cnpjCpf: "12.345.678/0001-90",
      contactEmail: "financeiro@empresa.com.br",
      phone: "(11) 99999-0000",
    });
    expect(result).toEqual({ ok: true, message: "Dados salvos." });
    expect(update).toHaveBeenCalledWith({
      name: "Empresa",
      cnpj_cpf: "12.345.678/0001-90",
      contact_email: "financeiro@empresa.com.br",
      phone: "(11) 99999-0000",
    });
    expect(updateEq).toHaveBeenCalledWith("id", CLIENT_ID);
  });
});

describe("updateLeadStatus", () => {
  it("is for admins only", async () => {
    requireRole.mockRejectedValue(new Error("redirect /painel"));
    await expect(updateLeadStatus({ id: CLIENT_ID, status: "fechado" })).rejects.toThrow();
    expect(update).not.toHaveBeenCalled();
  });

  it("accepts only the known statuses", async () => {
    const result = await updateLeadStatus({ id: CLIENT_ID, status: "ganho" as never });
    expect(result.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it("moves the lead", async () => {
    updateEq.mockResolvedValue({ error: null });
    expect(await updateLeadStatus({ id: CLIENT_ID, status: "em_contato" })).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({ status: "em_contato" });
    expect(updateEq).toHaveBeenCalledWith("id", CLIENT_ID);
  });
});
