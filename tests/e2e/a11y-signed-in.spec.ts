import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { SEED, signInAs, withSupabase } from "./support/supabase";

test.skip(!withSupabase, "needs the local Supabase (CI's Supabase job)");

async function violations(page: Page) {
  await page.waitForLoadState("networkidle");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  return results.violations.map(
    (violation) =>
      `${violation.id} (${violation.impact}): ${violation.nodes
        .slice(0, 3)
        .map((node) => node.target.join(" "))
        .join(" | ")}`,
  );
}

// both themes: the areas follow the device, or the choice in the user menu
for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`${colorScheme} theme`, () => {
    test.use({ colorScheme });

    test("the client area has no automatic accessibility violations", async ({ page }) => {
      for (const path of ["/painel", `/painel/projetos/${SEED.project}`, "/painel/conta"]) {
        if (path === "/painel") await signInAs(page, "cliente@exemplo.local", path);
        else await page.goto(path);
        expect(await violations(page), path).toEqual([]);
      }
    });

    test("the admin has no automatic accessibility violations", async ({ page }) => {
      const paths = [
        "/admin",
        "/admin/clientes",
        "/admin/projetos",
        `/admin/projetos/${SEED.project}`,
        "/admin/portfolio",
        "/admin/leads",
      ];
      for (const path of paths) {
        if (path === "/admin") await signInAs(page, "admin@sdglabs.local", path);
        else await page.goto(path);
        expect(await violations(page), path).toEqual([]);
      }
    });
  });
}
