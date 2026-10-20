import { expect, test } from "@playwright/test";

test("design page is internal and switches themes", async ({ page }) => {
  await page.goto("/design");
  await expect(page.getByRole("heading", { level: 1, name: "Design system" })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);

  // the theme switcher sits in the header actions on every screen size
  await page.getByRole("button", { name: "Escuro" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Sistema" }).click();
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.*/);
});

test("client area preview: stage details, feed filters and lightbox", async ({ page }) => {
  await page.goto("/design/area-do-cliente");
  const tracker = page.getByRole("list", { name: "Andamento do projeto" });
  await expect(tracker.locator('[aria-current="step"]')).toContainText("Design");
  await expect(page.getByText("UI/UX e protótipo.")).toBeVisible();
  await tracker.getByRole("button", { name: /Organização de ideias/ }).click();
  await expect(page.getByText("Briefing, escopo e cronograma.")).toBeVisible();

  const feed = page.getByRole("list", { name: /Atualizações/ });
  await expect(feed.getByRole("article")).toHaveCount(4);
  await page.getByRole("button", { name: "Prints", exact: true }).click();
  await expect(feed.getByRole("article")).toHaveCount(1);

  await page
    .getByRole("button", { name: "Ampliar: Telas da página inicial, imagem 2 de 3" })
    .click();
  const lightbox = page.getByRole("dialog", { name: "Imagem ampliada: Telas da página inicial" });
  await expect(lightbox.getByText("2 de 3")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(lightbox.getByText("3 de 3")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(lightbox).toBeHidden();
});
