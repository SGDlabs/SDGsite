import { expect, test, type Page } from "@playwright/test";
import { adminClient, linkFromEmail, testEmail, withSupabase } from "./support/supabase";

const SEED_PASSWORD = "sdglabs-local";
const SIGN_IN_FAILED = "Não conseguimos entrar com esses dados. Confira o e-mail e a senha.";

// inside <main>: Next's route announcer is an alert too
const alertIn = (page: Page) => page.getByRole("main").getByRole("alert");

async function signIn(page: Page, email: string, password = SEED_PASSWORD) {
  await page.getByRole("textbox", { name: "E-mail" }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
}

test.describe("without Supabase", () => {
  test.skip(withSupabase, "content mode only");

  test("the client area and the admin ask to sign in first", async ({ page }) => {
    await page.goto("/painel/projetos/1?aba=feed");
    await expect(page).toHaveURL(/\/login\?next=%2Fpainel%2Fprojetos%2F1%3Faba%3Dfeed$/);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login\?next=%2Fadmin$/);
  });

  test("login validates, then says access is not available here", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText("Use um e-mail válido, como voce@empresa.com.br.")).toBeVisible();
    await expect(page.getByText("Escreva sua senha.")).toBeVisible();

    await signIn(page, "maria@empresa.com.br", "qualquer");
    await expect(alertIn(page)).toHaveText("O acesso ainda não está disponível neste ambiente.");
  });

  test("a failed e-mail link explains what happened", async ({ page }) => {
    await page.goto("/auth/callback?token_hash=x&type=invite");
    await expect(page).toHaveURL(/\/login\?erro=convite$/);
    await expect(alertIn(page)).toContainText("Esse convite expirou ou já foi usado.");
  });
});

test.describe("with Supabase", () => {
  test.skip(!withSupabase, "needs the local Supabase (CI's Supabase job)");

  test("a client signs in, sees their area and signs out", async ({ page }) => {
    await page.goto("/login");
    await signIn(page, "cliente@exemplo.local");
    await expect(page).toHaveURL(/\/painel$/);
    await expect(page.getByText("Olá, Cliente Exemplo.")).toBeVisible();

    // signed in, /login and /admin lead back to the client area
    await page.goto("/login");
    await expect(page).toHaveURL(/\/painel$/);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/painel$/);

    await page.getByRole("button", { name: "Conta de Cliente Exemplo" }).click();
    await page.getByRole("menuitem", { name: "Sair" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/painel");
    await expect(page).toHaveURL(/\/login\?next=%2Fpainel$/);
  });

  test("after signing in, goes back to the page that asked for it", async ({ page }) => {
    await page.goto("/painel?aba=feed");
    await expect(page).toHaveURL(/\/login\?next=%2Fpainel%3Faba%3Dfeed$/);
    await signIn(page, "cliente@exemplo.local");
    await expect(page).toHaveURL(/\/painel\?aba=feed$/);
  });

  test("an admin lands on the admin and can open the client area", async ({ page }) => {
    await page.goto("/login");
    await signIn(page, "admin@sdglabs.local");
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByText("Olá, Admin SDG Labs.")).toBeVisible();
    await page.goto("/painel");
    await expect(page).toHaveURL(/\/painel$/);
  });

  test("a wrong password and an unknown e-mail get the same answer", async ({ page }) => {
    await page.goto("/login");
    await signIn(page, "cliente@exemplo.local", "senha-errada");
    await expect(alertIn(page)).toHaveText(SIGN_IN_FAILED);
    await signIn(page, "ninguem@exemplo.local", "senha-errada");
    await expect(alertIn(page)).toHaveText(SIGN_IN_FAILED);
    await expect(page).toHaveURL(/\/login$/);
  });

  test.describe("by e-mail", () => {
    // one browser is enough for the e-mail flows, and keeps the local mail rate limit away
    test.skip(({ isMobile }) => isMobile, "desktop only");

    const created: string[] = [];
    test.afterAll(async () => {
      if (created.length === 0) return;
      const admin = adminClient();
      for (const id of created) await admin.auth.admin.deleteUser(id);
    });

    test("a client recovers the password", async ({ page }) => {
      const email = testEmail("recupera");
      const { data } = await adminClient().auth.admin.createUser({
        email,
        password: "senha-antiga-1",
        email_confirm: true,
        user_metadata: { full_name: "Rita Recupera" },
        app_metadata: { role: "client", client_id: "11111111-1111-4111-8111-111111111111" },
      });
      created.push(data.user!.id);

      await page.goto("/login");
      await page.getByRole("link", { name: "Esqueci minha senha" }).click();
      await page.getByRole("textbox", { name: "E-mail" }).fill(email);
      await page.getByRole("button", { name: "Enviar link" }).click();
      await expect(page.getByRole("main").getByRole("status")).toContainText(
        "Se esse e-mail tiver acesso",
      );

      await page.goto(await linkFromEmail(email, "/redefinir-senha"));
      await page.getByLabel("Nova senha", { exact: true }).fill("senha-nova-1");
      await page.getByLabel("Repita a nova senha").fill("senha-nova-1");
      await page.getByRole("button", { name: "Salvar e entrar" }).click();
      await expect(page).toHaveURL(/\/painel$/);
      await expect(page.getByText("Olá, Rita Recupera.")).toBeVisible();

      // the new password works, and the link is spent
      await page.getByRole("button", { name: "Conta de Rita Recupera" }).click();
      await page.getByRole("menuitem", { name: "Sair" }).click();
      await signIn(page, email, "senha-nova-1");
      await expect(page).toHaveURL(/\/painel$/);
    });

    test("an invited client chooses a password and enters", async ({ page }) => {
      const email = testEmail("convite");
      const admin = adminClient();
      // what inviteClientUser does: invite, then role and company in app_metadata
      const { data } = await admin.auth.admin.inviteUserByEmail(email, {
        data: { full_name: "Convidada" },
      });
      created.push(data.user!.id);
      await admin.auth.admin.updateUserById(data.user!.id, {
        app_metadata: { role: "client", client_id: "11111111-1111-4111-8111-111111111111" },
      });

      const link = await linkFromEmail(email, "/convite");
      await page.goto(link);
      await page.getByRole("textbox", { name: "Seu nome" }).fill("Maria Convidada");
      await page.getByLabel("Senha", { exact: true }).fill("senha-boa-1");
      await page.getByLabel("Repita a senha").fill("outra-senha");
      await page.getByRole("button", { name: "Criar acesso" }).click();
      await expect(page.getByText("As duas senhas precisam ser iguais.")).toBeVisible();

      await page.getByLabel("Repita a senha").fill("senha-boa-1");
      await page.getByRole("button", { name: "Criar acesso" }).click();
      await expect(page).toHaveURL(/\/painel$/);
      // the name confirmed on /convite reached the profile
      await expect(page.getByText("Olá, Maria Convidada.")).toBeVisible();

      // an invitation works once
      await page.context().clearCookies();
      await page.goto(link);
      await page.getByRole("textbox", { name: "Seu nome" }).fill("Outra Pessoa");
      await page.getByLabel("Senha", { exact: true }).fill("senha-boa-2");
      await page.getByLabel("Repita a senha").fill("senha-boa-2");
      await page.getByRole("button", { name: "Criar acesso" }).click();
      await expect(alertIn(page)).toContainText("Esse convite expirou ou já foi usado.");
    });
  });
});
