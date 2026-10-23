import { expect, type Page } from "@playwright/test";
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

/** Supabase as a visitor in the browser would see it: the public URL and anon key. */
export function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/** Seed data (supabase/seed.sql). */
export const SEED = {
  password: "sdglabs-local",
  client: "11111111-1111-4111-8111-111111111111",
  project: "22222222-2222-4222-8222-222222222222",
};

/** Supabase signed in as that user, to act the way they would (row level security applies). */
export async function signedInClient(email: string, password = SEED.password) {
  const client = anonClient();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return client;
}

/** Signs in through /login and waits until the page that asked for it (`next`) is open. */
export async function signInAs(page: Page, email: string, next: string) {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByRole("textbox", { name: "E-mail" }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(SEED.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL((url) => `${url.pathname}${url.search}` === next);
}

/** A fresh address per test, so tests running side by side never share a mailbox. */
export function testEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@e2e.local`;
}

interface MailpitSearch {
  messages?: { ID: string }[];
}

/** The e-mails sent to `to` in the local mailbox (Mailpit), newest first. */
async function mailTo(to: string) {
  const search = await fetch(
    `${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`,
  );
  const { messages = [] } = (await search.json()) as MailpitSearch;
  return messages;
}

/** How many e-mails reached `to`, to tell a resent e-mail from the first one. */
export async function emailCount(to: string) {
  return (await mailTo(to)).length;
}

/**
 * The link to `path` in the latest e-mail sent to `to`, from the local mailbox (Mailpit), as a
 * path on the site under test: the templates use Supabase's site_url, port 3000.
 */
export async function linkFromEmail(to: string, path: string, timeout = 20_000): Promise<string> {
  const pattern = new RegExp(`href="([^"]*${path}\\?token_hash=[^"]+)"`);
  const deadline = Date.now() + timeout;
  let seen = "nothing";
  while (Date.now() < deadline) {
    const messages = await mailTo(to);
    if (messages[0]) {
      const message = (await (
        await fetch(`${MAILPIT_URL}/api/v1/message/${messages[0].ID}`)
      ).json()) as { Subject: string; HTML: string };
      const href = message.HTML.match(pattern)?.[1];
      if (href) {
        const url = new URL(href.replaceAll("&amp;", "&"));
        return `${url.pathname}${url.search}`;
      }
      seen = `"${message.Subject}": ${message.HTML.replace(/\s+/g, " ").slice(0, 600)}`;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`no e-mail with a ${path} link reached ${to}; latest: ${seen}`);
}
