import { createClient } from "@supabase/supabase-js";

/** CI's Supabase job exports these from `supabase status`; the main job runs without a database. */
export const withSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";

/** Supabase with the service role, to set up test users the way the admin would. */
export function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

/** A fresh address per test, so tests running side by side never share a mailbox. */
export function testEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@e2e.local`;
}

interface MailpitSearch {
  messages?: { ID: string }[];
}

/**
 * The link to `path` in the latest e-mail sent to `to`, from the local mailbox (Mailpit), as a
 * path on the site under test: the templates use Supabase's site_url, port 3000.
 */
export async function linkFromEmail(to: string, path: string, timeout = 20_000): Promise<string> {
  const pattern = new RegExp(`href="([^"]*${path}\\?token_hash=[^"]+)"`);
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const search = await fetch(
      `${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`,
    );
    const { messages = [] } = (await search.json()) as MailpitSearch;
    if (messages[0]) {
      const message = (await (
        await fetch(`${MAILPIT_URL}/api/v1/message/${messages[0].ID}`)
      ).json()) as {
        HTML: string;
      };
      const href = message.HTML.match(pattern)?.[1];
      if (href) {
        const url = new URL(href.replaceAll("&amp;", "&"));
        return `${url.pathname}${url.search}`;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`no e-mail with a ${path} link reached ${to}`);
}
