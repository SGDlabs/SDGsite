# SDG Site — Arquitetura, Tarefas e Prompts

Oct 19, 2026 · @Gustavo Poletto

> Plano original do projeto (19 out. 2026), mantido como referência. O que mudou na construção
> está em "Como ficou", no fim, e o dia a dia está em [CLAUDE.md](../CLAUDE.md) e no
> [README](../README.md).

## Visão geral

O SDG Site é um único app Next.js com três áreas: o site público (vende a SDG), a área do cliente (acompanha o projeto contratado em tempo real) e o painel admin (você e o Daniel operam tudo).

| Área            | Quem acessa                           | O que tem                                                                                                               |
| --------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Site público    | Qualquer visitante                    | Landing page animada, serviços, softwares próprios, portfólio, processo de trabalho, contato                            |
| Área do cliente | Clientes com contrato (login e senha) | Lista dos projetos contratados, linha de 5 etapas com a bolinha pulsando na etapa atual, feed de prints, vídeos e notas |
| Painel admin    | Você e o Daniel                       | Clientes, projetos, avançar etapa, postar atualização com mídia, portfólio, leads do formulário                         |

A conexão com o projeto do cliente acontece por uma API de integração: cada projeto ganha um token, e o repositório do cliente (via GitHub Actions) envia prints e status de deploy direto para o feed. O cliente vê a mudança na hora, sem recarregar a página.

Decisão de produto recomendada: a conta do cliente é criada por convite, não por cadastro aberto. Vocês cadastram o projeto, informam o e-mail do cliente, ele recebe o convite e define a senha. Isso evita contas soltas de quem não contratou nada.

Etapas padrão sugeridas (editáveis por projeto):

1. Organização de ideias (briefing, escopo, cronograma)
2. Design (UI/UX e protótipo)
3. Desenvolvimento
4. Testes e homologação com o cliente
5. Entrega e publicação

Identidade definida: o nome da marca é SDG Labs, com slogan "A fórmula do seu software.", paleta, tipografia e o logo pixel animado no [design system SDG Labs](https://claude.ai/artifact/KazpoQKPVh51VLdQpHeM8z). Os prompts 3 e 4 já trazem esses valores.

## Stack e decisões

Recomendação: um único app Next.js (front e back juntos) com Supabase cuidando de banco, login, tempo real e arquivos. Para dois sócios, isso é o menor número de serviços que entrega tudo o que vocês descreveram.

| Camada      | Escolha                                                                                 | Por quê                                                                                                                                                     |
| ----------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework   | Next.js 16 (App Router), TypeScript, pnpm                                               | Linha estável atual ([blog do Next.js](https://nextjs.org/blog?page=1)); Server Components e Server Actions fazem o papel do back-end sem servidor separado |
| Estilo e UI | Tailwind CSS v4 + shadcn/ui                                                             | Tokens da paleta viram variáveis CSS; componentes acessíveis e editáveis no próprio repo                                                                    |
| Animação    | Motion (Framer Motion) + CSS; GSAP só se a animação da landing exigir timeline complexa | Cobre a bolinha pulsando, transições de etapa e a hero animada                                                                                              |
| Banco       | Supabase Postgres (região São Paulo, sa-east-1)                                         | Postgres de verdade, com Row Level Security: cada cliente só lê os próprios projetos                                                                        |
| Login       | Supabase Auth (e-mail e senha, convite, recuperação)                                    | Convite por e-mail já vem pronto                                                                                                                            |
| Tempo real  | Supabase Realtime                                                                       | O painel do cliente escuta mudanças de etapa e novas atualizações sem refresh                                                                               |
| Arquivos    | Supabase Storage (buckets privados com URL assinada)                                    | Prints e vídeos do cliente não ficam públicos                                                                                                               |
| Formulários | React Hook Form + Zod                                                                   | A mesma validação Zod roda no cliente e no servidor                                                                                                         |
| E-mail      | Resend + React Email                                                                    | Convite, "etapa concluída", "nova atualização"                                                                                                              |
| Deploy      | Vercel (preview por pull request)                                                       | Integração nativa com GitHub e Next.js                                                                                                                      |
| Qualidade   | ESLint, Prettier, Husky, commitlint, Vitest, Playwright, GitHub Actions                 | CI barra PR quebrado antes do merge                                                                                                                         |

Alternativa, se preferirem não depender do Supabase: Neon (Postgres) + Drizzle ORM + Auth.js + Pusher ou Ably para tempo real + Cloudflare R2 para arquivos. Funciona igual, mas são quatro serviços em vez de um.

Vídeos grandes: o Supabase Storage aguenta vídeos curtos de demonstração. Se vocês forem mandar vídeos longos com frequência, vale trocar só essa parte por Mux ou Cloudflare Stream depois.

## Arquitetura

Tudo roda num repositório e num deploy só; as três áreas são route groups do mesmo app, e o Supabase é a única dependência de dados.

```text
   visitante            cliente               sócios (admin)       repositório do cliente
       │                   │                        │                        │
       ▼                   ▼                        ▼                        ▼
 ┌───────────┐     ┌────────────────┐      ┌──────────────┐     ┌──────────────────────────┐
 │ site      │     │ área do        │      │ painel admin │     │ API de integração        │
 │ público   │     │ cliente        │      │              │     │ POST /api/integrations/… │
 └─────┬─────┘     └───────┬────────┘      └──────┬───────┘     └────────────┬─────────────┘
       └───────────────────┴──── Server Actions / Route Handlers ───────────┘
                           (Zod + papel do usuário)  │
                                                     ▼
              Supabase: Postgres (RLS) · Auth · Realtime · Storage
```

O site, o admin e a API passam pela mesma camada de Server Actions, que valida com Zod e checa o papel do usuário antes de tocar no banco. A área do cliente carrega pelo servidor e depois só escuta o Realtime, por isso a bolinha anda sozinha quando vocês avançam a etapa.

Estrutura de pastas do repositório:

```text
sdg-site/
├── .github/
│   ├── workflows/ci.yml
│   ├── ISSUE_TEMPLATE/
│   └── pull_request_template.md
├── docs/                      # arquitetura, integração, runbook, referências de design
├── public/                    # imagens estáticas, portfólio, favicon
├── supabase/
│   ├── migrations/            # SQL versionado (tabelas, RLS, funções)
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
│   │   ├── layout/            # Header, Footer, Container
│   │   ├── marketing/         # seções da landing
│   │   ├── client/            # StageTracker, UpdateFeed, MediaGallery
│   │   └── admin/
│   ├── server/
│   │   ├── actions/           # mutações (Server Actions)
│   │   └── queries/           # leituras
│   ├── lib/
│   │   ├── supabase/          # server.ts, client.ts, admin.ts
│   │   ├── auth/              # getCurrentUser, requireRole
│   │   ├── validations/       # schemas Zod
│   │   └── env.ts
│   ├── hooks/                 # useProjectRealtime
│   ├── emails/                # React Email
│   ├── content/               # dados iniciais do portfólio
│   ├── styles/tokens.css
│   └── types/                 # database.ts gerado
├── tests/e2e/
├── proxy.ts                   # proteção de rotas (Next 16)
├── CLAUDE.md
├── .env.example
└── README.md
```

## Modelo de dados

Nove tabelas cobrem o site inteiro; o coração da área do cliente é projeto → etapas → atualizações → mídias.

| Tabela            | Campos principais                                                                                                                                                | Observação                                           |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `profiles`        | id (= auth.users.id), full\_name, avatar\_url, role (`admin` / `client`), client\_id                                                                             | Criado por trigger quando o usuário aceita o convite |
| `clients`         | id, name, cnpj\_cpf, contact\_email, phone, created\_at                                                                                                          | A empresa contratante; pode ter vários usuários      |
| `projects`        | id, client\_id, name, type (`site` / `app` / `sistema`), status (`ativo` / `pausado` / `concluido`), current\_stage\_position, started\_at, due\_at, cover\_path | `current_stage_position` é o que faz a bolinha pular |
| `project_stages`  | id, project\_id, position (1–5), title, description, status (`pendente` / `em_andamento` / `concluida`), started\_at, completed\_at                              | Criadas a partir do template de 5 etapas             |
| `project_updates` | id, project\_id, stage\_id, author\_id, kind (`nota` / `print` / `video` / `deploy` / `marco`), title, body, source (`manual` / `api` / `github`), created\_at   | O feed que o cliente vê                              |
| `update_media`    | id, update\_id, storage\_path, mime\_type, width, height, duration\_s                                                                                            | Prints e vídeos no bucket privado                    |
| `project_tokens`  | id, project\_id, label, token\_hash, last\_used\_at, revoked\_at                                                                                                 | Token da API de integração; só o hash fica salvo     |
| `portfolio_items` | id, slug, title, summary, body, category, stack (text\[\]), cover\_path, gallery, live\_url, featured, published, sort\_order                                    | Gerenciado no admin                                  |
| `leads`           | id, name, email, phone, company, message, service\_interest, created\_at, status                                                                                 | Formulário de contato da landing                     |

Regras de acesso (RLS):

- Admin lê e escreve tudo.
- Cliente lê só `projects`, `project_stages`, `project_updates` e `update_media` onde `project.client_id` = seu `client_id`. Não escreve nada.
- Visitante lê só `portfolio_items` com `published = true` e insere em `leads`.
- `project_tokens` nunca é lido pelo navegador; só o servidor acessa, com a service role key.

Avançar etapa = uma função no banco (`advance_project_stage`) que, numa transação só, conclui a etapa atual, inicia a próxima, atualiza `current_stage_position` e cria uma atualização do tipo `marco`.

## Lista de tarefas

São 10 fases; as fases 1 a 4 colocam o site público no ar sozinhas, e a área do cliente vem por cima sem refazer nada. Cada fase tem um prompt correspondente na seção seguinte.

**Fase 0 — Organização (antes do código)**

- [ ] Definir domínio (ex.: sdg.dev.br / sdg.com.br) e registrar
- [ ] Fechar paleta, tipografia e a referência da animação da landing
- [ ] Escrever textos base: quem somos, serviços, softwares próprios, processo
- [ ] Criar contas: Vercel, Supabase, Resend (conectadas à organização do GitHub)

**Fase 1 — Setup do repositório** (prompts 0, 1 e 2)

- [ ] Criar o app Next.js 16 com TypeScript, Tailwind v4, ESLint, pnpm
- [ ] Estrutura de pastas da seção Arquitetura
- [ ] Prettier, Husky, lint-staged, commitlint
- [ ] CLAUDE.md / AGENTS.md com o contexto do projeto
- [ ] CI no GitHub Actions (lint, typecheck, testes, build)
- [ ] Templates de PR e issue, proteção da branch `main`
- [ ] Conectar o repositório na Vercel (preview por PR)

**Fase 2 — Design system** (prompt 3)

- [ ] Tokens de cor da paleta (claro e escuro) em variáveis CSS
- [ ] Fontes via `next/font`
- [ ] shadcn/ui instalado e tematizado
- [ ] Componentes base: Button, Container, Section, Badge, Card, Header, Footer
- [ ] Página `/design` interna mostrando todos os componentes

**Fase 3 — Landing page** (prompt 4)

- [ ] Hero com a animação de vocês
- [ ] Seções: serviços, softwares próprios, processo em 5 etapas, portfólio em destaque, depoimentos, sobre, CTA
- [ ] Formulário de contato gravando em `leads` e avisando por e-mail
- [ ] Responsivo, `prefers-reduced-motion` respeitado

**Fase 4 — Portfólio** (prompt 5)

- [ ] `/portfolio` com filtro por categoria
- [ ] `/portfolio/[slug]` com galeria, stack e link
- [ ] Começar com dados em arquivo; migrar para o banco na fase 5
- [ ] Cadastrar os trabalhos que vocês já fizeram

**Fase 5 — Banco e login** (prompts 6 e 7)

- [ ] Projeto Supabase em sa-east-1, Supabase CLI local
- [ ] Migrations das 9 tabelas, RLS, função `advance_project_stage`, seed
- [ ] Tipos TypeScript gerados do banco
- [ ] Login, aceitar convite / definir senha, recuperar senha, sair
- [ ] Proteção de rotas por papel (cliente e admin)

**Fase 6 — Área do cliente** (prompt 8)

- [ ] `/painel` com os projetos do cliente
- [ ] `/painel/projetos/[id]` com a linha de 5 etapas e a bolinha pulsando
- [ ] Feed de atualizações com prints (lightbox) e vídeos (player)
- [ ] Atualização em tempo real com Supabase Realtime

**Fase 7 — Painel admin** (prompt 9)

- [ ] CRUD de clientes e convite de usuários
- [ ] CRUD de projetos com template de etapas
- [ ] Botão "Avançar etapa" e postagem de atualização com upload
- [ ] Gestão do portfólio e dos leads

**Fase 8 — Integração com os projetos dos clientes** (prompt 10)

- [ ] Tokens por projeto (gerar, revogar)
- [ ] Endpoint `POST /api/integrations/updates` com upload de mídia
- [ ] GitHub Action modelo para o repositório do cliente: print automático a cada deploy

**Fase 9 — Notificações** (prompt 11)

- [ ] E-mails: convite, etapa concluída, nova atualização (com opção de silenciar)

**Fase 10 — Lançamento** (prompts 12 e 13)

- [ ] SEO (metadata, Open Graph, sitemap, robots), Lighthouse ≥ 90
- [ ] Política de privacidade e termos (LGPD), banner de cookies se usarem analytics com cookie
- [ ] Testes E2E dos fluxos críticos
- [ ] Domínio na Vercel, variáveis de produção, backups do banco

## Prompts

Use na ordem, um por vez, com o repositório aberto no Claude Code (ou em outra IA de código). Ao fim de cada prompt: revise, rode `pnpm dev`, faça o commit e abra o PR antes de ir para o próximo. Trechos entre colchetes, como `[COLE AQUI]`, vocês preenchem.

### Prompt 0 — Contexto permanente do projeto

Rode primeiro. Ele cria o arquivo que a IA relê em toda sessão, então os prompts seguintes podem ser curtos.

```text
Crie na raiz do repositório um arquivo CLAUDE.md (e um AGENTS.md com o mesmo conteúdo, ou que aponte para ele) com o contexto permanente deste projeto:

Projeto: SDG Site, site da SDG, software house de dois sócios (eu e o Daniel).
Objetivo: (1) site público com landing page animada, serviços, softwares próprios, portfólio e contato; (2) área do cliente com login, onde quem contratou acompanha o projeto em 5 etapas, com a etapa atual marcada por uma bolinha pulsando e um feed de prints, vídeos e notas em tempo real; (3) painel admin para os sócios.
Idioma da interface: português do Brasil. Código, nomes de variáveis e commits: inglês.
Stack: Next.js 16 App Router + TypeScript estrito, pnpm, Tailwind CSS v4, shadcn/ui, Motion (Framer Motion), Supabase (Postgres, Auth, Realtime, Storage), React Hook Form + Zod, Resend + React Email, Vitest, Playwright, deploy na Vercel.
Regras:
- Server Components por padrão; "use client" só quando houver estado, efeito ou evento.
- Mutações via Server Actions em src/server/actions, sempre validando com Zod e checando o papel do usuário.
- Leituras em src/server/queries.
- Nunca expor a SUPABASE_SERVICE_ROLE_KEY ao navegador.
- Toda tabela tem RLS ligada.
- Cores só via tokens CSS (nada de hex solto nos componentes).
- Animações respeitam prefers-reduced-motion.
- Commits no padrão Conventional Commits.
Estrutura de pastas: [cole a árvore da seção "Arquitetura" deste documento].
Não crie código ainda, só esses arquivos.
```

### Prompt 1 — Setup do repositório

```text
Inicialize o projeto neste repositório vazio:
1. create-next-app@latest com TypeScript, Tailwind CSS, ESLint, App Router, pasta src/, alias @/*, pnpm.
2. Ative "strict": true e "noUncheckedIndexedAccess": true no tsconfig.
3. Adicione Prettier (com prettier-plugin-tailwindcss), Husky + lint-staged (lint e format nos arquivos alterados) e commitlint com config-conventional.
4. Scripts no package.json: dev, build, start, lint, typecheck, format, test, test:e2e.
5. Crie a estrutura de pastas descrita no CLAUDE.md com arquivos .gitkeep onde estiver vazia, e os route groups (marketing), (auth), (client) e (admin) com page.tsx de placeholder.
6. Crie .env.example com: NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, EMAIL_FROM.
7. Valide as variáveis de ambiente com Zod em src/lib/env.ts.
8. README.md em português: o que é o projeto, como rodar, scripts, variáveis de ambiente, fluxo de branches.
Ao final rode lint, typecheck e build e corrija o que falhar.
```

### Prompt 2 — GitHub e CI

```text
Configure a parte de GitHub do repositório:
1. .github/workflows/ci.yml rodando em pull_request e push na main: setup do pnpm com cache, install, lint, typecheck, test e build. Use Node LTS.
2. .github/pull_request_template.md com: o que mudou, como testar, prints (se houver UI), checklist (lint, typecheck, testes, responsivo, reduced-motion).
3. .github/ISSUE_TEMPLATE com dois modelos: feature e bug.
4. .github/dependabot.yml semanal para npm e GitHub Actions.
5. Documente no README a convenção de branches (main protegida; feat/*, fix/*, chore/*) e de commits.
Depois me diga, em passos, como proteger a branch main no GitHub (exigir PR, CI verde e 1 aprovação).
```

### Prompt 3 — Design system

Valores tirados do [design system SDG Labs](https://claude.ai/artifact/KazpoQKPVh51VLdQpHeM8z); baixem de lá os SVG do logo e o `sdg-logo.js` e coloquem em `public/brand/` e `src/lib/brand/` antes de colar.

```text
Monte o design system da SDG Labs (nome da marca: SDG Labs; slogan: "A fórmula do seu software.").

Paleta base: grafite #353535, petroleo #3C6E71, indigo #284B63, nevoa #D9D9D9, branco #FFFFFF.
Tokens semânticos (claro / escuro):
- surface #FFFFFF / #353535 · surface-alt #F2F2F2 / #2A2A2A · surface-inverse #353535 / #FFFFFF
- ink #353535 / #FFFFFF · ink-muted #5A5A5A / #D9D9D9 · ink-inverse #FFFFFF / #353535
- accent #3C6E71 / #6FA8AC · on-accent #FFFFFF / #1E1E1E
- brand #284B63 / #8FB3CC · on-brand #FFFFFF / #1E1E1E
- border #D9D9D9 / #4A4A4A · border-strong #767676 / #8C8C8C · focus = accent
- stage-done = accent · stage-current = accent · stage-todo #9A9A9A / #7A7A7A
Fontes (next/font/google): títulos Space Grotesk; texto IBM Plex Sans; pixel Silkscreen (só eyebrow e selos, caixa alta); código IBM Plex Mono.
Escala: display 56/60 700, h1 40/48 700, h2 28/36 600, h3 20/28 600, lead 18/28, body 16/24, small 14/20, label 14/20 600, eyebrow 12/16 Silkscreen, code 14/20.
Espaço: grid de 4px (4, 8, 12, 16, 24, 32, 48, 96). Raios: 0 (elementos pixel), 4 (botões, campos), 8 (cards), 999 (bolinhas de etapa).
Sombra única: shadow-pixel = 4px 4px 0 0 #353535 (escuro: #000), sem desfoque. Sem gradientes.
Tema: claro e escuro, alternando por data-theme no <html> e respeitando prefers-color-scheme.

Tarefas:
1. Tokens em src/styles/tokens.css como variáveis CSS, mapeados no @theme do Tailwind v4.
2. shadcn/ui tematizado com esses tokens (botão primário = accent, foco = anel sólido de 2px em focus com 2px de afastamento).
3. Componente <Logo variant="vertical|horizontal|icon" /> usando os SVG de public/brand/ (versão -light ou -dark conforme o tema), com image-rendering: pixelated.
4. Componentes base em src/components/ui e src/components/layout: Button (primary, secondary, ghost, outline), Container, Section, Heading, Eyebrow (Silkscreen), Badge/PixelTag, Card, Header com logo horizontal e menu mobile, Footer com slogan.
5. Favicon e ícones do app a partir de sdglabs-icon-light.svg.
6. Página interna /design (noindex) com cores, tipografia e todos os componentes.
7. Confirme que todos os pares de texto passam 4,5:1 nos dois temas.
```

### Prompt 4 — Landing page e animação

A animação já está pronta em `sdg-logo.js` (canvas, sem dependências); o prompt só a encaixa na hero.

```text
Construa a landing page em src/app/(marketing)/page.tsx usando o design system.

Animação da hero: use src/lib/brand/sdg-logo.js (já pronto). Crie src/components/marketing/hero-logo.tsx ("use client") que monta um <canvas> e chama SDGLogo.mount(canvas, { theme, background: false }).play() quando a hero entra na tela (IntersectionObserver, uma vez por visita via sessionStorage). O tema vem do data-theme do <html>; troque com player.setTheme ao mudar. Sequência (~5s): o frasco pixelado borbulha, inclina para a esquerda, tomba para a direita, o líquido petróleo vaza em pixels e o nome SDG LABS cresce de dentro da poça; termina no logo horizontal. Com prefers-reduced-motion, play() já desenha o quadro final. O título, o slogan e o CTA ficam visíveis desde o início, sem esperar a animação.

Seções, cada uma componente próprio em src/components/marketing:
1. Hero: animação do logo, título "A fórmula do seu software.", subtítulo "Sites, aplicativos e sistemas sob medida, com o andamento visível em tempo real.", CTAs "Fale com a gente" e "Ver portfólio".
2. Serviços: sites, aplicativos, sistemas sob medida [ajuste], cada card com Eyebrow "LAB 01", "LAB 02"…
3. Nossos softwares: cards dos produtos próprios [liste-os].
4. Como trabalhamos: as 5 etapas com o StageTracker (a mesma bolinha pulsante da área do cliente), etapa 3 marcada como exemplo.
5. Portfólio em destaque (3 a 6 itens de src/content/portfolio por enquanto).
6. Depoimentos (placeholder).
7. Sobre nós: os dois sócios.
8. CTA final em surface-inverse + formulário de contato (nome, e-mail, telefone, empresa, serviço de interesse, mensagem) com React Hook Form + Zod; a Server Action só valida e loga até o prompt 6.
9. Footer com logo horizontal e slogan.
Voz: primeira pessoa do plural, cliente tratado por "você", frases curtas, no máximo uma metáfora de laboratório por seção, sem emoji. Decoração: quadrados de 8px em petroleo ou nevoa, nada de gradiente. Entradas ao rolar: 8–16px + opacidade, uma vez. Mobile primeiro. Metadata e Open Graph com o logo vertical.
```

### Prompt 5 — Portfólio

```text
Crie o portfólio:
1. Tipo PortfolioItem em src/types (slug, title, summary, body, category, stack[], cover, gallery[], liveUrl, featured, publishedAt).
2. Dados iniciais em src/content/portfolio.ts com 3 itens de exemplo [depois troco pelos reais].
3. Uma função getPortfolioItems / getPortfolioItem em src/server/queries/portfolio.ts — hoje lê do arquivo; no prompt 6 passa a ler do Supabase sem mudar quem a chama.
4. /portfolio: grade com filtro por categoria (via searchParams, sem JS obrigatório).
5. /portfolio/[slug]: capa, descrição, stack em badges, galeria com lightbox, link para o projeto no ar, próximo/anterior. generateStaticParams e generateMetadata.
6. Imagens com next/image, em public/portfolio/<slug>/.
```

### Prompt 6 — Banco de dados (Supabase)

Antes: criem o projeto no Supabase (região South America / São Paulo) e coloquem as chaves no `.env.local`.

```text
Configure o Supabase no projeto:
1. Supabase CLI com pasta supabase/ (config.toml, migrations/, seed.sql) para rodar local com Docker.
2. Clientes em src/lib/supabase: server.ts (cookies, para Server Components e Actions), client.ts (navegador), admin.ts (service role, só servidor, com import "server-only").
3. Migration com as tabelas: profiles, clients, projects, project_stages, project_updates, update_media, project_tokens, portfolio_items, leads — campos conforme a seção "Modelo de dados" do documento de arquitetura [cole a tabela aqui]. Use enums do Postgres para role, type, status e kind. Timestamps com timezone, índices nas FKs.
4. Trigger que cria o profile quando um usuário é criado em auth.users, lendo role e client_id do raw_user_meta_data.
5. Funções helper: is_admin() e current_client_id().
6. RLS em todas as tabelas: admin tudo; cliente só leitura dos próprios projetos, etapas, atualizações e mídias; anônimo lê portfolio_items publicados e insere em leads; project_tokens sem acesso pelo navegador.
7. Função advance_project_stage(project_id) (security definer, checando is_admin) que em uma transação conclui a etapa atual, inicia a próxima, atualiza current_stage_position e insere um project_update do tipo 'marco'.
8. Função create_project_with_stages(...) que cria o projeto e as 5 etapas padrão: Organização de ideias, Design, Desenvolvimento, Testes e homologação, Entrega e publicação.
9. Buckets de Storage: 'portfolio' (público) e 'project-media' (privado, com policies iguais às de update_media).
10. Ative o Realtime em projects, project_stages e project_updates.
11. Seed com 1 admin, 1 cliente, 1 projeto na etapa 2 com algumas atualizações, e os itens de portfólio.
12. Gere os tipos em src/types/database.ts e um script "db:types".
13. Troque a fonte do portfólio (prompt 5) e do formulário de contato (prompt 4) para o banco.
Escreva testes SQL ou Vitest provando que um cliente NÃO consegue ler o projeto de outro cliente.
```

### Prompt 7 — Login e permissões

```text
Implemente a autenticação com Supabase Auth (@supabase/ssr):
1. Páginas em (auth): /login (e-mail e senha), /recuperar-senha, /redefinir-senha, /convite (o cliente define a senha ao aceitar o convite). Sem página de cadastro aberto.
2. Rota /auth/callback para trocar o código por sessão.
3. Proteção de rotas no proxy (proxy.ts no Next 16; se a versão usar middleware.ts, use ele): renova a sessão; /painel/** exige usuário logado; /admin/** exige role admin; usuário logado em /login vai para /painel ou /admin conforme o papel.
4. Helper getCurrentUser() em src/lib/auth que devolve user + profile, e requireRole('admin' | 'client') para usar em Server Components e Actions.
5. Server Action inviteClientUser(clientId, email, name) só para admin, usando auth.admin.inviteUserByEmail com role e client_id no metadata.
6. Menu do usuário no header (avatar, nome, sair).
Mensagens de erro em português, sem revelar se o e-mail existe.
```

### Prompt 8 — Área do cliente e a linha de etapas

```text
Construa a área do cliente em src/app/(client)/painel:
1. /painel: cards dos projetos do cliente com nome, tipo, etapa atual ("Etapa 2 de 5 — Design"), barra de progresso e data da última atualização.
2. /painel/projetos/[id]:
   a. Componente StageTracker em src/components/client/stage-tracker.tsx: 5 bolinhas ligadas por uma linha (horizontal no desktop, vertical no mobile). Concluídas: preenchidas com check. Atual: cor de acento com anel pulsando em loop (Motion ou keyframes CSS; parado com prefers-reduced-motion). Futuras: contorno apagado. A linha entre as concluídas fica preenchida. Ao clicar numa etapa, mostra descrição e datas.
   b. Quando a etapa muda, anima a transição: a bolinha anterior vira check, a linha "enche" até a próxima, e a próxima começa a pulsar.
   c. Feed de atualizações em ordem cronológica inversa, filtrável por etapa e por tipo (nota, print, vídeo, deploy, marco). Prints em grade com lightbox; vídeos com player nativo; mídias via URL assinada do Storage geradas no servidor.
3. Tempo real: um hook useProjectRealtime(projectId) que assina, via Supabase Realtime, mudanças em projects, project_stages e project_updates daquele projeto, e atualiza a tela sem refresh (com toast "Nova atualização"). Mantenha o carregamento inicial no servidor e só a assinatura no cliente.
4. Estados de vazio, carregando (skeleton) e erro.
Use os dados do seed para testar e me mostre como simular uma mudança de etapa pelo SQL para ver o pulso andar ao vivo.
```

### Prompt 9 — Painel admin

```text
Construa o painel admin em src/app/(admin)/admin, só para role admin:
1. Layout com sidebar: Visão geral, Clientes, Projetos, Portfólio, Leads.
2. Visão geral: projetos ativos com etapa atual, leads novos, últimas atualizações postadas.
3. Clientes: lista, criar/editar, ver usuários do cliente e botão "Convidar usuário" (Server Action do prompt 7).
4. Projetos: lista com filtros; criar (usa create_project_with_stages); editar nome, prazos e descrição de cada etapa; botão "Concluir etapa e avançar" com confirmação (chama advance_project_stage); pausar/concluir projeto.
5. Postar atualização: título, texto, tipo, etapa, upload de várias imagens e vídeos direto do navegador para o bucket project-media (upload assinado), com barra de progresso.
6. Portfólio: CRUD completo com upload de capa e galeria, publicar/despublicar e ordenar.
7. Leads: tabela com status (novo, em contato, fechado, perdido).
Toda mutação em Server Action com Zod + requireRole('admin') e revalidatePath.
```

### Prompt 10 — Integração com o projeto do cliente

```text
Crie a API de integração para os projetos dos clientes mandarem atualizações automáticas:
1. No admin, na página do projeto: aba "Integração" para gerar token (mostra o token uma única vez, salva só o hash SHA-256 em project_tokens), listar e revogar.
2. Route Handler POST /api/integrations/updates: autentica por "Authorization: Bearer <token>", identifica o projeto pelo token, aceita JSON {kind, title, body, stage?} ou multipart com arquivos (imagens e vídeos até [X] MB), grava com a service role, atualiza last_used_at. Rate limit simples por token. Respostas de erro claras.
3. A API só publica atualizações; avançar etapa continua exclusivo do admin. Documente isso.
4. Em docs/integracao.md: como usar com curl e um workflow de exemplo (.github/workflows/sdg-update.yml) para colocar no repositório DO CLIENTE, que a cada deploy na Vercel: roda Playwright, tira prints de [lista de URLs] em desktop e mobile e envia para a API como um update do tipo "deploy" com o link do preview.
5. Testes do endpoint: token válido, revogado, inexistente, arquivo grande demais.
```

### Prompt 11 — E-mails

```text
Configure e-mails transacionais com Resend + React Email em src/emails:
1. Template base com a marca da SDG.
2. Convite de acesso (substitui o e-mail padrão do Supabase via SMTP do Resend, ou envia o nosso link próprio).
3. "Etapa concluída": disparado por advance_project_stage, mostra a etapa concluída e a nova atual.
4. "Nova atualização": no máximo um e-mail por projeto a cada [2] horas, agrupando as novidades.
5. Aviso interno para os sócios quando entrar um lead.
6. Preferência do cliente em /painel/conta para silenciar e-mails de atualização.
```

### Prompt 12 — SEO, LGPD, acessibilidade e testes

```text
Prepare o site para produção:
1. SEO: metadata por página, Open Graph com imagem gerada (opengraph-image.tsx), sitemap.ts (inclui portfólio publicado), robots.ts (bloqueia /painel, /admin, /design), dados estruturados Organization.
2. Performance: imagens otimizadas, animação da hero sem travar o LCP, fontes com display swap. Meta: Lighthouse ≥ 90 em mobile.
3. Acessibilidade: navegação por teclado, foco visível, aria nos componentes interativos, StageTracker anunciando "Etapa 2 de 5, em andamento".
4. LGPD: páginas /privacidade e /termos [rascunho, revisar com advogado], consentimento no formulário de contato, banner de cookies só se usarmos analytics com cookies.
5. Analytics: Vercel Analytics e Speed Insights.
6. Testes E2E com Playwright: envio do formulário, login do cliente, cliente vê só o próprio projeto, admin avança etapa e o cliente vê a mudança.
```

### Prompt 13 — Deploy

```text
Me guie e prepare o que for código para o deploy:
1. Checklist das variáveis de ambiente na Vercel (Production e Preview) e no Supabase.
2. URLs de redirect do Supabase Auth para produção e para os previews da Vercel.
3. Domínio próprio na Vercel e no Resend (SPF/DKIM).
4. Migrations aplicadas em produção via GitHub Action (supabase db push) só na main.
5. Backups e um runbook curto em docs/runbook.md: como restaurar, como revogar um token vazado, como dar acesso a um novo cliente.
```

## Convenções do GitHub

Regra única: nada entra na `main` sem PR com CI verde e a aprovação do outro sócio.

| Item     | Convenção                                                                                                                       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Branches | `main` (produção, protegida); `feat/<assunto>`, `fix/<assunto>`, `chore/<assunto>`                                              |
| Commits  | Conventional Commits em inglês: `feat: add stage tracker`, `fix: signed url expiry`                                             |
| PR       | Um assunto por PR, template preenchido, print ou vídeo quando mexer em tela                                                     |
| Revisão  | O outro sócio aprova; a Vercel gera um preview por PR para testar no celular                                                    |
| Issues   | Uma issue por item da lista de tarefas, com label da fase (`fase-1` … `fase-10`) e de área (`front`, `back`, `infra`, `design`) |
| Quadro   | GitHub Projects com colunas A fazer, Fazendo, Em revisão, Feito                                                                 |
| Versões  | Tag `v0.x` a cada fase entregue; `v1.0.0` no lançamento                                                                         |
| Segredos | Só em `.env.local`, Vercel e GitHub Secrets; nunca no código                                                                    |

Para transformar a lista de tarefas em issues de uma vez (exige o GitHub CLI `gh` autenticado):

```text
Leia a seção "Lista de tarefas" abaixo e, usando o GitHub CLI (gh), no repositório [ORG]/sdg-site:
1. Crie as labels fase-0 a fase-10 e front, back, infra, design, conteudo.
2. Crie um milestone por fase.
3. Crie uma issue por item, com título curto, descrição do que é "pronto", label da fase, label de área e milestone.
4. Crie um GitHub Project "SDG Site" com as colunas A fazer, Fazendo, Em revisão, Feito e adicione todas as issues.
Mostre o plano e espere minha confirmação antes de criar.
[cole aqui a lista de tarefas]
```

## Como ficou

Os prompts 0 a 13 viraram os PRs #1 a #18. Onde a construção se afastou do plano, e por quê:

- **Papel e empresa do usuário** vêm do `app_metadata` do Auth, não do `user_metadata`: o
  `user_metadata` o próprio usuário pode editar, e seria uma brecha.
- **Links de convite e de nova senha** levam direto à página com o `token_hash`, que só é gasto
  quando o formulário é enviado: antivírus de e-mail que abrem links não queimam o convite.
- **Etapas avançadas** pela função `advance_project_stage`; **atualizações com mídia** gravadas
  numa transação só (`publish_project_update`), para o Realtime nunca entregar uma atualização sem
  os arquivos.
- **E-mails** com `@react-email/render` e componentes próprios: o pacote
  `@react-email/components` foi descontinuado no npm. O resumo de novidades respeita a janela de
  2 horas no banco (`claim_project_digest`) e roda de hora em hora pelo GitHub Actions.
- **API de integração**: até 4 MB de arquivos por chamada (limite de corpo da Vercel).
- **Landing**: reproduz o protótipo aprovado, com visual próprio (fora dos tokens do design
  system). O Lighthouse no celular ficou abaixo de 90 na landing por causa da fonte display, dos
  canvas e das animações do protótipo; as opções estão no PR #17.
- **Deploy**: guia em [deploy.md](deploy.md) e procedimentos em [runbook.md](runbook.md).
