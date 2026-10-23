import { afterEach, describe, expect, it, vi } from "vitest";

// The session client and requireRole are replaced; what is under test is what the action saves
// and how it answers.

const requireRole = vi.fn();
const revalidatePath = vi.fn();
const updateUser = vi.fn();

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/auth/current-user", () => ({ requireRole }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { updateUser } }),
}));

const { updateMyName } = await import("./account");

afterEach(() => {
  vi.resetAllMocks();
});

describe("updateMyName", () => {
  it("is for signed-in clients", async () => {
    requireRole.mockRejectedValue(new Error("redirect /login"));
    await expect(updateMyName({ name: "Ana Pereira" })).rejects.toThrow("redirect /login");
    expect(requireRole).toHaveBeenCalledWith("client");
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("saves the trimmed name where the profile reads it, and refreshes the area", async () => {
    updateUser.mockResolvedValue({ data: {}, error: null });
    expect(await updateMyName({ name: "  Ana Pereira " })).toEqual({
      ok: true,
      message: "Nome salvo.",
    });
    expect(updateUser).toHaveBeenCalledWith({ data: { full_name: "Ana Pereira" } });
    expect(revalidatePath).toHaveBeenCalledWith("/painel", "layout");
  });

  it("asks for a name", async () => {
    expect(await updateMyName({ name: "   " })).toEqual({
      ok: false,
      fieldErrors: { name: "Escreva seu nome." },
    });
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("tells the client when Supabase does not save", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    updateUser.mockResolvedValue({
      data: null,
      error: { status: 500, code: "unexpected_failure" },
    });
    expect(await updateMyName({ name: "Ana Pereira" })).toEqual({
      ok: false,
      formError: "Não conseguimos salvar. Tente de novo.",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
