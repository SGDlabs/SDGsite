import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Automatic accessibility checks (WCAG 2.1 A and AA) on the pages anyone can open. They catch
// what a machine can: names, roles, contrast, labels. Keyboard and screen reader use are checked
// by hand.
const PAGES = [
  "/",
  "/portfolio",
  "/portfolio/projeto-site",
  "/privacidade",
  "/termos",
  "/login",
  "/recuperar-senha",
  "/convite",
  "/design/area-do-cliente",
  "/pagina-que-nao-existe",
];

for (const path of PAGES) {
  test(`${path} has no automatic accessibility violations`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      // decorative canvases of the landing are aria-hidden or labelled; the grain overlay is not content
      .exclude(".grain")
      .analyze();
    const summary = results.violations.map(
      (violation) =>
        `${violation.id} (${violation.impact}): ${violation.nodes
          .slice(0, 3)
          .map((node) => node.target.join(" "))
          .join(" | ")}`,
    );
    expect(summary).toEqual([]);
  });
}
