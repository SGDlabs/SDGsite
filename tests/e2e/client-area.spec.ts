import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { adminClient, SEED, signedInClient, withSupabase } from "./support/supabase";

test.skip(!withSupabase, "needs the local Supabase (CI's Supabase job)");

async function signInAsClient(page: Page, next = "/painel") {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByRole("textbox", { name: "E-mail" }).fill("cliente@exemplo.local");
  await page.getByLabel("Senha", { exact: true }).fill(SEED.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(new RegExp(`${next.replace(/[?]/g, "\\?")}$`));
}

/** A project of its own per test (created the way the admin does), removed at the end. */
async function newProject(clientId = SEED.client) {
  const admin = await signedInClient("admin@sdglabs.local");
  const { data, error } = await admin.rpc("create_project_with_stages", {
    p_client_id: clientId,
    p_name: `Projeto de teste ${Date.now()}`,
    p_type: "site",
  });
  if (error) throw error;
  return { project: data, admin };
}

const cleanup: (() => PromiseLike<unknown>)[] = [];
test.afterEach(async () => {
  for (const undo of cleanup.splice(0).reverse()) await undo();
});

test("a client sees their projects and opens one", async ({ page }) => {
  await signInAsClient(page);
  await expect(page.getByRole("heading", { level: 1, name: "Seus projetos" })).toBeVisible();

  const card = page.getByRole("listitem").filter({ hasText: "App de agendamento" });
  await expect(card.getByText("Etapa 2 de 5 — Design")).toBeVisible();
  await expect(card.getByRole("progressbar")).toHaveAttribute(
    "aria-valuetext",
    "1 de 5 etapas concluídas",
  );
  await card.getByRole("link", { name: "App de agendamento" }).click();

  await expect(page).toHaveURL(new RegExp(`/painel/projetos/${SEED.project}$`));
  await expect(page.getByRole("heading", { level: 1, name: "App de agendamento" })).toBeVisible();
  const tracker = page.getByRole("list", { name: "Andamento do projeto" });
  await expect(tracker.locator('[aria-current="step"]')).toContainText("Design");
});

test("the stage line shows each stage's details and the feed filters", async ({ page }) => {
  await signInAsClient(page, `/painel/projetos/${SEED.project}`);

  // the current stage is open; another one opens on click
  const tracker = page.getByRole("list", { name: "Andamento do projeto" });
  await expect(page.getByText("UI/UX e protótipo.")).toBeVisible();
  await tracker.getByRole("button", { name: /Organização de ideias/ }).click();
  await expect(page.getByText("Briefing, escopo e cronograma.")).toBeVisible();
  await expect(tracker.getByRole("button", { name: /Organização de ideias/ })).toHaveAttribute(
    "aria-expanded",
    "true",
  );

  const feed = page.getByRole("list", { name: /Atualizações/ });
  await expect(feed.getByRole("article")).toHaveCount(4);
  await page.getByRole("button", { name: "Vídeo", exact: true }).click();
  await expect(feed.getByRole("article")).toHaveCount(1);
  await expect(feed.getByRole("heading", { name: "Vídeo: fluxo de agendamento" })).toBeVisible();

  await page.getByRole("button", { name: "Todos", exact: true }).click();
  await page
    .getByLabel("Etapa", { exact: true })
    .selectOption({ label: "1. Organização de ideias" });
  await expect(feed.getByRole("article")).toHaveCount(1);
  await expect(feed.getByText("Etapa concluída: Organização de ideias")).toBeVisible();

  await page.getByRole("button", { name: "Prints", exact: true }).click();
  await expect(page.getByText("Nenhuma atualização com esses filtros.")).toBeVisible();
  await page.getByRole("button", { name: "Limpar filtros" }).click();
  await expect(feed.getByRole("article")).toHaveCount(4);
});

test("prints load from private storage and open in a lightbox", async ({ page }) => {
  const { project } = await newProject();
  const service = adminClient();
  cleanup.push(() => service.from("projects").delete().eq("id", project.id));

  const { data: update, error } = await service
    .from("project_updates")
    .insert({ project_id: project.id, kind: "print", title: "Telas novas" })
    .select("id")
    .single();
  if (error) throw error;
  const path = `${project.id}/${update.id}/tela.png`;
  await service.storage
    .from("project-media")
    .upload(path, readFileSync("public/portfolio/projeto-site/galeria-1.png"), {
      contentType: "image/png",
    });
  cleanup.push(() => service.storage.from("project-media").remove([path]));
  await service
    .from("update_media")
    .insert({ update_id: update.id, storage_path: path, mime_type: "image/png" });

  await signInAsClient(page, `/painel/projetos/${project.id}`);
  const thumb = page.getByRole("button", { name: "Ampliar: Telas novas" });
  await expect(thumb).toBeVisible();
  // the signed link really serves the file
  await expect
    .poll(() => thumb.locator("img").evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);
  await thumb.click();
  const lightbox = page.getByRole("dialog", { name: "Imagem ampliada: Telas novas" });
  await expect(lightbox.getByRole("img", { name: "Telas novas" })).toBeVisible();
  await lightbox.getByRole("button", { name: "Fechar" }).click();
  await expect(lightbox).toBeHidden();
});

test("the stage moves live when the admin advances it", async ({ page }, testInfo) => {
  const { project, admin } = await newProject();
  const service = adminClient();
  cleanup.push(() => service.from("projects").delete().eq("id", project.id));
  // what Realtime said, attached to the report when the test fails
  const frames: string[] = [];
  page.on("websocket", (socket) => {
    socket.on("framesent", (frame) => frames.push(`> ${String(frame.payload).slice(0, 400)}`));
    socket.on("framereceived", (frame) => frames.push(`< ${String(frame.payload).slice(0, 400)}`));
  });
  cleanup.push(() => testInfo.attach("realtime-frames", { body: frames.join("\n") }));

  await signInAsClient(page, `/painel/projetos/${project.id}`);
  await expect(page.getByText("Etapa 1 de 5 — Organização de ideias")).toBeVisible();
  await expect(page.locator('[data-realtime="live"]')).toBeVisible({ timeout: 20_000 });
  // proves the page is never reloaded
  await page.evaluate(() => Object.assign(window, { stayed: true }));

  const { error } = await admin.rpc("advance_project_stage", { p_project_id: project.id });
  if (error) throw error;

  await expect(page.getByRole("status").filter({ hasText: "Nova atualização" })).toContainText(
    "Etapa concluída: Organização de ideias",
  );
  await expect(page.getByText("Etapa 2 de 5 — Design")).toBeVisible();
  const tracker = page.getByRole("list", { name: "Andamento do projeto" });
  await expect(tracker.locator('[aria-current="step"]')).toContainText("Design");
  expect(await page.evaluate(() => "stayed" in window)).toBe(true);
});

test("a client cannot open another company's project", async ({ page }) => {
  const service = adminClient();
  const { data: company, error } = await service
    .from("clients")
    .insert({ name: "Outra empresa" })
    .select("id")
    .single();
  if (error) throw error;
  cleanup.push(() => service.from("clients").delete().eq("id", company.id));
  const { project } = await newProject(company.id);

  await signInAsClient(page);
  await expect(page.getByText(project.name)).toHaveCount(0);
  await page.goto(`/painel/projetos/${project.id}`);
  await expect(page.getByRole("heading", { name: "Projeto não encontrado" })).toBeVisible();
});
