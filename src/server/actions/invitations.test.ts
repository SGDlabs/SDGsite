import { afterEach, describe, expect, it, vi } from "vitest";

// The service role client and requireRole are replaced; what is under test is the order of the
// calls and what the admin reads.

const requireRole = vi.fn();
const adminAuth = {
  inviteUserByEmail: vi.fn(),
  updateUserById: vi.fn(),
  deleteUser: vi.fn(),
};
const clientRow = vi.fn();

vi.mock("@/lib/auth/current-user", () => ({ requireRole }));
vi.mock("@/lib/auth/origin", () => ({ requestOrigin: async () => "https://sdglabs.test" }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    auth: { admin: adminAuth },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: clientRow }) }) }),
  }),
}));

const { inviteClientUser } = await import("./invitations");

const input = {
  clientId: "11111111-1111-4111-8111-111111111111",
  email: "maria@empresa.com.br",
  name: "Maria Souza",
};

afterEach(() => {
  vi.resetAllMocks();
});

describe("inviteClientUser", () => {
  it("is for admins only", async () => {
    requireRole.mockRejectedValue(new Error("redirect /painel"));
    await expect(inviteClientUser(input)).rejects.toThrow("redirect /painel");
    expect(requireRole).toHaveBeenCalledWith("admin");
    expect(adminAuth.inviteUserByEmail).not.toHaveBeenCalled();
  });

  it("invites, then gives the role and the company through app_metadata", async () => {
    clientRow.mockResolvedValue({ data: { id: input.clientId } });
    adminAuth.inviteUserByEmail.mockResolvedValue({ data: { user: { id: "new" } }, error: null });
    adminAuth.updateUserById.mockResolvedValue({ data: {}, error: null });

    expect(await inviteClientUser(input)).toEqual({
      ok: true,
      message: "Convite enviado para maria@empresa.com.br.",
    });
    expect(adminAuth.inviteUserByEmail).toHaveBeenCalledWith("maria@empresa.com.br", {
      data: { full_name: "Maria Souza" },
      redirectTo: "https://sdglabs.test/auth/callback?next=/convite",
    });
    expect(adminAuth.updateUserById).toHaveBeenCalledWith("new", {
      app_metadata: { role: "client", client_id: input.clientId },
    });
  });

  it("tells the admin when the e-mail already has access", async () => {
    clientRow.mockResolvedValue({ data: { id: input.clientId } });
    adminAuth.inviteUserByEmail.mockResolvedValue({
      data: { user: null },
      error: { status: 422, code: "email_exists" },
    });
    expect(await inviteClientUser(input)).toEqual({
      ok: false,
      fieldErrors: { email: "Esse e-mail já tem acesso." },
    });
  });

  it("does not invite to a company that does not exist", async () => {
    clientRow.mockResolvedValue({ data: null });
    expect(await inviteClientUser(input)).toEqual({
      ok: false,
      fieldErrors: { clientId: "Essa empresa não existe mais." },
    });
    expect(adminAuth.inviteUserByEmail).not.toHaveBeenCalled();
  });

  it("undoes the invitation when the role cannot be set", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    clientRow.mockResolvedValue({ data: { id: input.clientId } });
    adminAuth.inviteUserByEmail.mockResolvedValue({ data: { user: { id: "new" } }, error: null });
    adminAuth.updateUserById.mockResolvedValue({ data: null, error: { status: 500 } });

    const result = await inviteClientUser(input);
    expect(result.ok).toBe(false);
    expect(adminAuth.deleteUser).toHaveBeenCalledWith("new");
  });

  it("validates the input", async () => {
    const result = await inviteClientUser({ clientId: "x", email: "maria@", name: "" });
    expect(result).toEqual({
      ok: false,
      fieldErrors: {
        clientId: "Escolha a empresa.",
        email: "Use um e-mail válido, como voce@empresa.com.br.",
        name: "Escreva seu nome.",
      },
    });
  });
});
