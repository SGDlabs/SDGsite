import type { EmailOtpType, User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import type { LinkError } from "@/lib/auth/messages";
import { homeFor, roleFromClaims, safeNext } from "@/lib/auth/roles";
import { supabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

const OTP_TYPES = new Set<string>([
  "invite",
  "recovery",
  "magiclink",
  "signup",
  "email",
  "email_change",
]);

/** The page each kind of link continues on. */
const PAGE_FOR_TYPE: Record<string, string> = {
  invite: "/convite",
  recovery: "/redefinir-senha",
};

/**
 * Where links from Supabase's default e-mail templates land: `?code=` (PKCE) is exchanged for a
 * session, `?token_hash=&type=` is verified. Then on to `?next=` (or the page for that kind of
 * link) or the user's area. Our own templates link straight to /convite and /redefinir-senha,
 * which only spend the token when the form is sent.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const type = params.get("type") ?? "";
  const next = safeNext(params.get("next")) ?? PAGE_FOR_TYPE[type] ?? null;

  let user: User | null = null;
  if (supabaseConfig) {
    const supabase = await createClient();
    const tokenHash = params.get("token_hash");
    const code = params.get("code");
    if (tokenHash && OTP_TYPES.has(type)) {
      const { data } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as EmailOtpType,
      });
      user = data.user;
    } else if (code) {
      const { data } = await supabase.auth.exchangeCodeForSession(code);
      user = data.user;
    }
  }

  if (!user) {
    const error: LinkError =
      next === "/convite" ? "convite" : next === "/redefinir-senha" ? "senha" : "link";
    redirect(error === "senha" ? "/recuperar-senha?erro=senha" : `/login?erro=${error}`);
  }
  redirect(next ?? homeFor(roleFromClaims(user)));
}
