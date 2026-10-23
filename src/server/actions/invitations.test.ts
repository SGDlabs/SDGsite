import { afterEach, describe, expect, it, vi } from "vitest";

// The service role client and requireRole are replaced; what is under test is the order of the
// calls and what the admin reads.

const requireRole = vi.fn();
const revalidatePath = vi.fn();
const adminAuth = {
  inviteUserByEmail: vi.fn(),
  updateUserById: vi.fn(),
  deleteUser: vi.fn(),
  getUserById: vi.fn(),
};
const clientRow = vi.fn();
const profileRow = vi.fn();

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/auth/current-user", () => ({ requireRole }));
vi.mock("@/lib/auth/origin", () => ({ requestOrigin: async () => "https://sdglabs.test" }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    auth: { admin: adminAuth },
    from: (table: string) => ({
      select: () => ({
        eq: () => ({ maybeSingle: table === "profiles" ? profileRow : clientRow }),
      }),
    }),
  }),
}));

const { inviteClientUser, removeClientUser, resendInvite } = await import("./invitations");

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
    expect(revalidatePath).toHaveBeenCalledWith(`/admin/clientes/${input.clientId}`);
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

const access = {
  userId: "33333333-3333-4333-8333-333333333333",
  clientId: input.clientId,
};
const pending = {
  id: access.userId,
  email: "maria@empresa.com.br",
  email_confirmed_at: null as string | null,
  user_metadata: { full_name: "Maria Souza" },
};
const accepted = { ...pending, email_confirmed_at: "2026-10-20T12:00:00Z" };

/** The person is a client user of `access.clientId`, with that Auth user. */
function personOfThisClient(user: typeof pending) {
  profileRow.mockResolvedValue({
    data: { id: access.userId, role: "client", client_id: access.clientId },
  });
  adminAuth.getUserById.mockResolvedValue({ data: { user }, error: null });
}

const notThisClient = [
  ["another company", { role: "client", client_id: "44444444-4444-4444-8444-444444444444" }],
  ["the admins", { role: "admin", client_id: null }],
] as const;

describe("resendInvite", () => {
  it("is for admins only", async () => {
    requireRole.mockRejectedValue(new Error("redirect /painel"));
    await expect(resendInvite(access)).rejects.toThrow("redirect /painel");
    expect(requireRole).toHaveBeenCalledWith("admin");
    expect(adminAuth.inviteUserByEmail).not.toHaveBeenCalled();
  });

  it("sends the invitation again to someone who has not accepted it", async () => {
    personOfThisClient(pending);
    adminAuth.inviteUserByEmail.mockResolvedValue({ data: { user: pending }, error: null });

    expect(await resendInvite(access)).toEqual({
      ok: true,
      message: "Convite reenviado para maria@empresa.com.br.",
    });
    expect(adminAuth.inviteUserByEmail).toHaveBeenCalledWith("maria@empresa.com.br", {
      data: { full_name: "Maria Souza" },
      redirectTo: "https://sdglabs.test/auth/callback?next=/convite",
    });
    expect(revalidatePath).toHaveBeenCalledWith(`/admin/clientes/${access.clientId}`);
  });

  it("does not invite someone who has already accepted", async () => {
    personOfThisClient(accepted);
    expect(await resendInvite(access)).toEqual({
      ok: false,
      formError: "Essa pessoa já aceitou o convite.",
    });
    expect(adminAuth.inviteUserByEmail).not.toHaveBeenCalled();
  });

  it.each(notThisClient)("does not invite someone from %s", async (_, profile) => {
    profileRow.mockResolvedValue({ data: { id: access.userId, ...profile } });
    expect(await resendInvite(access)).toEqual({
      ok: false,
      formError: "Essa pessoa não é deste cliente.",
    });
    expect(adminAuth.getUserById).not.toHaveBeenCalled();
    expect(adminAuth.inviteUserByEmail).not.toHaveBeenCalled();
  });

  it("tells the admin when the e-mail could not go out", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    personOfThisClient(pending);
    adminAuth.inviteUserByEmail.mockResolvedValue({
      data: { user: null },
      error: { status: 429, code: "over_email_send_rate_limit" },
    });
    expect(await resendInvite(access)).toEqual({
      ok: false,
      formError: "Não conseguimos reenviar o convite. Tente de novo.",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("removeClientUser", () => {
  it("is for admins only", async () => {
    requireRole.mockRejectedValue(new Error("redirect /painel"));
    await expect(removeClientUser(access)).rejects.toThrow("redirect /painel");
    expect(requireRole).toHaveBeenCalledWith("admin");
    expect(adminAuth.deleteUser).not.toHaveBeenCalled();
  });

  it("deletes the person's Auth user, which takes the profile with it", async () => {
    personOfThisClient(accepted);
    adminAuth.deleteUser.mockResolvedValue({ data: {}, error: null });

    expect(await removeClientUser(access)).toEqual({ ok: true, message: "Acesso removido." });
    expect(adminAuth.deleteUser).toHaveBeenCalledWith(access.userId);
    expect(revalidatePath).toHaveBeenCalledWith(`/admin/clientes/${access.clientId}`);
  });

  it.each(notThisClient)("never removes someone from %s", async (_, profile) => {
    profileRow.mockResolvedValue({ data: { id: access.userId, ...profile } });
    expect(await removeClientUser(access)).toEqual({
      ok: false,
      formError: "Essa pessoa não é deste cliente.",
    });
    expect(adminAuth.deleteUser).not.toHaveBeenCalled();
  });

  it("checks the ids before reading anything", async () => {
    expect(await removeClientUser({ userId: "x", clientId: access.clientId })).toEqual({
      ok: false,
      formError: "Essa pessoa não é deste cliente.",
    });
    expect(profileRow).not.toHaveBeenCalled();
    expect(adminAuth.deleteUser).not.toHaveBeenCalled();
  });

  it("tells the admin when Supabase does not delete", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    personOfThisClient(accepted);
    adminAuth.deleteUser.mockResolvedValue({ data: null, error: { status: 500 } });
    expect(await removeClientUser(access)).toEqual({
      ok: false,
      formError: "Não conseguimos remover o acesso. Tente de novo.",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
