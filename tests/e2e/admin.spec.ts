import { expect, test, type Page } from "@playwright/test";
import { adminClient, linkFromEmail, signInAs, testEmail, withSupabase } from "./support/supabase";

test.skip(!withSupabase, "needs the local Supabase (CI's Supabase job)");

const signInAsAdmin = (page: Page, next = "/admin") => signInAs(page, "admin@sdglabs.local", next);

const cleanup: (() => PromiseLike<unknown>)[] = [];
test.afterEach(async () => {
  for (const undo of cleanup.splice(0).reverse()) await undo();
});

test("the overview shows projects, leads and the feed", async ({ page }) => {
  await signInAsAdmin(page);
  await expect(page.getByRole("heading", { level: 1, name: "Visão geral" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Projetos em andamento" })).toBeVisible();
  await expect(page.getByText("App de agendamento").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Últimas atualizações" })).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: "Visão geral" }),
  ).toHaveAttribute("aria-current", "page");
});

test("an admin creates a client and invites someone who then signs in", async ({
  page,
  browser,
  isMobile,
}) => {
  test.skip(isMobile, "one browser is enough for the e-mail flow");
  const service = adminClient();
  const company = `Empresa ${Date.now()}`;
  const email = testEmail("convidado");

  await signInAsAdmin(page, "/admin/clientes");
  await page.getByRole("link", { name: "Novo cliente" }).click();
  await expect(page).toHaveURL(/\/admin\/clientes\/novo$/);
  await page.getByRole("button", { name: "Criar cliente" }).click();
  await expect(page.getByText("Escreva o nome da empresa.")).toBeVisible();
  await page.getByRole("textbox", { name: "Nome da empresa" }).fill(company);
  await page.getByRole("button", { name: "Criar cliente" }).click();

  await expect(page.getByRole("heading", { level: 1, name: company })).toBeVisible();
  const clientId = page.url().split("/").pop()!;
  cleanup.push(() => service.from("clients").delete().eq("id", clientId));

  await page.getByRole("textbox", { name: "Telefone" }).fill("(11) 99999-0000");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(
    page.getByRole("main").getByRole("status").filter({ hasText: "Dados salvos." }),
  ).toBeVisible();

  await page.getByRole("textbox", { name: "Nome", exact: true }).fill("Pessoa Convidada");
  await page.getByRole("textbox", { name: "E-mail", exact: true }).fill(email);
  await page.getByRole("button", { name: "Convidar usuário" }).click();
  await expect(page.getByText(`Convite enviado para ${email}.`)).toBeVisible();
  await expect(page.getByText(email).last()).toBeVisible();

  const { data: users } = await service.auth.admin.listUsers({ perPage: 1000 });
  const invited = users.users.find((user) => user.email === email);
  if (invited) cleanup.push(() => service.auth.admin.deleteUser(invited.id));
  expect(invited?.app_metadata).toMatchObject({ role: "client", client_id: clientId });

  // the invited person, in a browser of their own
  const guest = await (await browser.newContext()).newPage();
  await guest.goto(await linkFromEmail(email, "/convite"));
  await guest.getByRole("textbox", { name: "Seu nome" }).fill("Pessoa Convidada");
  await guest.getByLabel("Senha", { exact: true }).fill("senha-boa-1");
  await guest.getByLabel("Repita a senha").fill("senha-boa-1");
  await guest.getByRole("button", { name: "Criar acesso" }).click();
  await expect(guest).toHaveURL(/\/painel$/);
  await expect(guest.getByText("Nenhum projeto por aqui ainda.")).toBeVisible();
  await guest.context().close();
});

test("a lead from the site reaches the admin and moves along", async ({ page, isMobile }) => {
  test.skip(isMobile, "the table is the same on every screen");
  const service = adminClient();
  const email = testEmail("lead");
  cleanup.push(() => service.from("leads").delete().eq("email", email));

  await page.goto("/");
  await page.getByRole("textbox", { name: "Nome", exact: true }).fill("Lead de Teste");
  await page.getByRole("textbox", { name: "E-mail", exact: true }).fill(email);
  await page.getByRole("checkbox", { name: /Li e concordo com a Política de Privacidade/ }).check();
  await page.getByRole("button", { name: "Enviar mensagem" }).click();
  await expect(page.getByText("Mensagem enviada.")).toBeVisible();

  await signInAsAdmin(page, "/admin/leads?status=novo");
  await expect(page.getByRole("row").filter({ hasText: email })).toBeVisible();

  // without a filter, so the row stays on screen after the change
  await page.goto("/admin/leads");
  const row = page.getByRole("row").filter({ hasText: email });
  const status = row.getByRole("combobox", { name: "Status de Lead de Teste" });
  await status.selectOption("em_contato");
  await expect(status).toBeEnabled();
  await expect(status).toHaveValue("em_contato");

  await page.goto("/admin/leads?status=em_contato");
  await expect(page.getByRole("row").filter({ hasText: email })).toBeVisible();
  const { data } = await service.from("leads").select("status").eq("email", email).single();
  expect(data?.status).toBe("em_contato");
});
