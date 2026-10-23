# Deploy

Como colocar o SDG Site no ar pela primeira vez, na ordem. Os passos com **código** já estão no
repositório; os outros são configuração nos painéis do Supabase, da Vercel, do Resend e do
GitHub. Os procedimentos do dia a dia (restaurar backup, revogar token, dar acesso a um cliente)
estão no [runbook](runbook.md).

Troque `[domínio]` pelo domínio de vocês (ex.: `sdglabs.com.br`) em todo o texto.

## 1. Supabase de produção

1. Crie o projeto `sdg-site` na região **South America (São Paulo)**. Guarde a senha do banco num
   gerenciador de senhas.
2. Plano: o **Pro** tem backup diário (7 dias) e permite ligar o PITR. No Free não há backup; veja
   [Backups](runbook.md#backups).
3. Anote, em **Project Settings**:
   - **General > Reference ID**: o `project ref`;
   - **API Keys**: a chave pública (`anon`, ou a `sb_publishable_…` nos projetos novos) e a chave
     de serviço (`service_role`, ou `sb_secret_…`). As duas funcionam com o código.
4. Crie um token pessoal em **Account > Access Tokens**, para o GitHub aplicar as migrations.

Para os previews da Vercel, o ideal é um segundo projeto, `sdg-site-staging` (pode ser Free): assim
nenhum preview grava no banco dos clientes. Repita os passos 1, 3 e 4 nele.

## 2. Migrations

As migrations (tabelas, RLS, funções, buckets e Realtime) entram pelo workflow
`.github/workflows/migrations.yml`, que roda a cada push na `main` que mexa em
`supabase/migrations/` e nunca aplica o seed.

1. No GitHub, em **Settings > Environments**, crie o ambiente `production` (se quiser, com
   **Required reviewers**: aí cada migration espera a aprovação de um de vocês).
2. Nesse ambiente, crie os segredos `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF` e
   `SUPABASE_DB_PASSWORD`.
3. Em **Actions > Database migrations > Run workflow**, rode na `main`. O passo "Migrations that
   will run" lista o que vai ser aplicado antes de aplicar.

O staging recebe as mesmas migrations com o CLI, da máquina de vocês:

```bash
pnpm supabase db push --project-ref <ref-do-staging> --password <senha-do-staging>
```

## 3. Supabase Auth

Em **Authentication**, no projeto de produção:

| Onde                                | O quê                                                                         |
| ----------------------------------- | ----------------------------------------------------------------------------- |
| Sign In / Providers > Email         | Ligado. **Allow new users to sign up: desligado** (contas só por convite)     |
| Sign In / Providers > Email         | Email OTP Expiration: `86400` (24 horas: o convite usa o mesmo prazo)         |
| Sign In / Providers > Email         | Minimum password length: `8`                                                  |
| URL Configuration > Site URL        | `https://[domínio]` (os links dos e-mails saem daqui)                         |
| URL Configuration > Redirect URLs   | `https://[domínio]/**`                                                        |
| Emails > Templates > Invite user    | Assunto e HTML de `supabase/templates/invite.html` (assunto no `config.toml`) |
| Emails > Templates > Reset password | Assunto e HTML de `supabase/templates/recovery.html`                          |
| Emails > SMTP Settings              | Resend, passo 6                                                               |

No staging, a mesma coisa, com a **Site URL** e as **Redirect URLs** do preview
(`https://*-[time-da-vercel].vercel.app/**`).

Não use `supabase config push`: o `config.toml` tem valores só para desenvolvimento e CI (endereços
locais e limites de login e de e-mail folgados para os testes).

### Os primeiros admins

1. **Authentication > Users > Add user**: o e-mail de cada um, com senha e **Auto Confirm User**.
2. No **SQL Editor**, para cada um:

```sql
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
where email = '[e-mail do sócio]';
```

O perfil vira admin na hora (o trigger lê o `app_metadata`). Entre em `/login`: vocês caem em
`/admin`. Clientes nunca são criados assim: sempre pelo convite do admin.

## 4. Vercel

1. **Add New > Project**, importe `SGDlabs/SDGsite`. A Vercel reconhece o Next.js e o pnpm (pela
   versão em `packageManager`). Deixe **Root Directory** em branco: o app fica na raiz do
   repositório, e com uma subpasta (como `scripts`) todo deploy falha antes do build.
2. Em **Settings > Environment Variables**:

| Variável                        | Production                                 | Preview                                 |
| ------------------------------- | ------------------------------------------ | --------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`          | `https://[domínio]`                        | vazia (usa o endereço do preview)       |
| `NEXT_PUBLIC_SUPABASE_URL`      | URL do projeto de produção                 | URL do staging                          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | chave pública de produção                  | chave pública do staging                |
| `SUPABASE_SERVICE_ROLE_KEY`     | chave de serviço de produção (Sensitive)   | chave de serviço do staging (Sensitive) |
| `RESEND_API_KEY`                | chave do Resend (Sensitive)                | vazia: os e-mails só vão para o log     |
| `EMAIL_FROM`                    | `SDG Labs <contato@[domínio]>`             | vazia                                   |
| `EMAIL_TEAM`                    | os e-mails de vocês, separados por vírgula | vazia                                   |
| `CRON_SECRET`                   | texto aleatório com 32+ caracteres         | vazia                                   |

Para gerar o `CRON_SECRET`: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

3. Sem o Supabase, o build de produção falha de propósito (`src/lib/env.ts`): um site no ar sem
   banco perderia leads.
4. Em **Analytics** e **Speed Insights**, ligue os dois (não usam cookies).
5. **Deployment Protection**: deixe os previews protegidos (padrão), para só o time abrir.

## 5. Domínio

1. Na Vercel, **Settings > Domains**: adicione `[domínio]` e `www.[domínio]`, com o `www`
   redirecionando para o principal.
2. No registro do domínio (Registro.br ou outro), crie os registros que a Vercel mostrar (`A` para
   o domínio principal e `CNAME` para o `www`). O certificado sai sozinho.

## 6. Resend (e-mails)

1. Em **Domains > Add Domain**, adicione `[domínio]` na região **São Paulo (sa-east-1)**.
2. No DNS, crie os registros que o Resend mostrar: **SPF** (MX e TXT no subdomínio `send`) e
   **DKIM** (TXT em `resend._domainkey`). Acrescente um **DMARC**:
   `_dmarc` TXT `v=DMARC1; p=none; rua=mailto:[e-mail de vocês]`. Depois de algumas semanas sem
   problema, troque `p=none` por `p=quarantine`.
3. **Verify DNS Records**, depois **API Keys > Create** (permissão de envio) e coloque a chave em
   `RESEND_API_KEY` na Vercel.
4. No Supabase (**Authentication > Emails > SMTP Settings**): host `smtp.resend.com`, porta `465`,
   usuário `resend`, senha = a mesma chave, remetente `contato@[domínio]`, nome `SDG Labs`. Assim
   o convite e a recuperação de senha saem do domínio verificado.

## 7. GitHub

1. **Settings > Secrets and variables > Actions** (segredos do repositório):
   - `SITE_URL` = `https://[domínio]` e `CRON_SECRET` = o mesmo da Vercel: a rodada de hora em
     hora dos e-mails de novidades (`.github/workflows/digest.yml`).
2. **Settings > Branches > Add rule** para a `main`:
   - Require a pull request before merging, com **1 aprovação** (o outro sócio);
   - Require status checks: **Lint, types, tests and build** e
     **Supabase (database, sign-in, client area, admin)**;
   - sem force push e sem apagar a branch.
3. O repositório está **público**: o código e os e-mails dos commits ficam visíveis, e os
   relatórios de testes que falham também (só com dados de teste). Os segredos ficam protegidos de
   qualquer jeito. Se preferirem fechar, **Settings > General > Change visibility**.

## 8. Antes de anunciar

- [ ] Placeholders preenchidos (README, "Antes de publicar"): contato, sócios, FAQ, portfólio,
      privacidade e termos revisados por um advogado.
- [ ] `/login` com o e-mail de um admin cai em `/admin`.
- [ ] Um cliente de teste convidado pelo admin recebe o e-mail do domínio, define a senha e vê o
      projeto; avance uma etapa e veja a bolinha andar na tela dele.
- [ ] O formulário de contato chega em **Leads** e no e-mail dos sócios.
- [ ] `https://[domínio]/sitemap.xml` e `/robots.txt` com o domínio certo.
- [ ] Um token de integração de teste publica com o `curl` de [integracao.md](integracao.md).
- [ ] Rode **Actions > E-mail digest > Run workflow** uma vez: termina com `{"sent": …}`.
- [ ] Tag `v1.0.0` na `main`.
