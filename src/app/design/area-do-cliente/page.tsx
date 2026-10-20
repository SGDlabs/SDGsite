import type { Metadata } from "next";
import { ProjectCard } from "@/components/client/project-card";
import { ProjectPanel } from "@/components/client/project-panel";
import { Container } from "@/components/layout/container";
import { Header } from "@/components/layout/header";
import { Notice } from "@/components/ui/notice";
import { ThemeToggle } from "../theme-toggle";
import { SAMPLE_CARDS, SAMPLE_PROJECT } from "./sample";

export const metadata: Metadata = {
  title: "Prévia da área do cliente",
  robots: { index: false, follow: false },
};

/** The client area with sample data, to review its design without a database. */
export default function ClientAreaPreviewPage() {
  return (
    <>
      <Header homeHref="/design" actions={<ThemeToggle />} />
      <main>
        <Container className="flex flex-col gap-12 py-10 md:py-14">
          <Notice>
            Prévia interna com dados de exemplo e sem tempo real. A página de verdade fica em
            /painel/projetos/[id].
          </Notice>
          <ProjectPanel project={SAMPLE_PROJECT} live={false} />
          <section aria-labelledby="preview-cards" className="flex flex-col gap-4">
            <h2 id="preview-cards" className="type-h2">
              Cards de /painel
            </h2>
            <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {SAMPLE_CARDS.map((project) => (
                <li key={project.id}>
                  <ProjectCard project={project} />
                </li>
              ))}
            </ul>
          </section>
        </Container>
      </main>
    </>
  );
}
