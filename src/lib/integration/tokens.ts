import { createHash, randomBytes } from "node:crypto";

/** Prefix that makes a leaked token easy to recognize (and to search for in a repository). */
const PREFIX = "sdg_";

/** A new integration token: shown once to the admin, never stored. */
export function generateToken() {
  return `${PREFIX}${randomBytes(32).toString("base64url")}`;
}

/** What project_tokens keeps: the SHA-256 of the token, in hex. */
export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/** The token from "Authorization: Bearer sdg_…", or null. */
export function bearerToken(header: string | null) {
  const match = /^Bearer\s+(\S+)\s*$/i.exec(header ?? "");
  const token = match?.[1];
  return token?.startsWith(PREFIX) && token.length <= 200 ? token : null;
}
