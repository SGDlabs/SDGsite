import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { ButtonLink } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { site } from "@/lib/site";

export function ContactCta() {
  return (
    <Section id="contato" tone="inverse" aria-labelledby="contato-title">
      <Container className="flex flex-col items-start gap-6">
        <Eyebrow tone="inverse">Lab 04 · Contato</Eyebrow>
        <h2 id="contato-title" className="type-h1">
          Conte o que você quer construir.
        </h2>
        <p className="max-w-160 type-lead">
          Mande uma mensagem com a sua ideia. A gente responde e marca uma conversa para entender o
          projeto.
        </p>
        <ButtonLink href={`mailto:${site.contactEmail}`} variant="inverse">
          Enviar um e-mail
        </ButtonLink>
      </Container>
    </Section>
  );
}
