import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "./section-heading";

const SERVICES = [
  { title: "Sites", text: "Sites institucionais e landing pages rápidos e fáceis de atualizar." },
  {
    title: "Aplicativos",
    text: "Apps para celular e para a web, do protótipo à publicação nas lojas.",
  },
  {
    title: "Sistemas",
    text: "Sistemas internos, painéis e integrações feitos para o jeito que a sua empresa trabalha.",
  },
];

export function Services() {
  return (
    <Section id="servicos" tone="alt" aria-labelledby="servicos-title">
      <Container>
        <SectionHeading
          id="servicos-title"
          eyebrow="Lab 01 · Serviços"
          title="O que a gente desenvolve"
        />
        <ul className="grid gap-6 md:grid-cols-3">
          {SERVICES.map((service) => (
            <li
              key={service.title}
              className="flex flex-col gap-3 rounded-md border border-border bg-surface p-6"
            >
              <PixelDrip />
              <h3 className="type-h3">{service.title}</h3>
              <p className="text-ink-muted">{service.text}</p>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

/** Pixels dripping from the flask: the brand's decorative element (8px squares). */
function PixelDrip() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      aria-hidden="true"
      shapeRendering="crispEdges"
      className="mb-3 fill-accent"
    >
      <rect x="0" y="0" width="8" height="8" />
      <rect x="8" y="0" width="8" height="8" />
      <rect x="8" y="8" width="8" height="8" />
      <rect x="16" y="16" width="8" height="8" className="fill-nevoa" />
    </svg>
  );
}
