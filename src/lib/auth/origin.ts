import "server-only";
import { headers } from "next/headers";
import { publicEnv } from "@/lib/env";

/**
 * This site's origin for links that Supabase Auth puts in e-mails. Server Actions always carry an
 * Origin header (Next checks it against the host); Supabase only accepts redirect URLs from the
 * allow list in its settings, so a forged header cannot send the link elsewhere.
 */
export async function requestOrigin() {
  const list = await headers();
  const origin = list.get("origin");
  if (origin) return origin;
  const host = list.get("x-forwarded-host") ?? list.get("host");
  if (host) return `${list.get("x-forwarded-proto") ?? "https"}://${host}`;
  return publicEnv.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
