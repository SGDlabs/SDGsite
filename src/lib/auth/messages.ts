// What the sign-in pages say. None of them reveals whether an e-mail has an account.

export const AUTH_MESSAGES = {
  /** the design system's own example */
  signInFailed: "Não conseguimos entrar com esses dados. Confira o e-mail e a senha.",
  tooManyAttempts: "Muitas tentativas seguidas. Espere alguns minutos e tente de novo.",
  unavailable: "Não conseguimos falar com o servidor agora. Tente de novo em alguns minutos.",
  notConfigured: "O acesso ainda não está disponível neste ambiente.",
  resetSent:
    "Se esse e-mail tiver acesso, a gente enviou um link para criar uma nova senha. Confira a caixa de entrada e o spam.",
  resetLinkInvalid: "Esse link para criar uma nova senha expirou ou já foi usado. Peça outro.",
  inviteInvalid: "Esse convite expirou ou já foi usado. Fale com a gente para receber um novo.",
  linkInvalid: "Esse link expirou ou já foi usado. Entre com seu e-mail e senha.",
  passwordNotSaved: "Não conseguimos salvar a senha. Tente de novo.",
  samePassword: "Escolha uma senha diferente da atual.",
  weakPassword: "Escolha uma senha mais difícil de adivinhar.",
} as const;

/** Values of ?erro= that the callback sends to the sign-in pages. */
export const LINK_ERRORS = {
  link: AUTH_MESSAGES.linkInvalid,
  convite: AUTH_MESSAGES.inviteInvalid,
  senha: AUTH_MESSAGES.resetLinkInvalid,
} as const;

export type LinkError = keyof typeof LINK_ERRORS;

/** A failed call to Supabase Auth, as the user should read it. */
export function authFailure(
  error: { status?: number; code?: string } | null | undefined,
  fallback: string,
) {
  if (!error) return fallback;
  if (error.status === 429 || error.code?.startsWith("over_")) return AUTH_MESSAGES.tooManyAttempts;
  // no status: the request never reached Supabase
  if (!error.status || error.status >= 500) return AUTH_MESSAGES.unavailable;
  return fallback;
}
