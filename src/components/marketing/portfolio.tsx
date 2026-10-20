// Placeholders until the real cases are in: the covers are generative pixel art drawn on load.
const WORKS = [
  { cover: "blocks", tag: "Site institucional" },
  { cover: "wave", tag: "Aplicativo" },
  { cover: "dither", tag: "Sistema sob medida" },
  { cover: "rings", tag: "Integração" },
];

export function Portfolio() {
  return (
    <section className="works" id="portfolio">
      <div className="w-sticky">
        <div className="wrap w-head">
          <h2 className="h2 fill-text">Portfólio</h2>
          <p className="lead">
            Os projetos da SDG Labs entram aqui. Role para o lado para ver todos.
          </p>
          <span className="w-count" aria-hidden="true">
            <b id="wIdx">01</b>/05
          </span>
        </div>
        <div className="w-viewport" id="wViewport">
          <div className="w-track" id="wTrack">
            {WORKS.map((work) => (
              <a key={work.cover} className="work" href="#contato">
                <div className="w-cover">
                  <canvas data-cover={work.cover} aria-hidden="true"></canvas>
                </div>
                <div className="w-meta">
                  <span className="w-tag">{work.tag}</span>
                  <h3>[Nome do projeto]</h3>
                  <p>[O que foi feito, em uma frase]</p>
                </div>
              </a>
            ))}
            <a className="work cta" href="#contato">
              <h3>O próximo case pode ser o seu.</h3>
              <p>Conta pra gente o que você quer construir.</p>
              <span className="go">Começar um projeto</span>
            </a>
          </div>
        </div>
        <div className="wrap">
          <div className="w-bar">
            <span id="wBar"></span>
          </div>
        </div>
      </div>
    </section>
  );
}
