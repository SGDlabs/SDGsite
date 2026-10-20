import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AUTH_MESSAGES } from "@/lib/auth/messages";

// Supabase, the session cookies and Next's redirect are replaced; what is under test is what the
// actions ask Supabase for and what they tell the user.

class Redirected extends Error {
  constructor(readonly to: string) {
    super(`redirect ${to}`);
  }
}

const auth = {
  signInWithPassword: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  verifyOtp: vi.fn(),
  getUser: vi.fn(),
  updateUser: vi.fn(),
  signOut: vi.fn(),
};

vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Redirected(to);
  },
}));
vi.mock("@/lib/env", () => ({ supabaseConfig: { url: "http://supabase.test", anonKey: "anon" } }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth }) }));
vi.mock("@/lib/auth/origin", () => ({ requestOrigin: async () => "https://sdglabs.test" }));

const { acceptInvite, requestPasswordReset, resetPassword, signIn, signOut } =
  await import("./auth");

const client = { id: "u1", app_metadata: { role: "client", client_id: "c1" } };
const admin = { id: "u2", app_metadata: { role: "admin" } };
const apiError = (status: number, code: string) => ({ status, code, message: code });

async function redirectOf(promise: Promise<unknown>) {
  const error = await promise.then(
    () => null,
    (reason: unknown) => reason,
  );
  if (!(error instanceof Redirected)) throw new Error("expected a redirect");
  return error.to;
}

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.resetAllMocks();
});

describe("signIn", () => {
  it("validates before calling Supabase", async () => {
    const result = await signIn({ email: "maria@", password: "" });
    expect(result).toEqual({
      ok: false,
      fieldErrors: {
        email: "Use um e-mail válido, como voce@empresa.com.br.",
        password: "Escreva sua senha.",
      },
    });
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it.each([
    ["wrong password", apiError(400, "invalid_credentials")],
    ["unconfirmed e-mail", apiError(400, "email_not_confirmed")],
    ["banned user", apiError(400, "user_banned")],
  ])("answers a %s like any other failure, without revealing the account", async (_, error) => {
    auth.signInWithPassword.mockResolvedValue({ data: { user: null }, error });
    expect(await signIn({ email: "maria@empresa.com.br", password: "x" })).toEqual({
      ok: false,
      formError: "Não conseguimos entrar com esses dados. Confira o e-mail e a senha.",
    });
  });

  it("asks to wait on a rate limit", async () => {
    auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: apiError(429, "over_request_rate_limit"),
    });
    expect(await signIn({ email: "maria@empresa.com.br", password: "x" })).toEqual({
      ok: false,
      formError: AUTH_MESSAGES.tooManyAttempts,
    });
  });

  it("sends each role to its area, or back to ?next= inside the site", async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { user: admin }, error: null });
    expect(await redirectOf(signIn({ email: "a@sdg.test", password: "x" }))).toBe("/admin");

    auth.signInWithPassword.mockResolvedValue({ data: { user: client }, error: null });
    expect(await redirectOf(signIn({ email: "c@sdg.test", password: "x" }))).toBe("/painel");
    expect(
      await redirectOf(signIn({ email: "c@sdg.test", password: "x", next: "/painel/projetos/1" })),
    ).toBe("/painel/projetos/1");
    expect(
      await redirectOf(signIn({ email: "c@sdg.test", password: "x", next: "//evil.com" })),
    ).toBe("/painel");
  });
});

describe("requestPasswordReset", () => {
  it("gives the same answer whether or not the e-mail has an account", async () => {
    auth.resetPasswordForEmail.mockResolvedValueOnce({ data: {}, error: null });
    const sent = await requestPasswordReset({ email: "maria@empresa.com.br" });

    auth.resetPasswordForEmail.mockResolvedValueOnce({
      data: null,
      error: apiError(429, "over_email_send_rate_limit"),
    });
    const limited = await requestPasswordReset({ email: "maria@empresa.com.br" });

    expect(sent).toEqual({ ok: true, message: AUTH_MESSAGES.resetSent });
    expect(limited).toEqual(sent);
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith("maria@empresa.com.br", {
      redirectTo: "https://sdglabs.test/auth/callback?next=/redefinir-senha",
    });
    expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toContain("maria@");
  });
});

describe("resetPassword", () => {
  const input = { password: "nova-senha-1", confirm: "nova-senha-1", tokenHash: "hash" };

  it("asks for the same password twice", async () => {
    const result = await resetPassword({ ...input, confirm: "outra" });
    expect(result).toEqual({
      ok: false,
      fieldErrors: { confirm: "As duas senhas precisam ser iguais." },
    });
  });

  it("spends the link's token, saves the password and enters the user's area", async () => {
    auth.verifyOtp.mockResolvedValue({ data: { user: client }, error: null });
    auth.updateUser.mockResolvedValue({ data: { user: client }, error: null });
    expect(await redirectOf(resetPassword(input))).toBe("/painel");
    expect(auth.verifyOtp).toHaveBeenCalledWith({ token_hash: "hash", type: "recovery" });
    expect(auth.updateUser).toHaveBeenCalledWith({ password: "nova-senha-1" });
  });

  it("says when the link has expired", async () => {
    auth.verifyOtp.mockResolvedValue({ data: { user: null }, error: apiError(403, "otp_expired") });
    expect(await resetPassword(input)).toEqual({
      ok: false,
      formError: AUTH_MESSAGES.resetLinkInvalid,
    });
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it("without a token, needs the session from the callback", async () => {
    auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect(await resetPassword({ ...input, tokenHash: undefined })).toEqual({
      ok: false,
      formError: AUTH_MESSAGES.resetLinkInvalid,
    });
  });

  it("asks for a different password when it did not change", async () => {
    auth.verifyOtp.mockResolvedValue({ data: { user: client }, error: null });
    auth.updateUser.mockResolvedValue({ data: {}, error: apiError(422, "same_password") });
    expect(await resetPassword(input)).toEqual({
      ok: false,
      fieldErrors: { password: AUTH_MESSAGES.samePassword },
    });
  });
});

describe("acceptInvite", () => {
  const input = { name: " Maria Souza ", password: "senha-boa-1", confirm: "senha-boa-1" };

  it("spends the invitation, saves name and password and opens the client area", async () => {
    auth.verifyOtp.mockResolvedValue({ data: { user: client }, error: null });
    auth.updateUser.mockResolvedValue({ data: { user: client }, error: null });
    expect(await redirectOf(acceptInvite({ ...input, tokenHash: "hash" }))).toBe("/painel");
    expect(auth.verifyOtp).toHaveBeenCalledWith({ token_hash: "hash", type: "invite" });
    expect(auth.updateUser).toHaveBeenCalledWith({
      password: "senha-boa-1",
      data: { full_name: "Maria Souza" },
    });
  });

  it("says when the invitation has expired", async () => {
    auth.verifyOtp.mockResolvedValue({ data: { user: null }, error: apiError(403, "otp_expired") });
    expect(await acceptInvite({ ...input, tokenHash: "hash" })).toEqual({
      ok: false,
      formError: AUTH_MESSAGES.inviteInvalid,
    });
  });
});

describe("signOut", () => {
  it("ends the session on this device", async () => {
    auth.signOut.mockResolvedValue({ error: null });
    await signOut();
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  });
});
