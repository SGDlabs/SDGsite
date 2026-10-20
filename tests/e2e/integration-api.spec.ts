import { readFileSync } from "node:fs";
import { expect, test, type APIRequestContext } from "@playwright/test";
import { generateToken, hashToken } from "../../src/lib/integration/tokens";
import { adminClient, SEED, signedInClient, signInAs, withSupabase } from "./support/supabase";

test.skip(!withSupabase, "needs the local Supabase (CI's Supabase job)");
// the API is the same on every screen
test.skip(({ isMobile }) => isMobile, "desktop only");

const ENDPOINT = "/api/integrations/updates";
const PNG = readFileSync("public/portfolio/projeto-site/galeria-1.png");

const cleanup: (() => PromiseLike<unknown>)[] = [];
test.afterEach(async () => {
  for (const undo of cleanup.splice(0).reverse()) await undo();
});

/** A project of the seed client with a token, as the admin would set it up. */
async function projectWithToken({ revoked = false } = {}) {
  const admin = await signedInClient("admin@sdglabs.local");
  const { data: project, error } = await admin.rpc("create_project_with_stages", {
    p_client_id: SEED.client,
    p_name: `Integração ${Date.now()}`,
    p_type: "site",
  });
  if (error) throw error;
  const service = adminClient();
  cleanup.push(async () => {
    const { data: folders } = await service.storage.from("project-media").list(project.id);
    for (const folder of folders ?? []) {
      const { data: files } = await service.storage
        .from("project-media")
        .list(`${project.id}/${folder.name}`);
      await service.storage
        .from("project-media")
        .remove((files ?? []).map((file) => `${project.id}/${folder.name}/${file.name}`));
    }
    await service.from("projects").delete().eq("id", project.id);
  });
  const token = generateToken();
  await service.from("project_tokens").insert({
    project_id: project.id,
    label: "Teste",
    token_hash: hashToken(token),
    revoked_at: revoked ? new Date().toISOString() : null,
  });
  return { project, token };
}

const post = (request: APIRequestContext, token: string | null, body: object | FormData) =>
  request.post(ENDPOINT, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    ...(body instanceof FormData ? { multipart: body } : { data: body }),
  });

test("a deploy posts prints that the client sees, with the token made in the admin", async ({
  page,
  browser,
  request,
}) => {
  const { project } = await projectWithToken();
  await signInAs(page, "admin@sdglabs.local", `/admin/projetos/${project.id}`);
  await page.getByRole("button", { name: "Gerar token" }).click();
  const token = (await page.locator("code").filter({ hasText: /^sdg_/ }).textContent())!;
  expect(token).toMatch(/^sdg_/);

  const form = new FormData();
  form.append("kind", "deploy");
  form.append("title", "Deploy: nova home");
  form.append("body", "Preview: https://preview.exemplo.com.br");
  form.append("files", new Blob([PNG], { type: "image/png" }), "Home desktop.png");
  form.append("files", new Blob([PNG], { type: "image/png" }), "Home mobile.png");
  const response = await post(request, token, form);
  expect(response.status()).toBe(201);
  expect(await response.json()).toMatchObject({
    project_id: project.id,
    kind: "deploy",
    title: "Deploy: nova home",
    media: 2,
  });

  // the client's page has it, with the prints (the client, in a browser of their own)
  const client = await (await browser.newContext()).newPage();
  await signInAs(client, "cliente@exemplo.local", `/painel/projetos/${project.id}`);
  await expect(client.getByRole("heading", { name: "Deploy: nova home" })).toBeVisible();
  await expect(
    client.getByRole("button", { name: "Ampliar: Deploy: nova home, imagem 2 de 2" }),
  ).toBeVisible();
  await client.context().close();

  // and the admin sees when the token was last used
  await page.reload();
  await expect(page.getByRole("list", { name: "Tokens" })).toContainText("último uso em");
});

test("a JSON note goes to the stage asked for, as an API post", async ({ request }) => {
  const { project, token } = await projectWithToken();
  const response = await post(request, token, { kind: "nota", title: "Testes passaram", stage: 2 });
  expect(response.status()).toBe(201);
  const { id } = await response.json();

  const { data } = await adminClient()
    .from("project_updates")
    .select("source, author_id, project_stages (position)")
    .eq("id", id)
    .single();
  expect(data).toEqual({ source: "api", author_id: null, project_stages: { position: 2 } });
  const { data: tokens } = await adminClient()
    .from("project_tokens")
    .select("last_used_at")
    .eq("project_id", project.id);
  expect(tokens?.[0]?.last_used_at).not.toBeNull();
});

test("a missing, unknown or revoked token is refused", async ({ request }) => {
  const { token: revoked } = await projectWithToken({ revoked: true });
  const note = { kind: "nota", title: "Oi" };

  const missing = await post(request, null, note);
  expect(missing.status()).toBe(401);
  expect((await missing.json()).error.code).toBe("missing_token");

  const unknown = await post(request, generateToken(), note);
  expect(unknown.status()).toBe(401);
  expect((await unknown.json()).error.code).toBe("invalid_token");

  const refused = await post(request, revoked, note);
  expect(refused.status()).toBe(401);
  expect((await refused.json()).error.code).toBe("revoked_token");
});

test("files too large, of the wrong type, or a milestone are refused, and nothing is posted", async ({
  request,
}) => {
  const { project, token } = await projectWithToken();

  const big = new FormData();
  big.append("kind", "print");
  big.append("title", "Grande");
  big.append("files", new Blob([Buffer.alloc(5 * 1024 * 1024)], { type: "image/png" }), "big.png");
  const tooLarge = await post(request, token, big);
  expect(tooLarge.status()).toBe(413);
  expect((await tooLarge.json()).error.code).toBe("payload_too_large");

  const text = new FormData();
  text.append("kind", "nota");
  text.append("title", "Log");
  text.append("files", new Blob(["ok"], { type: "text/plain" }), "log.txt");
  const wrongType = await post(request, token, text);
  expect(wrongType.status()).toBe(415);

  const milestone = await post(request, token, { kind: "marco", title: "Etapa concluída" });
  expect(milestone.status()).toBe(400);
  expect((await milestone.json()).error.code).toBe("invalid_request");

  const { count } = await adminClient()
    .from("project_updates")
    .select("id", { count: "exact", head: true })
    .eq("project_id", project.id);
  expect(count).toBe(0);
});
