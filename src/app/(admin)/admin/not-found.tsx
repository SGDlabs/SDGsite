import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";

/** A client, project or case that does not exist (anymore): the sidebar stays, with a way back. */
export default function AdminNotFound() {
  return (
    <>
      <PageHeader
        eyebrow="Erro 404"
        title="Não encontrado"
        description="Esse endereço não leva a nenhum cliente, projeto ou caso do portfólio. Pode ter sido excluído, ou o link está errado."
      />
      <Link href="/admin" className="self-start type-label">
        Voltar à visão geral
      </Link>
    </>
  );
}
