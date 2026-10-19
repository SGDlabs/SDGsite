import { ButtonLink } from "@/components/ui/button";
import { Container } from "./container";
import { Logo } from "./logo";

const NAV = [
  { href: "#servicos", label: "Serviços" },
  { href: "#como-trabalhamos", label: "Como trabalhamos" },
  { href: "#quem-somos", label: "Quem somos" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface">
      <Container className="flex min-h-18 items-center gap-6">
        {/* py-2 keeps the logo's clear space: 4 grid cells at 2px each */}
        <a
          href="#inicio"
          className="flex items-center rounded-sm py-2"
          aria-label="SDG Labs — início"
        >
          {/* The horizontal logo needs 120px; on very narrow screens only the icon fits beside the CTA. */}
          <span className="max-[379px]:hidden">
            <Logo variant="horizontal" alt="" />
          </span>
          <span className="min-[380px]:hidden">
            <Logo variant="icon" scale={1} alt="" />
          </span>
        </a>
        <nav aria-label="Principal" className="ml-auto hidden lg:block">
          <ul className="flex gap-6">
            {NAV.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="type-label text-ink hover:text-accent hover:underline"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <ButtonLink href="#contato" className="ml-auto lg:ml-0">
          Fale com a gente
        </ButtonLink>
      </Container>
    </header>
  );
}
