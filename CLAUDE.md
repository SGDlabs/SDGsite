# SDG Site

Contexto permanente do projeto. Vale para toda sessão e todo agente.

## Projeto

SDG Site é o site da SDG Labs, software house de dois sócios (Gustavo e Daniel). Um único app
Next.js com três áreas:

1. **Site público**: landing page animada, serviços, softwares próprios, portfólio e contato.
2. **Área do cliente** (login e senha, conta criada por convite): quem contratou acompanha o
   projeto em 5 etapas, com a etapa atual marcada por uma bolinha pulsando, e um feed de prints,
   vídeos e notas em tempo real.
3. **Painel admin**: os sócios operam clientes, projetos, etapas, atualizações, portfólio e leads.

O plano completo (arquitetura, modelo de dados, fases e prompts) está em `docs/arquitetura.md`.

## Idioma

- Interface: português do Brasil.
- Código, nomes de variáveis, comentários e commits: inglês.

## Stack

Next.js 16 (App Router) + TypeScript estrito, pnpm, Tailwind CSS v4, shadcn/ui, Motion (Framer
Motion), Supabase (Postgres, Auth, Realtime, Storage), React Hook Form + Zod, Resend + React
Email, Vitest, Playwright, deploy na Vercel.

Next 16 tem mudanças grandes em relação a versões anteriores: consulte
`node_modules/next/dist/docs/` antes de usar uma API. Em particular:

- `cacheComponents` está ligado: `new Date()`, `Math.random()` e afins quebram o prerender; use
  `connection()` + `<Suspense>`, `"use cache"` ou um Client Component.
- Proteção de rotas fica em `src/proxy.ts` (o antigo middleware).
- `LayoutProps` / `PageProps` são tipos gerados: `pnpm typecheck` roda `next typegen` antes do `tsc`.
- O Next mantém até 3 páginas visitadas no documento, escondidas com `<Activity>`: ids fixos se
  repetem entre elas (gere com `useId()`; o `Field` já faz isso), e nos testes de ponta a ponta
  espere a URL nova antes de interagir depois de navegar.

## Comandos

| Comando                                        | O que faz                                                             |
| ---------------------------------------------- | --------------------------------------------------------------------- |
| `pnpm dev`                                     | servidor de desenvolvimento (gera os tokens antes)                    |
| `pnpm build`                                   | build de produção (gera os tokens antes)                              |
| `pnpm lint` / `pnpm typecheck` / `pnpm format` | ESLint / TypeScript / Prettier                                        |
| `pnpm test` / `pnpm test:e2e`                  | Vitest / Playwright (usa o Chrome instalado)                          |
| `pnpm tokens`                                  | regenera `src/styles/tokens.css` a partir de `src/styles/tokens.json` |

## Regras

- Server Components por padrão; `"use client"` só quando houver estado, efeito ou evento.
- Mutações via Server Actions em `src/server/actions`, sempre validando com Zod e checando o papel
  do usuário. Leituras em `src/server/queries`.
- Nunca expor a `SUPABASE_SERVICE_ROLE_KEY` ao navegador; variáveis de ambiente passam por
  `src/lib/env.ts`.
- Toda tabela tem RLS ligada.
- Cores só via tokens: classes como `bg-surface`, `text-ink`, `border-border`, `bg-accent`. A paleta
  padrão do Tailwind está desligada; nada de hex solto nos componentes.
- Animações respeitam `prefers-reduced-motion`.
- Commits no padrão Conventional Commits, em inglês (o hook `commit-msg` confere).

## Design system

A marca vem do design system SDG Labs (https://claude.ai/artifact/KazpoQKPVh51VLdQpHeM8z). O README
de lá é a referência de voz, cores, tipografia, logo e animação.

- `src/styles/tokens.json` é uma cópia do `tokens.json` do design system. Para mudar um token,
  atualize a cópia e rode `pnpm tokens`; nunca edite `src/styles/tokens.css` à mão.
- `src/lib/brand/sdg-logo.js` (motor do logo animado) e `public/brand/*.svg` vêm do design system
  sem alterações. Use os SVG, nunca redesenhe o logo.
- Tipografia por classes geradas: `type-display`, `type-h1`, `type-h2`, `type-h3`, `type-lead`,
  `type-body`, `type-small`, `type-label`, `type-eyebrow`, `type-pixel-tag`, `type-code`.
- Silkscreen (fonte pixel) só em `type-eyebrow` e `type-pixel-tag`, em caixa alta.
- `accent` é a cor de ação (botão primário, links, etapa atual, foco); `brand` é apoio e nunca vai
  em botão. A única sombra é `shadow-pixel`. Sem gradientes.
- Sobre `surface-inverse`, texto, links e foco usam `ink-inverse`: `accent` e `ink-muted` não têm
  contraste ali.
- Voz: primeira pessoa do plural ("a gente", "nós"), cliente tratado por "você", frases curtas, no
  máximo uma metáfora de laboratório por seção, sem emoji.
- A página interna `/design` (fora dos buscadores) mostra tokens, contraste e todos os componentes.
  O teste `src/lib/contrast.test.ts` garante os pares de texto em 4,5:1 nos dois temas.

## Componentes (shadcn/ui)

`components.json` está configurado (estilo `radix-nova`, ícones `lucide`). Os componentes moram em
`src/components/ui/` e usam o vocabulário dos tokens, não o do shadcn.

- Para adicionar um: `pnpm dlx shadcn@4.21.3 add <nome> --view`, e escreva o arquivo à mão a partir
  dele. Não rode `shadcn init` nem `add` sem `--view`: o CLI reescreve `globals.css`, troca a fonte
  do layout e cria variáveis (`--accent`, `--border`…) que sobrescrevem os tokens.
- Troca de cores: `primary` → `accent` / `on-accent`; `foreground` → `ink`; `background` →
  `surface`; `muted` e o `accent` de hover do shadcn → `surface-alt`; `muted-foreground` →
  `ink-muted`; `input` → `border-strong`; `card` → `surface-alt`. Ainda não há token de erro.
- Foco: o anel global de `:focus-visible` (2px sólido em `focus`, 2px de afastamento). Tire os
  `ring-*`/`outline-none` de foco dos componentes do shadcn.
- Botões e campos em `radius-sm`, cards em `radius-md`; `shadow-pixel` só no hover do botão
  principal e em cards em destaque.

## Landing page (exceção)

A landing (`src/app/(marketing)`) reproduz exatamente o protótipo aprovado
(https://claude.ai/artifact/SvwpheWa5bXpWWTwFMuNeg), que tem visual próprio: tema escuro único,
Bricolage Grotesque + Geist, raios maiores, brilhos e gradientes. As regras de tokens, Tailwind e
sombra acima valem para as outras áreas, não para a landing. Ao mexer nela, fique fiel ao protótipo.

- Estilos em `src/app/(marketing)/landing.css`, com as variáveis próprias presas ao contêiner
  `.landing` (não vazam para as outras rotas). As fontes vêm do `next/font` no layout do grupo.
- Marcação em `src/components/marketing/*.tsx` (uma seção por arquivo), renderizada no servidor.
- Comportamento (Lenis, seções fixadas, canvas, cursor, feed, FAQ) em
  `src/components/marketing/landing-script.ts`. É uma tradução linha a linha do script do
  protótipo: mantenha os números. Cada seção é opcional, então o mesmo script serve a outras páginas.
- Toda página do grupo `(marketing)` monta `<LandingPage>` (contêiner com `display: contents` que
  roda o script só dentro dele), `<LandingChrome />`, `<SiteNav>` e `<SiteFooter>`; a home passa
  `onHome` para os links virarem âncoras. Busque elementos dentro da página, nunca no `document`:
  com `cacheComponents`, a página anterior pode continuar escondida no DOM com os mesmos ids.
- O formulário de contato é `contact-form.tsx` (React Hook Form + Zod + Server Action
  `submitLead`); ao enviar, dispara `LEAD_SENT_EVENT` para o líquido subir.
- Portfólio: os casos ficam em `src/content/portfolio.ts` e as imagens em
  `public/portfolio/<slug>/`; leia sempre por `src/server/queries/portfolio.ts`. O estudo de caso usa
  `ensureStatic = "navigation"` para que um slug inexistente responda 404 de verdade.
- O logo do menu e o ícone do painel são gerados pelo motor `sdg-logo.js` (`pixel-logo.tsx`), no
  tema `site` registrado em `brand.ts`.

## Banco de dados (Supabase)

- Schema só por migration: `pnpm supabase migration new <nome>` e SQL em `supabase/migrations/`.
  Toda tabela nova tem RLS ligada e policies explícitas; funções `security definer` com
  `set search_path = ''`.
- Depois de mudar o schema: `pnpm db:types` (precisa do Supabase local) e teste em
  `supabase/tests/rls.test.ts`. Sem Docker, `pnpm test` roda esses testes no PGlite, com
  `supabase/tests/bootstrap.sql` imitando o que a plataforma fornece. O CI roda contra o Supabase
  real e falha se `src/types/database.ts` não bater com o schema (o arquivo gerado fica no
  artefato `supabase-job`).
- Papel e empresa do usuário vêm do `app_metadata` do Auth (só a service role escreve). Nunca
  conceda acesso por `user_metadata`.
- Clientes do Supabase em `src/lib/supabase`: `server.ts` (sessão por cookies, RLS do usuário),
  `client.ts` (navegador), `public.ts` (anônimo, sem cookies, para leituras públicas em
  `"use cache"`) e `admin.ts` (service role, só no servidor e depois de `requireRole`).
- Sem as variáveis do Supabase o site roda no modo conteúdo (`src/content`); quem lê dados deve
  manter esse caminho funcionando enquanto ele existir.

## Login e permissões

- Três camadas: `src/proxy.ts` (otimista, pelo JWT: renova a sessão e redireciona por papel),
  `requireRole("admin" | "client")` em toda página e Server Action protegida, e a RLS. Nunca
  confie só no proxy, e não faça a checagem no layout (layout não re-renderiza na navegação).
- `getCurrentUser()` (`src/lib/auth/current-user.ts`) lê cookies: chame dentro de `<Suspense>`.
  O admin passa em `requireRole("client")`.
- Regras puras (papel, destino de cada papel, `safeNext` contra open redirect, decisão do proxy)
  ficam em `src/lib/auth/roles.ts` e `access.ts`, com testes.
- Mensagens de login em `src/lib/auth/messages.ts`: nenhuma revela se o e-mail tem conta.
- Formulários: React Hook Form + o mesmo schema Zod na action, via `useActionForm`
  (`src/hooks/use-action-form.ts`), com `Field` e `Notice` de `components/ui`. A action devolve
  `FormResult` (`src/lib/validations/form-result.ts`).
- Links de e-mail (convite e recuperação) levam direto à página com `?token_hash=`, que só é
  gasto no envio do formulário. Templates em `supabase/templates/`; ao mudar, atualize também o
  painel do Supabase em produção.
- Testes de ponta a ponta que precisam do Supabase ficam em `describe("with Supabase")` e só
  rodam no job `supabase` do CI (`tests/e2e/support/supabase.ts` lê o Mailpit).

## Área do cliente

- Leituras em `src/server/queries/projects.ts`, sempre com o cliente da sessão (a RLS filtra) e
  depois de `requireRole("client")`. Projeto de outra empresa e projeto inexistente dão a mesma
  resposta (`notFound()`).
- Mídias do bucket privado `project-media` só por link assinado gerado no servidor; na tela, `<img>`
  comum (o otimizador do `next/image` guardaria cada link assinado como imagem nova).
- Datas formatadas no servidor (`src/lib/format.ts`, fuso de São Paulo), para o HTML bater com a
  hidratação. Rótulos de tipo, status e etapa em `src/lib/project-labels.ts`.
- Tempo real: `useProjectRealtime` só avisa que algo mudou e chama `router.refresh()`; os dados
  sempre vêm do servidor. Quando o painel admin gravar uma atualização com mídias, grave tudo numa
  transação só, ou o refresh pode chegar antes das mídias.
- `/design/area-do-cliente` mostra as telas com dados de exemplo (`sample.ts`), sem banco.
- Simular o admin avançando a etapa: `supabase/snippets/avancar-etapa.sql` (ver README).

## Painel admin

- Layout com a barra lateral (`components/admin/admin-nav.tsx`); as páginas não têm `<main>` nem
  `Container` próprios, o layout já dá os dois. Título com `PageHeader`, blocos com `Panel`.
- Leituras em `src/server/queries/admin.ts`, com a sessão do admin (RLS). A service role só entra
  para o que está no Auth (e-mail e último acesso dos usuários) e para convites.
- Página sem dados (formulário em branco) fica estática e confere o papel com
  `<Suspense fallback={null}><AdminGuard /></Suspense>`.
- Formulários que se repetem (convidar várias pessoas) usam `useActionForm(..., { resetOnSuccess })`.
- Ação que revalida a própria página: controle o "aguarde" com estado próprio que segue a promessa
  da action, não com `useTransition` (a transição espera a página re-renderizar e pode ficar
  presa). Ações difíceis de desfazer usam `ConfirmButton`.
- Portfólio: toda mutação chama `updateTag(PORTFOLIO_TAG)` (o site lê os casos em `"use cache"`).
  Imagens no bucket público `portfolio`, em `<id do caso>/`; `portfolioImageUrl` (`src/lib`) vale
  no servidor e no navegador.
- Upload: `prepareUpload` assina um upload por arquivo em `<projeto>/<atualização>/`, o navegador
  envia direto ao Storage (XHR, com progresso) e `publishUpdate` grava a atualização e as mídias
  juntas; se algo falhar no caminho, `discardUpload` apaga os arquivos.

## E-mails

- Templates em `src/emails/`, com as peças de `layout.tsx` (tabelas e estilos inline). Ali, e só ali,
  cores em hex: e-mail não lê as variáveis CSS do site.
- O pacote `@react-email/components` está descontinuado no npm; usamos só `@react-email/render`.
- Envie com `sendEmail` dentro de `after()` (`next/server`): nunca bloqueia nem desfaz a ação, e
  sem `RESEND_API_KEY` só registra o assunto. Endereços nunca vão para o log.
- Regras de quem recebe em `src/server/notifications.ts`; a janela de 2 horas do resumo é garantida
  no banco por `claim_project_digest`.

## API de integração

- `POST /api/integrations/updates` (`src/app/api/integrations/updates/route.ts`), documentada em
  `docs/integracao.md`. Token `sdg_…` gerado no admin; no banco só o SHA-256
  (`src/lib/integration/tokens.ts`).
- A API só publica no feed, com `publish_integration_update` (só a service role executa). Nada
  dela avança etapa nem cria marco; mantenha assim.
- Erros sempre como `{ error: { code, message } }`, mensagem em português. Arquivos somam no
  máximo 4 MB por chamada (limite de corpo da Vercel).

## SEO, acessibilidade e performance

- Página nova pública: metadata própria e, se for indexável, entrada em `src/app/sitemap.ts`;
  área privada: `robots: { index: false }` e o caminho em `src/app/robots.ts`.
- Página nova: inclua em `tests/e2e/a11y.spec.ts` (pública) ou `a11y-signed-in.spec.ts` (logada).
  Links dentro de texto são sublinhados (WCAG 1.4.1).
- Fontes: o layout raiz não pré-carrega as do design system (a landing não usa); pré-carregue só o
  que aparece na primeira tela. A imagem que for o LCP ganha `loading="eager"` e
  `fetchPriority="high"`. Animação de entrada de conteúdo grande parte de `opacity: 0.01`, não 0.
- Sem banner de cookies enquanto não houver cookie além do de sessão; se entrar analytics com
  cookie, o banner vira obrigatório.

## Estrutura de pastas

```text
sdg-site/
├── .github/                   # workflows/ci.yml, ISSUE_TEMPLATE/, pull_request_template.md
├── docs/                      # arquitetura, integração, runbook, referências de design
├── public/                    # imagens estáticas, portfólio; brand/ com os SVG do logo
├── scripts/                   # build-tokens.mjs, seed-media.mjs (prints de exemplo locais)
├── supabase/
│   ├── migrations/            # SQL versionado (tabelas, RLS, funções)
│   ├── templates/             # e-mails do Auth (convite, recuperação de senha)
│   ├── snippets/              # SQL útil no dia a dia local
│   ├── tests/                 # testes de RLS
│   ├── seed.sql
│   └── config.toml
├── src/
│   ├── app/
│   │   ├── (marketing)/       # /, /portfolio, /portfolio/[slug], /privacidade, /termos
│   │   ├── (auth)/            # /login, /convite, /recuperar-senha, /redefinir-senha
│   │   ├── (client)/painel/   # /painel, /painel/projetos/[id], /painel/conta
│   │   ├── (admin)/admin/     # clientes, projetos, portfólio, leads
│   │   ├── api/integrations/  # endpoint com token por projeto
│   │   ├── auth/callback/
│   │   ├── sitemap.ts
│   │   └── robots.ts
│   ├── components/
│   │   ├── ui/                # shadcn/ui tematizado
│   │   ├── layout/            # Header, Footer, Container, Logo
│   │   ├── marketing/         # seções da landing
│   │   ├── auth/              # cards e formulários de login, convite e senha
│   │   ├── client/            # StageTracker, UpdateFeed, MediaGallery
│   │   └── admin/
│   ├── server/
│   │   ├── actions/           # mutações (Server Actions)
│   │   └── queries/           # leituras
│   ├── lib/
│   │   ├── brand/             # sdg-logo.js (design system)
│   │   ├── supabase/          # server.ts, client.ts, admin.ts
│   │   ├── auth/              # getCurrentUser, requireRole, papéis, mensagens
│   │   ├── validations/       # schemas Zod
│   │   └── env.ts
│   ├── hooks/                 # useActionForm, useProjectRealtime
│   ├── emails/                # React Email
│   ├── content/               # dados iniciais do portfólio
│   ├── styles/                # tokens.json (cópia do design system) e tokens.css (gerado)
│   ├── types/                 # database.ts gerado
│   └── proxy.ts               # proteção de rotas (Next 16)
├── tests/e2e/                 # support/ com o acesso ao Supabase e ao Mailpit
├── CLAUDE.md
├── .env.example
└── README.md
```

Nomes de arquivo de componentes em kebab-case (`stage-tracker.tsx`), exportando PascalCase.

## GitHub

- `main` é produção e protegida; branches `feat/<assunto>`, `fix/<assunto>`, `chore/<assunto>`.
- Um assunto por PR, com o template preenchido e print quando mexer em tela. O outro sócio aprova.

@AGENTS.md
