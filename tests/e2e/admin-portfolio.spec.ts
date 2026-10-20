import { expect, test } from "@playwright/test";
import { adminClient, signInAs, withSupabase } from "./support/supabase";

test.skip(!withSupabase, "needs the local Supabase (CI's Supabase job)");
// one after the other: both read and change the same list
test.describe.configure({ mode: "serial" });

test("an admin publishes a case that shows on the site, then takes it down", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "one browser is enough for the uploads");
  const title = `Caso de teste ${Date.now()}`;
  const slug = title.toLowerCase().replaceAll(" ", "-");

  await signInAs(page, "admin@sdglabs.local", "/admin/portfolio/novo");
  await page.getByRole("textbox", { name: "Título" }).fill(title);
  // the address follows the title
  await expect(page.getByRole("textbox", { name: "Endereço" })).toHaveValue(slug);
  await page.getByRole("textbox", { name: "Resumo" }).fill("Um app de agendamento.");
  await page.getByRole("textbox", { name: "Texto" }).fill("O desafio.\n\nO resultado.");
  await page.getByLabel("Categoria").selectOption("app");
  await page.getByRole("textbox", { name: "Stack" }).fill("Next.js, Supabase");

  await page.getByLabel("Imagem da capa").setInputFiles("public/portfolio/projeto-app/cover.png");
  await expect(page.getByLabel("Trocar a capa")).toBeVisible();
  await page.getByRole("textbox", { name: "Descrição da capa" }).fill("Tela inicial do app");
  await page
    .getByLabel("Adicionar imagens")
    .setInputFiles([
      "public/portfolio/projeto-app/galeria-1.png",
      "public/portfolio/projeto-app/galeria-2.png",
    ]);
  await page.getByRole("textbox", { name: "Descrição da imagem 1" }).fill("Agenda");
  await page.getByRole("textbox", { name: "Descrição da imagem 2" }).fill("Confirmação");
  await page.getByLabel("Publicado no site").check();
  await page.getByRole("button", { name: "Criar caso" }).click();

  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  const id = page.url().split("/").pop()!;
  const service = adminClient();
  test.info().attach("case", { body: id });

  try {
    // on the site, with the uploaded images served from the public bucket
    await page.goto(`/portfolio/${slug}`);
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page.getByText("O resultado.")).toBeVisible();
    const cover = page.getByRole("img", { name: "Tela inicial do app" });
    await expect
      .poll(() => cover.evaluate((img: HTMLImageElement) => img.naturalWidth))
      .toBeGreaterThan(0);
    await expect(page.getByRole("button", { name: "Ampliar: Confirmação" })).toBeVisible();

    // unpublished from the list, it leaves the site
    await page.goto("/admin/portfolio");
    await page.getByRole("checkbox", { name: `${title} publicado` }).uncheck();
    await expect(page.getByRole("checkbox", { name: `${title} publicado` })).toBeEnabled();
    await page.goto("/portfolio");
    await expect(page.getByText(title)).toHaveCount(0);

    // deleted, with its images
    await page.goto(`/admin/portfolio/${id}`);
    await page.getByRole("button", { name: "Excluir caso" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Excluir" }).click();
    await expect(page).toHaveURL(/\/admin\/portfolio$/);
    const { data: files } = await service.storage.from("portfolio").list(id);
    expect(files ?? []).toHaveLength(0);
  } finally {
    await service.from("portfolio_items").delete().eq("id", id);
  }
});

test("the order of the cases changes from the list", async ({ page, isMobile }) => {
  test.skip(isMobile, "the table is the same on every screen");
  await signInAs(page, "admin@sdglabs.local", "/admin/portfolio");
  const titles = () => page.getByRole("row").locator("td:nth-child(2) a").allTextContents();
  const before = await titles();
  expect(before.length).toBeGreaterThan(1);

  await page.getByRole("button", { name: `Descer ${before[0]}` }).click();
  await expect.poll(titles).toEqual([before[1], before[0], ...before.slice(2)]);
  await page.getByRole("button", { name: `Subir ${before[0]}` }).click();
  await expect.poll(titles).toEqual(before);
});
