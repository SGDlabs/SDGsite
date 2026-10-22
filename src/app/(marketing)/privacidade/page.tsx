import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Quais dados a SDG Labs trata, por quê, com quem e como você exerce seus direitos.",
};

// Draft: review with a lawyer before launch (README, "Antes de publicar").
export default function PrivacyPage() {
  return (
    <LegalPage title="Política de Privacidade" updated="[data da versão]">
      <p className="legal-note">
        [Rascunho: revisar com um advogado antes de publicar. Os trechos entre colchetes precisam
        ser preenchidos.]
      </p>

      <h2>Quem somos</h2>
      <p>
        A SDG Labs ([razão social], CNPJ [número], [endereço]) é a controladora dos dados tratados
        neste site e na área do cliente. Fale com a gente sobre privacidade em [e-mail do
        encarregado].
      </p>

      <h2>Que dados a gente trata, e por quê</h2>
      <h3>Formulário de contato</h3>
      <p>
        Nome, e-mail, empresa (se você informar), o tipo de projeto, a mensagem e a data em que você
        aceitou esta política. Usamos para responder e preparar uma proposta. Base legal: seu
        consentimento e os procedimentos preliminares a um contrato que você pediu (LGPD, art. 7º, I
        e V).
      </p>
      <h3>Área do cliente</h3>
      <p>
        Nome, e-mail e senha de quem a sua empresa nos pediu para convidar; os dados do projeto
        (etapas, atualizações, prints e vídeos); a preferência de receber e-mails; e registros de
        acesso. Usamos para prestar o serviço contratado e mostrar o andamento dele. Base legal:
        execução do contrato (art. 7º, V). A senha é guardada cifrada pelo nosso provedor de
        autenticação: ninguém da SDG Labs consegue lê-la.
      </p>
      <h3>Navegação</h3>
      <p>
        Estatísticas de visitas e de desempenho das páginas, sem cookies e sem identificar quem
        visitou (Vercel Web Analytics e Speed Insights). Usamos para melhorar o site. Base legal:
        legítimo interesse (art. 7º, IX).
      </p>

      <h2>Cookies</h2>
      <p>
        O site público não usa cookies. A área do cliente usa só os cookies necessários para manter
        você conectado depois do login; sem eles, ela não funciona. Não usamos cookies de
        publicidade nem de rastreamento.
      </p>

      <h2>Com quem compartilhamos</h2>
      <p>Com os fornecedores que operam o site para a gente, só no necessário:</p>
      <ul>
        <li>Supabase: banco de dados, autenticação e arquivos dos projetos;</li>
        <li>Vercel: hospedagem do site e as estatísticas de navegação;</li>
        <li>Resend: envio dos e-mails (convites, avisos de etapa e novidades).</li>
      </ul>
      <p>
        Alguns desses serviços guardam dados fora do Brasil, com as garantias do art. 33 da LGPD
        [revisar as regiões contratadas e os instrumentos de transferência]. Não vendemos dados a
        ninguém.
      </p>

      <h2>Por quanto tempo</h2>
      <p>
        Contatos que não viraram projeto: até [12 meses]. Dados da área do cliente: enquanto durar o
        contrato e depois pelo prazo que a lei exigir ([prazo]). Depois disso, apagamos ou
        anonimizamos.
      </p>

      <h2>Como protegemos</h2>
      <p>
        Conexões cifradas, acesso à área do cliente só por convite e senha, e regras no banco de
        dados que impedem uma empresa de ver os projetos de outra. Os arquivos dos projetos ficam em
        armazenamento privado e só abrem por links temporários.
      </p>

      <h2>Seus direitos</h2>
      <p>
        Pela LGPD (art. 18), você pode pedir a confirmação de que tratamos seus dados, o acesso a
        eles, a correção, a anonimização ou a eliminação, a portabilidade, a informação sobre com
        quem compartilhamos e a revogação do consentimento. Escreva para [e-mail do encarregado]: a
        gente responde em até [15 dias]. Você também pode reclamar à Autoridade Nacional de Proteção
        de Dados (ANPD).
      </p>
      <p>
        Na área do cliente, você mesmo desliga os e-mails de novidades, em{" "}
        <Link href="/painel/conta">Sua conta</Link>.
      </p>

      <h2>Encarregado</h2>
      <p>[Nome do encarregado], [e-mail do encarregado].</p>

      <h2>Mudanças nesta política</h2>
      <p>
        Quando ela mudar, a data no topo muda junto. Se a mudança for grande, avisamos os clientes
        por e-mail.
      </p>
    </LegalPage>
  );
}
