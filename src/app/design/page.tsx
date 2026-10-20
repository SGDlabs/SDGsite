import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { StageTracker, type Stage } from "@/components/client/stage-tracker";
import { Container } from "@/components/layout/container";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Logo } from "@/components/layout/logo";
import { Section } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Heading } from "@/components/ui/heading";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  pairRatio,
  resolveColor,
  TEXT_PAIRS,
  THEMES,
  UI_PAIRS,
  type ColorPair,
} from "@/lib/contrast";
import tokens from "@/styles/tokens.json";
import { ThemeToggle } from "./theme-toggle";

export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "#cores", label: "Cores" },
  { href: "#tipografia", label: "Tipografia" },
  { href: "#forma", label: "Forma" },
  { href: "#componentes", label: "Componentes" },
];

const STAGES: Stage[] = [
  { title: "Organização de ideias", status: "concluida" },
  { title: "Design", status: "concluida" },
  { title: "Desenvolvimento", status: "em_andamento" },
  { title: "Testes e homologação", status: "pendente" },
  { title: "Entrega e publicação", status: "pendente" },
];

function Block({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <Section id={id} aria-labelledby={`${id}-title`} className="border-t border-border">
      <Container className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <Eyebrow>{eyebrow}</Eyebrow>
          <Heading id={`${id}-title`}>{title}</Heading>
        </div>
        {children}
      </Container>
    </Section>
  );
}

function ContrastRow({ pair }: { pair: ColorPair }) {
  return (
    <tr className="border-t border-border">
      <td className="py-2 pr-4">
        <code className="type-code">{pair.fg}</code> sobre{" "}
        <code className="type-code">{pair.bg}</code>
        <span className="block type-small text-ink-muted">{pair.note}</span>
      </td>
      {THEMES.map((theme) => {
        const ratio = pairRatio(pair, theme);
        const ok = ratio >= pair.min;
        return (
          <td key={theme} className="py-2 pr-4 whitespace-nowrap">
            <span className="type-label">{ratio.toFixed(2)}:1</span>{" "}
            <Badge size="sm" variant={ok ? "accent" : "outline"}>
              {ok ? "passa" : `abaixo de ${pair.min}:1`}
            </Badge>
          </td>
        );
      })}
    </tr>
  );
}

export default function DesignPage() {
  const typeStyles = tokens.type.groups.flatMap((group) => group.styles);

  return (
    <>
      <Header nav={NAV} actions={<ThemeToggle />} />
      <main>
        <Section>
          <Container className="flex flex-col gap-4">
            <Eyebrow>Uso interno</Eyebrow>
            <Heading level="display">Design system</Heading>
            <p className="max-w-160 type-lead text-ink-muted">
              Tokens e componentes das áreas do cliente, do admin e do login, gerados de
              src/styles/tokens.json. A landing tem visual próprio e não usa esta página.
            </p>
          </Container>
        </Section>

        <Block id="cores" eyebrow="Tokens" title="Cores">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tokens.color.tokens.map((token) => (
              <li key={token.name} className="flex gap-3 rounded-md border border-border p-3">
                <span
                  aria-hidden="true"
                  className="size-12 shrink-0 rounded-sm border border-border"
                  style={{ backgroundColor: `var(--${token.name})` } as CSSProperties}
                />
                <span className="flex min-w-0 flex-col gap-1">
                  <code className="type-code">{token.name}</code>
                  <span className="type-small text-ink-muted">
                    {THEMES.map((theme) => resolveColor(token.name, theme)).join(" / ")}
                  </span>
                  <span className="type-small">{token.usage}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <caption className="mb-3 text-left type-label">Contraste (WCAG)</caption>
              <thead>
                <tr className="type-small text-ink-muted">
                  <th className="pb-2 font-normal">Par</th>
                  <th className="pb-2 font-normal">Claro</th>
                  <th className="pb-2 font-normal">Escuro</th>
                </tr>
              </thead>
              <tbody>
                {[...TEXT_PAIRS, ...UI_PAIRS].map((pair) => (
                  <ContrastRow key={`${pair.fg}-${pair.bg}`} pair={pair} />
                ))}
              </tbody>
            </table>
          </div>
        </Block>

        <Block id="tipografia" eyebrow="Tokens" title="Tipografia">
          <ul className="flex flex-col gap-6">
            {typeStyles.map((style) => (
              <li key={style.name} className="flex flex-col gap-1">
                <span className={`type-${style.name}`}>{style.sample}</span>
                <span className="type-small text-ink-muted">
                  <code className="type-code">type-{style.name}</code> · {style.fontSize}/
                  {style.lineHeight} · {style.usage}
                </span>
              </li>
            ))}
          </ul>
        </Block>

        <Block id="forma" eyebrow="Tokens" title="Espaço, raios e sombra">
          <ul className="flex flex-col gap-2">
            {tokens.spacing.tokens.map((token) => (
              <li key={token.name} className="flex items-center gap-4">
                <code className="w-20 type-code">{token.name}</code>
                <span aria-hidden="true" className="h-2 bg-accent" style={{ width: token.value }} />
                <span className="type-small text-ink-muted">
                  {token.value} · {token.usage}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-6">
            {tokens.radius.tokens.map((token) => (
              <div key={token.name} className="flex flex-col items-center gap-2">
                <span
                  aria-hidden="true"
                  className="size-16 border-2 border-accent bg-surface-alt"
                  style={{ borderRadius: token.value }}
                />
                <code className="type-code">{token.name}</code>
              </div>
            ))}
            <div className="flex flex-col items-center gap-2">
              <span
                aria-hidden="true"
                className="size-16 rounded-md border border-border bg-surface shadow-pixel"
              />
              <code className="type-code">shadow-pixel</code>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-8">
            <Logo variant="vertical" />
            <Logo variant="horizontal" />
            <Logo variant="icon" />
            <div className="bg-surface-inverse p-4">
              <Logo variant="horizontal" inverse />
            </div>
          </div>
        </Block>

        <Block id="componentes" eyebrow="shadcn/ui" title="Componentes">
          <div className="flex flex-col gap-3">
            <Heading level="h3">Botões</Heading>
            <div className="flex flex-wrap items-center gap-3">
              <Button>Fale com a gente</Button>
              <Button variant="secondary">Secundário</Button>
              <Button variant="outline">Contorno</Button>
              <Button variant="ghost">Fantasma</Button>
              <Button variant="link">Link</Button>
              <Button size="sm">Pequeno</Button>
              <Button disabled>Desabilitado</Button>
              <Button asChild variant="outline">
                <a href="#componentes">Como link</a>
              </Button>
            </div>
            <div className="flex flex-wrap gap-3 bg-surface-inverse p-4">
              <Button variant="inverse">Sobre surface-inverse</Button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Heading level="h3">Selos</Heading>
            <div className="flex flex-wrap items-center gap-3">
              <Badge>Em andamento</Badge>
              <Badge variant="brand">Concluída</Badge>
              <Badge variant="outline">Pendente</Badge>
              <Badge variant="muted">Pausado</Badge>
              <Badge size="sm">Etapa 03</Badge>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <Eyebrow>Lab 01 · Serviços</Eyebrow>
                <CardTitle>Etapa 2 — Design</CardTitle>
                <CardDescription>Atualizado há 2 horas</CardDescription>
              </CardHeader>
              <CardContent>Você acompanha cada etapa do seu projeto pelo painel.</CardContent>
              <CardFooter>
                <Button size="sm">Ver projeto</Button>
              </CardFooter>
            </Card>
            <Card featured>
              <CardHeader>
                <CardTitle>Card em destaque</CardTitle>
                <CardDescription>Com shadow-pixel, a única sombra da marca.</CardDescription>
              </CardHeader>
              <CardContent>
                <StageTracker stages={STAGES} compact label="Andamento do projeto de exemplo" />
              </CardContent>
            </Card>
          </div>

          <form className="grid max-w-160 gap-4" aria-label="Exemplo de formulário">
            <div className="grid gap-2">
              <Label htmlFor="ds-name">Nome</Label>
              <Input id="ds-name" placeholder="Seu nome" autoComplete="off" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ds-message">Mensagem</Label>
              <Textarea id="ds-message" placeholder="Conte um pouco do projeto" />
            </div>
          </form>

          <div className="flex flex-col gap-3">
            <Heading level="h3">Acompanhamento de etapas</Heading>
            <StageTracker stages={STAGES} />
          </div>
        </Block>
      </main>
      <Footer />
    </>
  );
}
