import { Fragment } from "react";

const TEXT =
  "Você não precisa mandar mensagem perguntando como está o seu projeto. Cada etapa concluída, cada print e cada versão de teste aparecem no seu painel no momento em que acontecem.";

export function Manifesto() {
  return (
    <section className="sec">
      <div className="wrap">
        {/* one span per word: they light up in turn as the paragraph scrolls by */}
        <p className="mf" id="mf">
          {TEXT.split(" ").map((word, i) => (
            <Fragment key={i}>
              {i > 0 && " "}
              <span className="mw">{word}</span>
            </Fragment>
          ))}
        </p>
      </div>
    </section>
  );
}
