const STAGES = [
  {
    title: "Organização de ideias",
    text: "Briefing, escopo e cronograma. Você sai daqui sabendo o que vai ser feito, em que ordem e quando.",
    gets: ["Briefing aprovado", "Escopo fechado", "Cronograma por etapa"],
    panel: "Etapa 1 iniciada. Cronograma disponível.",
  },
  {
    title: "Design",
    text: "Wireframes e telas no Figma. Você aprova cada tela antes de ela virar código.",
    gets: ["Protótipo navegável", "Guia visual"],
    panel: "Nova atualização: telas da página inicial.",
  },
  {
    title: "Desenvolvimento",
    text: "Construímos em entregas curtas. Cada avanço chega ao seu painel com prints, vídeos e uma versão para testar.",
    gets: ["Versões de teste", "Prints e vídeos a cada entrega"],
    panel: "Versão de teste publicada.",
  },
  {
    title: "Testes e homologação",
    text: "Testamos em celulares e navegadores reais, e você valida tudo com a sua equipe antes de publicar.",
    gets: ["Ambiente de teste", "Lista de ajustes resolvida"],
    panel: "Ajustes da homologação concluídos.",
  },
  {
    title: "Entrega e publicação",
    text: "Publicamos o site no seu domínio ou o app nas lojas e passamos os acessos para a sua equipe.",
    gets: ["Projeto no ar", "Acessos e documentação"],
    panel: "Projeto publicado.",
  },
];

export function Process() {
  return (
    <section className="process" id="processo">
      <div className="p-sticky">
        <div className="wrap p-grid">
          <div className="p-left">
            <h2 className="h2 fill-text">Do briefing ao ar em cinco etapas</h2>
            <p className="lead">
              Cada etapa termina com algo que você aprova. E tudo aparece no seu painel enquanto
              acontece.
            </p>
            <ol className="ptrack" id="ptrack">
              {STAGES.map((stage, i) => (
                <li key={stage.title} className="pt">
                  <button type="button" data-step={i}>
                    <span className="pt-dot"></span>
                    <span className="pt-name">{stage.title}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
          <div className="p-stage" id="pstage">
            {STAGES.map((stage, i) => {
              const number = String(i + 1).padStart(2, "0");
              return (
                <article key={stage.title} className="pslide">
                  <div className="ps-card">
                    <span className="ps-step">Etapa {number}</span>
                    <h3 className="ps-title">{stage.title}</h3>
                    <p>{stage.text}</p>
                    <div className="ps-get">
                      <span className="ps-lbl">Você recebe</span>
                      <ul>
                        {stage.gets.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="ps-notif">
                      <span className="pulse" aria-hidden="true"></span>
                      <div>
                        <strong>No seu painel</strong>
                        {stage.panel}
                      </div>
                    </div>
                    <span className="ps-big" aria-hidden="true">
                      {number}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
