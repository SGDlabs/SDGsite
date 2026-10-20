import { expect, test, type Page } from "@playwright/test";
import { adminClient, SEED, signedInClient, signInAs, withSupabase } from "./support/supabase";

test.skip(!withSupabase, "needs the local Supabase (CI's Supabase job)");

const signInAsAdmin = (page: Page, next: string) => signInAs(page, "admin@sdglabs.local", next);

const cleanup: (() => PromiseLike<unknown>)[] = [];
test.afterEach(async () => {
  for (const undo of cleanup.splice(0).reverse()) await undo();
});

/** A project of the seed client, created through the API the way the form does, removed after. */
async function newProject() {
  const admin = await signedInClient("admin@sdglabs.local");
  const { data, error } = await admin.rpc("create_project_with_stages", {
    p_client_id: SEED.client,
    p_name: `Projeto ${Date.now()}`,
    p_type: "app",
  });
  if (error) throw error;
  const service = adminClient();
  cleanup.push(async () => {
    const { data: folders } = await service.storage.from("project-media").list(data.id);
    for (const folder of folders ?? []) {
      const { data: files } = await service.storage
        .from("project-media")
        .list(`${data.id}/${folder.name}`);
      await service.storage
        .from("project-media")
        .remove((files ?? []).map((file) => `${data.id}/${folder.name}/${file.name}`));
    }
    await service.from("projects").delete().eq("id", data.id);
  });
  return data;
}

test("an admin creates a project and advances its stage", async ({ page }) => {
  const name = `Site novo ${Date.now()}`;
  await signInAsAdmin(page, "/admin/projetos/novo");
  await page.getByRole("button", { name: "Criar projeto" }).click();
  await expect(page.getByText("Escolha o cliente.")).toBeVisible();

  await page.getByLabel("Cliente", { exact: true }).selectOption({ label: "Cliente Exemplo" });
  await page.getByRole("textbox", { name: "Nome do projeto" }).fill(name);
  await page.getByLabel("Tipo", { exact: true }).selectOption("site");
  await page.getByLabel("Previsão de entrega").fill("2026-12-18");
  await page.getByRole("button", { name: "Criar projeto" }).click();

  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
  const projectId = page.url().split("/").pop()!;
  cleanup.push(() => adminClient().from("projects").delete().eq("id", projectId));
  const tracker = page.getByRole("list", { name: "Andamento do projeto" });
  await expect(tracker.locator('[aria-current="step"]')).toContainText("Organização de ideias");

  // asks first; cancelling changes nothing
  await page.getByRole("button", { name: "Concluir etapa e avançar" }).click();
  const confirm = page.getByRole("dialog", { name: "Concluir “Organização de ideias” e avançar?" });
  await expect(confirm).toBeVisible();
  await confirm.getByRole("button", { name: "Cancelar" }).click();
  await expect(tracker.locator('[aria-current="step"]')).toContainText("Organização de ideias");

  await page.getByRole("button", { name: "Concluir etapa e avançar" }).click();
  await confirm.getByRole("button", { name: "Concluir e avançar" }).click();
  await expect(page.getByText("Etapa atual: Design.")).toBeVisible();
  await expect(tracker.locator('[aria-current="step"]')).toContainText("Design");

  const { data } = await adminClient()
    .from("projects")
    .select("current_stage_position, due_at")
    .eq("id", projectId)
    .single();
  expect(data?.current_stage_position).toBe(2);
  expect(data?.due_at).toMatch(/^2026-12-18T15:00:00/);
});

test("an admin edits a stage and the project's dates", async ({ page }) => {
  const project = await newProject();
  await signInAsAdmin(page, `/admin/projetos/${project.id}`);

  await page.getByText("Editar nomes e descrições das etapas").click();
  const stage = page.getByRole("form", { name: "Etapa 2" });
  await stage.getByRole("textbox", { name: "Descrição da etapa 2" }).fill("Telas no Figma.");
  await stage.getByRole("button", { name: "Salvar etapa" }).click();
  await expect(stage.getByText("Etapa salva.")).toBeVisible();

  await page.getByLabel("Início").fill("2026-10-01");
  await page.getByRole("button", { name: "Salvar projeto" }).click();
  await expect(page.getByText("Projeto salvo.")).toBeVisible();

  const service = adminClient();
  const { data: stages } = await service
    .from("project_stages")
    .select("description")
    .eq("project_id", project.id)
    .eq("position", 2)
    .single();
  expect(stages?.description).toBe("Telas no Figma.");
});

test("an admin posts prints that the client sees, then takes them down", async ({
  page,
  browser,
}) => {
  const project = await newProject();
  await signInAsAdmin(page, `/admin/projetos/${project.id}`);

  await page.getByRole("textbox", { name: "Título" }).fill("Telas novas");
  await page
    .getByLabel("Prints e vídeos")
    .setInputFiles([
      "public/portfolio/projeto-site/galeria-1.png",
      "public/portfolio/projeto-site/galeria-2.png",
    ]);
  await expect(
    page.getByRole("list", { name: "Arquivos escolhidos" }).getByRole("listitem"),
  ).toHaveCount(2);
  // a post with images becomes "Prints" on its own
  await expect(page.getByLabel("Tipo", { exact: true })).toHaveValue("print");
  await page.getByRole("button", { name: "Publicar atualização" }).click();
  await expect(page.getByText("Atualização publicada.")).toBeVisible();
  await expect(page.getByText("2 arquivos")).toBeVisible();

  // the client, in a browser of their own
  const client = await (await browser.newContext()).newPage();
  await signInAs(client, "cliente@exemplo.local", `/painel/projetos/${project.id}`);
  const thumb = client.getByRole("button", { name: "Ampliar: Telas novas, imagem 2 de 2" });
  await expect(thumb).toBeVisible();
  await expect
    .poll(() => thumb.locator("img").evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);
  await client.context().close();

  await page.getByRole("button", { name: "Excluir" }).first().click();
  await page
    .getByRole("dialog", { name: "Excluir “Telas novas”?" })
    .getByRole("button", { name: "Excluir" })
    .click();
  await expect(page.getByText("2 arquivos")).toHaveCount(0);
  // the files went with it (Storage has no empty folders)
  const { data: folders } = await adminClient().storage.from("project-media").list(project.id);
  expect(folders ?? []).toHaveLength(0);
});

test("an admin pauses and resumes a project", async ({ page }) => {
  const project = await newProject();
  await signInAsAdmin(page, `/admin/projetos/${project.id}`);
  await page.getByRole("button", { name: "Pausar projeto" }).click();
  await page
    .getByRole("dialog", { name: "Pausar o projeto?" })
    .getByRole("button", { name: "Pausar" })
    .click();
  await expect(page.getByRole("button", { name: "Retomar projeto" })).toBeVisible();
  await page.getByRole("button", { name: "Retomar projeto" }).click();
  await page
    .getByRole("dialog", { name: "Retomar o projeto?" })
    .getByRole("button", { name: "Retomar" })
    .click();
  await expect(page.getByRole("button", { name: "Pausar projeto" })).toBeVisible();
});
