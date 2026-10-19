import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "./section-heading";

export function About() {
  return (
    <Section id="quem-somos" tone="alt" aria-labelledby="quem-somos-title">
      <Container>
        {/* brand (indigo) is the supporting color for institutional blocks */}
        <div className="grid gap-6 rounded-md bg-brand px-6 py-12 text-on-brand lg:grid-cols-2 lg:items-end lg:p-12">
          <SectionHeading
            id="quem-somos-title"
            eyebrow="Lab 03 · Quem somos"
            title="Uma software house de dois sócios"
            tone="brand"
            className="mb-0"
          />
          <p className="type-lead">
            Você fala direto com quem desenha e programa o seu projeto, sem intermediários. A gente
            trata cada projeto como um experimento bem conduzido: hipótese, teste e resultado.
          </p>
        </div>
      </Container>
    </Section>
  );
}
