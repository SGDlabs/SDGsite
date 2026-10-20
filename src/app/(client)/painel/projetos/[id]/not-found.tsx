import Link from "next/link";
import { Container } from "@/components/layout/container";

export default function ProjectNotFound() {
  return (
    <main>
      <Container className="flex flex-col items-start gap-4 py-16">
        <h1 className="type-h1">Projeto não encontrado</h1>
        <p className="type-lead text-ink-muted">
          Esse endereço não leva a nenhum projeto da sua conta. Confira o link ou volte para a
          lista.
        </p>
        <Link href="/painel" className="type-label">
          Ver seus projetos
        </Link>
      </Container>
    </main>
  );
}
