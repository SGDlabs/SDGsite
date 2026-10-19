import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "./section-heading";
import { StageTrackerDemo, type DemoStage } from "./stage-tracker-demo";

const STAGES: DemoStage[] = [
  {
    title: "Organização de ideias",
    description: "A gente conversa com você, organiza as ideias e fecha o escopo do projeto.",
  },
  {
    title: "Design",
    description: "Desenhamos as telas e validamos o fluxo com você antes de escrever código.",
  },
  {
    title: "Desenvolvimento",
    description: "Construímos o software em entregas curtas. Cada avanço aparece no seu painel.",
  },
  {
    title: "Testes e homologação",
    description: "Você testa a versão final com a gente e aprova antes de ir ao ar.",
  },
  {
    title: "Entrega e publicação",
    description: "Publicamos o projeto e deixamos tudo pronto para você usar.",
  },
];

export function Process() {
  return (
    <Section id="como-trabalhamos" aria-labelledby="processo-title">
      <Container>
        <SectionHeading
          id="processo-title"
          eyebrow="Lab 02 · Processo"
          title="Como trabalhamos"
          lead="Do experimento ao deploy: seu projeto passa por 5 etapas, e você acompanha cada uma pelo painel do cliente, em tempo real."
        />
        <StageTrackerDemo stages={STAGES} />
      </Container>
    </Section>
  );
}
