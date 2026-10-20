import { expect, test } from "@playwright/test";

test("landing shows the slogan and the main call to action", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "A fórmula do seu software." }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Começar um projeto" }).first()).toBeVisible();
});

test("page loads without console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(errors).toEqual([]);
});

test("faq opens a closed answer", async ({ page }) => {
  await page.goto("/");
  const question = page.getByRole("button", { name: "Quanto tempo leva?" });
  await expect(question).toHaveAttribute("aria-expanded", "false");
  await question.click();
  await expect(question).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText("O prazo sai na primeira etapa")).toBeVisible();
});

test("contact form validates and then confirms", async ({ page }) => {
  await page.goto("/");
  const submit = page.getByRole("button", { name: "Enviar mensagem" });
  await submit.click();
  await expect(page.getByText("Escreva seu nome.")).toBeVisible();

  await page.getByRole("textbox", { name: "Nome", exact: true }).fill("Maria");
  await page.getByRole("textbox", { name: "E-mail", exact: true }).fill("maria@empresa.com.br");
  await submit.click();
  await expect(page.getByText("Mensagem enviada.")).toBeVisible();
});

test("mobile menu opens with the section links", async ({ page, isMobile }) => {
  test.skip(!isMobile, "the menu button only shows on small screens");
  await page.goto("/");
  await page.getByRole("button", { name: "Menu" }).click();
  await expect(page.locator("#mobileMenu").getByRole("link", { name: "Portfólio" })).toBeVisible();
});

test("page never scrolls sideways", async ({ page }) => {
  await page.goto("/");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
});
