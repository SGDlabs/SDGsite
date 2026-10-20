import { expect, test } from "@playwright/test";
import { adminClient, SEED, signedInClient, signInAs, withSupabase } from "./support/supabase";

test.skip(!withSupabase, "needs the local Supabase (CI's Supabase job)");
test.skip(({ isMobile }) => isMobile, "desktop only");

test("a client silences the feed's e-mails in their account", async ({ page }) => {
  const service = adminClient();
  const clientUser = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
  try {
    await signInAs(page, "cliente@exemplo.local", "/painel");
    await page.getByRole("button", { name: "Conta de Cliente Exemplo" }).click();
    await page.getByRole("menuitem", { name: "Sua conta" }).click();
    await expect(page).toHaveURL(/\/painel\/conta$/);

    const box = page.getByRole("checkbox", { name: /Receber as novidades do projeto/ });
    await expect(box).toBeChecked();
    await box.uncheck();
    await page.getByRole("button", { name: "Salvar preferência" }).click();
    await expect(page.getByText("as novidades ficam só na área do cliente")).toBeVisible();

    const { data } = await service
      .from("profiles")
      .select("notify_updates")
      .eq("id", clientUser)
      .single();
    expect(data?.notify_updates).toBe(false);
  } finally {
    await service.from("profiles").update({ notify_updates: true }).eq("id", clientUser);
  }
});

test("the hourly digest round is protected and sends what is pending", async ({ request }) => {
  const secret = process.env.CRON_SECRET;
  test.skip(!secret, "CRON_SECRET is set in CI's Supabase job");

  expect((await request.get("/api/cron/digest")).status()).toBe(401);

  // a project with news and no digest yet
  const admin = await signedInClient("admin@sdglabs.local");
  const { data: project, error } = await admin.rpc("create_project_with_stages", {
    p_client_id: SEED.client,
    p_name: `Resumo ${Date.now()}`,
    p_type: "site",
  });
  if (error) throw error;
  const service = adminClient();
  try {
    await service
      .from("project_updates")
      .insert({ project_id: project.id, kind: "nota", title: "Oi" });

    const response = await request.get("/api/cron/digest", {
      headers: { Authorization: `Bearer ${secret}` },
    });
    expect(response.status()).toBe(200);
    expect((await response.json()).sent).toBeGreaterThanOrEqual(1);
    const { data } = await service
      .from("projects")
      .select("digest_sent_at")
      .eq("id", project.id)
      .single();
    expect(data?.digest_sent_at).not.toBeNull();

    // right after, nothing is due for it
    const again = await request.get("/api/cron/digest", {
      headers: { Authorization: `Bearer ${secret}` },
    });
    const { data: same } = await service
      .from("projects")
      .select("digest_sent_at")
      .eq("id", project.id)
      .single();
    expect(again.status()).toBe(200);
    expect(same?.digest_sent_at).toBe(data?.digest_sent_at);
  } finally {
    await service.from("projects").delete().eq("id", project.id);
  }
});
