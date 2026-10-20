import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "As regras de uso do site e da área do cliente da SDG Labs.",
};

// Draft: review with a lawyer before launch (README, "Antes de publicar").
export default function TermsPage() {
  return (
    <LegalPage title="Termos de Uso" updated="[data da versão]">
      <p className="legal-note">
        [Rascunho: revisar com um advogado antes de publicar. Os trechos entre colchetes precisam
        ser preenchidos.]
      </p>

      <h2>Sobre estes termos</h2>
      <p>
        Eles valem para quem usa o site da SDG Labs ([razão social], CNPJ [número]) e a área do
        cliente. O que a gente entrega em cada projeto (escopo, prazos, valores, propriedade do
        código) fica no contrato assinado com a sua empresa, que prevalece sobre estes termos.
      </p>

      <h2>O site</h2>
      <p>
        O conteúdo do site (textos, marca, imagens e casos do portfólio) é da SDG Labs ou dos
        clientes que autorizaram mostrar o trabalho. Você pode ler e compartilhar os links; não pode
        copiar a marca nem republicar o conteúdo como seu.
      </p>

      <h2>A área do cliente</h2>
      <ul>
        <li>
          O acesso é por convite, para as pessoas que a sua empresa indicar. A senha é pessoal: não
          a compartilhe.
        </li>
        <li>
          Você vê só os projetos da sua empresa. O que aparece ali (prints, vídeos, versões de
          teste) é material de trabalho, confidencial até a entrega, salvo o que o contrato disser.
        </li>
        <li>
          Avise a gente se alguém da sua empresa sair, para tirarmos o acesso, e se suspeitar de uso
          indevido da sua conta.
        </li>
      </ul>

      <h2>Integração com o seu repositório</h2>
      <p>
        Se a sua equipe usar um token de integração para publicar atualizações, ele é secreto e vale
        só para o seu projeto. Ele publica no feed, mas não muda as etapas. Se vazar, peça para a
        gente revogar.
      </p>

      <h2>Disponibilidade</h2>
      <p>
        A gente trabalha para o site e a área do cliente ficarem no ar, mas eles podem parar para
        manutenção ou por falhas de fornecedores. O que vale para prazos e entregas é o contrato,
        não a disponibilidade do site. [Revisar com o advogado a limitação de responsabilidade.]
      </p>

      <h2>Privacidade</h2>
      <p>
        O tratamento de dados está na <Link href="/privacidade">Política de Privacidade</Link>.
      </p>

      <h2>Lei e foro</h2>
      <p>
        Estes termos seguem a lei brasileira. Fica eleito o foro de [comarca], salvo o que o
        contrato com a sua empresa disser.
      </p>

      <h2>Contato</h2>
      <p>[E-mail de contato da SDG Labs].</p>
    </LegalPage>
  );
}
