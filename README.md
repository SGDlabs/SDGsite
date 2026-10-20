# SDG Site

O site da SDG Labs, num único app Next.js com três áreas:

- **Site público**: landing page animada, serviços, softwares próprios, portfólio e contato.
- **Área do cliente** (`/painel`): quem contratou acompanha o projeto em 5 etapas, com a etapa
  atual pulsando, e um feed de prints, vídeos e notas em tempo real.
- **Painel admin** (`/admin`): os sócios operam clientes, projetos, etapas, portfólio e leads.

Stack: Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Supabase, deploy na Vercel. O plano
completo, com fases e prompts, está em `docs/arquitetura.md`. O contexto para agentes de IA está em
[CLAUDE.md](CLAUDE.md).

## Como rodar

Requisitos: Node 24 (LTS) e pnpm 11 (`corepack enable` instala a versão do `packageManager`).

```bash
pnpm install
cp .env.example .env.local   # opcional: sem Supabase o site roda no modo conteúdo
pnpm dev                     # http://localhost:3000
```

## Scripts

| Script                              | O que faz                                                             |
| ----------------------------------- | --------------------------------------------------------------------- |
| `pnpm dev`                          | gera os tokens e sobe o servidor de desenvolvimento                   |
| `pnpm build` / `pnpm start`         | gera os tokens e faz o build de produção / serve o build              |
| `pnpm lint`                         | ESLint                                                                |
| `pnpm typecheck`                    | gera os tipos de rota do Next (`next typegen`) e roda o `tsc`         |
| `pnpm format` / `pnpm format:check` | Prettier (com ordenação das classes do Tailwind)                      |
| `pnpm test`                         | testes unitários (Vitest), incluindo os de RLS no PGlite              |
| `pnpm test:e2e`                     | testes de ponta a ponta (Playwright, no Chrome instalado na máquina)  |
| `pnpm test:db`                      | só os testes de RLS (com `DATABASE_URL`, contra o Supabase local)     |
| `pnpm db:types`                     | regenera `src/types/database.ts` a partir do Supabase local           |
| `pnpm supabase …`                   | Supabase CLI (`start`, `stop`, `status`, `db reset`, `migration new`) |
| `pnpm tokens`                       | regenera `src/styles/tokens.css` a partir de `src/styles/tokens.json` |

Hooks do Git (Husky): o `pre-commit` roda ESLint e Prettier nos arquivos alterados
(lint-staged), e o `commit-msg` confere a mensagem no padrão Conventional Commits (commitlint).

## Variáveis de ambiente

Validadas com Zod em `src/lib/env.ts`. Copie `.env.example` para `.env.local`; nenhum `.env*`
além do exemplo vai para o Git.

| Variável                        | Onde é usada                                             |
| ------------------------------- | -------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`          | URL pública do site (links absolutos, Open Graph)        |
| `NEXT_PUBLIC_SUPABASE_URL`      | URL do projeto Supabase                                  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | chave pública do Supabase (protegida por RLS)            |
| `SUPABASE_SERVICE_ROLE_KEY`     | chave de serviço do Supabase, **só no servidor**         |
| `RESEND_API_KEY`                | envio de e-mails transacionais                           |
| `EMAIL_FROM`                    | remetente dos e-mails, ex.: `SDG Labs <contato@dominio>` |

Sem `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`, o site roda no "modo conteúdo":
o portfólio vem de `src/content/portfolio.ts` e o formulário de contato só registra no log. Serve
para mexer no front sem Docker. Em produção (Vercel) o Supabase é obrigatório.

## Banco de dados (Supabase)

Tudo fica em `supabase/`: `config.toml`, `migrations/` (SQL versionado), `seed.sql` e `tests/`.

```bash
pnpm supabase start      # sobe o Supabase local (precisa de Docker)
pnpm supabase status     # mostra a URL e as chaves para o .env.local
pnpm supabase db reset   # recria o banco com as migrations e o seed
pnpm db:types            # atualiza src/types/database.ts depois de mudar o schema
```

O seed cria duas contas para testar, ambas com a senha `sdglabs-local`:
`admin@sdglabs.local` (admin) e `cliente@exemplo.local` (cliente, com um projeto na etapa 2). O
Studio local fica em http://127.0.0.1:54323 e os e-mails do Auth em http://127.0.0.1:54324.

Regras que o schema garante:

- RLS em todas as tabelas. O admin lê e escreve tudo; o cliente só lê os projetos, as etapas, as
  atualizações e as mídias da própria empresa; o visitante só lê o portfólio publicado e envia
  leads; `project_tokens` só é acessível pelo servidor, com a service role.
- O papel e a empresa do usuário vêm do `app_metadata` do Auth, que só a service role altera (o
  `user_metadata` o próprio usuário pode editar). O perfil em `profiles` acompanha por trigger.
- Cadastro aberto desligado: contas só por convite.
- `advance_project_stage(project_id)` conclui a etapa atual, inicia a próxima e posta um "marco",
  numa transação; `create_project_with_stages(...)` cria o projeto com as 5 etapas padrão.
- Buckets: `portfolio` (público) e `project-media` (privado, arquivos em `<projeto>/<atualização>/`).
- Realtime ligado em `projects`, `project_stages` e `project_updates`.

Os testes em `supabase/tests/rls.test.ts` provam essas regras (um cliente não lê o projeto de
outro, entre outras). Localmente rodam no PGlite, um Postgres em WebAssembly, sem Docker. No CI
rodam contra o Postgres do Supabase local, e o CI também confere se `src/types/database.ts` bate
com o schema.

## Design system

A marca vem do design system SDG Labs, e o README dele é a referência de voz, cores, tipografia e
logo. No repositório:

| Arquivo                     | Origem                                                                       |
| --------------------------- | ---------------------------------------------------------------------------- |
| `src/styles/tokens.json`    | cópia do `tokens.json` do design system                                      |
| `src/styles/tokens.css`     | gerado por `pnpm tokens`: variáveis CSS, tema do Tailwind e classes `type-*` |
| `src/lib/brand/sdg-logo.js` | motor do logo animado, copiado sem alterações                                |
| `public/brand/*.svg`        | logos (vertical, horizontal e ícone, versões claro e escuro)                 |

Para mudar uma cor, um raio ou um estilo de texto, atualize a cópia do `tokens.json` e rode
`pnpm tokens`. A paleta padrão do Tailwind está desligada: só existem as cores da marca
(`bg-surface`, `text-ink`, `bg-accent`…).

## Fluxo de branches e commits

- `main` é produção e é protegida: nada entra sem PR com CI verde e a aprovação do outro sócio.
- Branches: `feat/<assunto>`, `fix/<assunto>`, `chore/<assunto>`.
- Commits em inglês, no padrão Conventional Commits: `feat: add stage tracker`,
  `fix: signed url expiry`.
- Um assunto por PR, com print ou vídeo quando mexer em tela. A Vercel gera um preview por PR.
- Tag `v0.x` a cada fase entregue; `v1.0.0` no lançamento.

## CI

O workflow `.github/workflows/ci.yml` roda em todo pull request e em todo push na `main`: instala
com o lockfile congelado e roda lint, Prettier, typecheck, testes unitários, build e os testes de
ponta a ponta (Playwright no Chrome do runner). Se os testes de ponta a ponta falharem, o relatório
fica como artefato `playwright-report` por 7 dias. O Dependabot abre PRs semanais de dependências e
de actions, só com versões publicadas há pelo menos duas semanas.

## Antes de publicar

A landing ainda tem campos entre colchetes, vindos do protótipo, em `src/components/marketing/`:

- `contact.tsx`: e-mail e WhatsApp da SDG Labs.
- `src/content/portfolio.ts`: os casos do portfólio (nome, resumo, texto, stack, link). As
  imagens ficam em `public/portfolio/<slug>/` (`cover.png`, `galeria-1.png`…); as atuais são as
  capas em pixel art do protótipo, marcadas com `pixelArt: true`. Tire essa marca ao trocar por
  prints reais, para o Next otimizar as imagens.
- `about.tsx`: uma frase sobre cada sócio.
- `faq.tsx`: a política de suporte depois da entrega.

O formulário de contato só valida e mostra a confirmação; gravar o lead entra com o Supabase
(prompt 6).
