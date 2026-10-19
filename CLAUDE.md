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
- Proteção de rotas fica em `proxy.ts` (o antigo middleware).
- `LayoutProps` / `PageProps` são tipos gerados: `pnpm typecheck` roda `next typegen` antes do `tsc`.

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

## Estrutura de pastas

```text
sdg-site/
├── .github/                   # workflows/ci.yml, ISSUE_TEMPLATE/, pull_request_template.md
├── docs/                      # arquitetura, integração, runbook, referências de design
├── public/                    # imagens estáticas, portfólio; brand/ com os SVG do logo
├── scripts/                   # build-tokens.mjs
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
│   │   ├── layout/            # Header, Footer, Container, Logo
│   │   ├── marketing/         # seções da landing
│   │   ├── client/            # StageTracker, UpdateFeed, MediaGallery
│   │   └── admin/
│   ├── server/
│   │   ├── actions/           # mutações (Server Actions)
│   │   └── queries/           # leituras
│   ├── lib/
│   │   ├── brand/             # sdg-logo.js (design system)
│   │   ├── supabase/          # server.ts, client.ts, admin.ts
│   │   ├── auth/              # getCurrentUser, requireRole
│   │   ├── validations/       # schemas Zod
│   │   └── env.ts
│   ├── hooks/                 # useProjectRealtime
│   ├── emails/                # React Email
│   ├── content/               # dados iniciais do portfólio
│   ├── styles/                # tokens.json (cópia do design system) e tokens.css (gerado)
│   └── types/                 # database.ts gerado
├── tests/e2e/
├── proxy.ts                   # proteção de rotas (Next 16)
├── CLAUDE.md
├── .env.example
└── README.md
```

Nomes de arquivo de componentes em kebab-case (`stage-tracker.tsx`), exportando PascalCase.

## GitHub

- `main` é produção e protegida; branches `feat/<assunto>`, `fix/<assunto>`, `chore/<assunto>`.
- Um assunto por PR, com o template preenchido e print quando mexer em tela. O outro sócio aprova.

@AGENTS.md
