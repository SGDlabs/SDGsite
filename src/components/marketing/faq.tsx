const QUESTIONS = [
  {
    q: "Quanto custa um projeto?",
    a: "Depende do escopo. Depois da primeira conversa, a gente manda uma proposta com o valor fechado e dividido por etapa.",
  },
  {
    q: "Quanto tempo leva?",
    a: "O prazo sai na primeira etapa, junto com o escopo, e fica visível no seu painel. Sites costumam ficar prontos antes de aplicativos e sistemas.",
  },
  {
    q: "Como eu acompanho o andamento?",
    a: "Você recebe login no painel da SDG Labs. Lá ficam a etapa atual, os prints, os vídeos e as versões de teste, e você recebe um e-mail a cada novidade.",
  },
  {
    q: "Posso pedir mudanças no meio do projeto?",
    a: "Pode. Você aprova cada tela na etapa de design e testa tudo na homologação. Mudanças que alteram o escopo entram como um ajuste na proposta.",
  },
  {
    q: "Vocês dão suporte depois da entrega?",
    a: "[Descreva aqui a política de suporte e manutenção da SDG Labs.]",
  },
];

export function Faq() {
  return (
    <section className="sec" id="faq" style={{ paddingTop: 0 }}>
      <div className="wrap faq">
        <h2 className="h2 fill-text">Perguntas frequentes</h2>
        <div className="acc" id="acc">
          {QUESTIONS.map((item, i) => {
            const open = i === 0;
            const n = i + 1;
            return (
              <div key={item.q} className={open ? "acc-i open" : "acc-i"}>
                <h3>
                  <button
                    className="acc-b"
                    id={`q${n}`}
                    type="button"
                    aria-expanded={open}
                    aria-controls={`a${n}`}
                  >
                    {item.q}
                    <span className="acc-ic" aria-hidden="true"></span>
                  </button>
                </h3>
                <div
                  className="acc-p"
                  id={`a${n}`}
                  role="region"
                  aria-labelledby={`q${n}`}
                  inert={!open}
                >
                  <div>
                    <p>{item.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
