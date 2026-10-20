import { expect, test } from "@playwright/test";

test("portfolio lists every case and filters by category", async ({ page }) => {
  await page.goto("/portfolio");
  await expect(page.getByRole("heading", { level: 1, name: "Portfólio" })).toBeVisible();
  await expect(page.locator(".pf-grid .work")).toHaveCount(4);

  await page.goto("/portfolio?categoria=app");
  await expect(page.getByRole("link", { name: "Aplicativos" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page.locator(".pf-grid .work")).toHaveCount(1);
  await expect(page.locator(".pf-grid .work .w-tag")).toHaveText("Aplicativo");
});

test("case study shows the gallery in a lightbox", async ({ page }) => {
  await page.goto("/portfolio/projeto-app");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("Aplicativo", { exact: true })).toBeVisible();

  await page.locator(".pf-thumb").first().click();
  const dialog = page.getByRole("dialog", { name: "Imagem ampliada" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("1 / 2")).toBeVisible();
  await dialog.getByRole("button", { name: "Próxima" }).click();
  await expect(dialog.getByText("2 / 2")).toBeVisible();
  await dialog.getByRole("button", { name: "Fechar" }).click();
  await expect(dialog).toBeHidden();
});

test("unknown case answers 404", async ({ page }) => {
  const response = await page.goto("/portfolio/nao-existe");
  expect(response?.status()).toBe(404);
});

test("landing cards open the case study", async ({ page }) => {
  await page.goto("/");
  const card = page.locator("#wTrack a.work").first();
  await expect(card).toHaveAttribute("href", "/portfolio/projeto-site");
});
