import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { ButtonLink } from "@/components/ui/button";
import { site } from "@/lib/site";
import { HeroLogo } from "./hero-logo";

export function Hero() {
  return (
    <Section id="inicio" aria-labelledby="hero-title">
      <Container className="grid items-center gap-12 lg:grid-cols-[5fr_7fr]">
        <div className="flex flex-col gap-6">
          <h1 id="hero-title" className="type-display">
            {site.slogan}
          </h1>
          <p className="type-lead text-ink-muted">{site.description}</p>
          <div className="mt-2 flex flex-wrap gap-3">
            <ButtonLink href="#contato">Fale com a gente</ButtonLink>
            <ButtonLink href="#como-trabalhamos" variant="secondary">
              Veja como trabalhamos
            </ButtonLink>
          </div>
        </div>
        <HeroLogo />
      </Container>
    </Section>
  );
}
