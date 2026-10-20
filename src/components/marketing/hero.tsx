import { Fragment } from "react";
import { cssVars } from "./brand";

// Each word rises in turn: --i is its position in the whole title.
const LINES = [
  { first: 0, words: ["A", "fórmula", "do"] },
  { first: 3, words: ["seu", "software."] },
];

export function Hero() {
  return (
    <section className="hero" id="topo">
      <canvas className="field" id="field" aria-hidden="true"></canvas>
      <div className="hero-glow" aria-hidden="true"></div>
      <div className="wrap hero-inner">
        <a className="pill" href="#painel">
          <span className="pulse" aria-hidden="true"></span>Painel de acompanhamento em todo projeto
          <span className="pill-go">Ver como funciona</span>
        </a>
        <h1 className="hero-title">
          {LINES.map((line) => (
            <span key={line.first} className="ln">
              {line.words.map((text, i) => (
                <Fragment key={text}>
                  {i > 0 && " "}
                  <span className="w" style={cssVars({ "--i": line.first + i })}>
                    {text}
                  </span>
                </Fragment>
              ))}
            </span>
          ))}
        </h1>
        <div className="hero-side">
          <p className="lead">
            Sites, aplicativos e sistemas sob medida. Você acompanha cada etapa num painel próprio,
            com prints e vídeos do que está ficando pronto.
          </p>
          <div className="cta-row">
            <a className="btn btn-primary magnetic" href="#contato">
              <span>Começar um projeto</span>
            </a>
            <a className="btn btn-ghost" href="#processo">
              <span>Ver o processo</span>
            </a>
          </div>
        </div>
        <figure className="bench" id="bench">
          <canvas
            id="logoCanvas"
            role="img"
            aria-label="Logo da SDG Labs: o frasco pixelado tomba, o líquido vaza e forma o nome SDG LABS"
          ></canvas>
          <figcaption>
            <span className="bm tl">Bancada 01</span>
            <span className="bm tr" id="benchTime">
              t = 0,0 s
            </span>
            <span className="bm bl">Experimento: SDG Labs</span>
            <button className="bm replay" id="replay" type="button">
              Repetir experimento
            </button>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
