import { expect, test } from "@playwright/test";

test("landing shows the slogan and the contact call to action", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "A fórmula do seu software." }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Fale com a gente" }).first()).toBeVisible();
});

test("stage tracker demo moves the current stage forward", async ({ page }) => {
  await page.goto("/");
  const tracker = page.getByRole("list", { name: "Exemplo de andamento de projeto" });
  await expect(tracker.locator('[aria-current="step"]')).toContainText("Desenvolvimento");

  await page.getByRole("button", { name: "Simular avanço de etapa" }).click();

  await expect(tracker.locator('[aria-current="step"]')).toContainText("Testes e homologação");
  await expect(page.getByText("Etapa 4 de 5 — Testes e homologação")).toBeVisible();
});

test("page never scrolls sideways", async ({ page }) => {
  await page.goto("/");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
});
