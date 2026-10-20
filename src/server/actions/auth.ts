"use server";

import type { AuthError, User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { AUTH_MESSAGES, authFailure } from "@/lib/auth/messages";
import { requestOrigin } from "@/lib/auth/origin";
import { homeFor, roleFromClaims, safeNext } from "@/lib/auth/roles";
import { supabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  acceptInviteSchema,
  newPasswordSchema,
  recoverPasswordSchema,
  signInSchema,
  type AcceptInviteInput,
  type NewPasswordInput,
  type RecoverPasswordInput,
  type SignInInput,
} from "@/lib/validations/auth";
import { invalid, type FormResult } from "@/lib/validations/form-result";

// Every message here is the same whether or not the e-mail has an account. Contact details are
// never logged.

const notConfigured = { ok: false, formError: AUTH_MESSAGES.notConfigured } as const;

function logFailure(step: string, error: AuthError) {
  console.warn(`[auth] ${step} failed`, { status: error.status, code: error.code });
}

/** /login: e-mail and password. Goes back to ?next= or to the user's area. */
export async function signIn(input: SignInInput): Promise<FormResult<"email" | "password">> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  if (!supabaseConfig) return notConfigured;

  const { email, password, next } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.code !== "invalid_credentials") logFailure("sign-in", error);
    return { ok: false, formError: authFailure(error, AUTH_MESSAGES.signInFailed) };
  }
  redirect(safeNext(next) ?? homeFor(roleFromClaims(data.user)));
}

/** /recuperar-senha: always answers that the link was sent. */
export async function requestPasswordReset(
  input: RecoverPasswordInput,
): Promise<FormResult<"email">> {
  const parsed = recoverPasswordSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  if (!supabaseConfig) return notConfigured;

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    // used by Supabase's default template; ours links straight to /redefinir-senha
    redirectTo: `${await requestOrigin()}/auth/callback?next=/redefinir-senha`,
  });
  // even a rate limit stays quiet: it is counted per e-mail, so it would reveal an account
  if (error) logFailure("password reset e-mail", error);
  return { ok: true, message: AUTH_MESSAGES.resetSent };
}

type PasswordField = "password" | "confirm";

/**
 * The user behind the e-mail link: spends the token when there is one (only now, on submit, so
 * link scanners that open e-mails cannot use it up), or reads the session the callback created.
 */
async function linkUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tokenHash: string | undefined,
  type: "invite" | "recovery",
): Promise<{ user: User | null; error?: AuthError }> {
  if (tokenHash) {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    return error ? { user: null, error } : { user: data.user };
  }
  const { data } = await supabase.auth.getUser();
  return { user: data.user };
}

function passwordFailure(error: AuthError): FormResult<PasswordField> {
  if (error.code === "same_password") {
    return { ok: false, fieldErrors: { password: AUTH_MESSAGES.samePassword } };
  }
  if (error.code === "weak_password") {
    return { ok: false, fieldErrors: { password: AUTH_MESSAGES.weakPassword } };
  }
  logFailure("password update", error);
  return { ok: false, formError: authFailure(error, AUTH_MESSAGES.passwordNotSaved) };
}

/** /redefinir-senha: a new password from the recovery e-mail. */
export async function resetPassword(input: NewPasswordInput): Promise<FormResult<PasswordField>> {
  const parsed = newPasswordSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  if (!supabaseConfig) return notConfigured;

  const supabase = await createClient();
  const { user, error } = await linkUser(supabase, parsed.data.tokenHash, "recovery");
  if (!user) {
    return { ok: false, formError: authFailure(error, AUTH_MESSAGES.resetLinkInvalid) };
  }
  const update = await supabase.auth.updateUser({ password: parsed.data.password });
  if (update.error) return passwordFailure(update.error);
  redirect(homeFor(roleFromClaims(user)));
}

/** /convite: the invited client confirms their name and chooses a password. */
export async function acceptInvite(
  input: AcceptInviteInput,
): Promise<FormResult<"name" | PasswordField>> {
  const parsed = acceptInviteSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  if (!supabaseConfig) return notConfigured;

  const supabase = await createClient();
  const { user, error } = await linkUser(supabase, parsed.data.tokenHash, "invite");
  if (!user) return { ok: false, formError: authFailure(error, AUTH_MESSAGES.inviteInvalid) };

  const update = await supabase.auth.updateUser({
    password: parsed.data.password,
    // profiles.full_name follows user_metadata (see the migrations)
    data: { full_name: parsed.data.name },
  });
  if (update.error) return passwordFailure(update.error);
  redirect(homeFor(roleFromClaims(user)));
}

/** User menu: ends the session on this device. */
export async function signOut() {
  if (supabaseConfig) {
    const supabase = await createClient();
    await supabase.auth.signOut({ scope: "local" });
  }
  redirect("/login");
}
