import { cssVars } from "./brand";

const CHART = [46, 70, 55, 82, 60, 90, 68, 76, 100, 72];
const BARS = ["40%", "62%", "48%", "74%", "92%", "66%"];

function Row() {
  return (
    <div className="row">
      <b></b>
      <span>
        <i></i>
        <i></i>
      </span>
    </div>
  );
}

function AgendaScreen() {
  return (
    <div className="scr">
      <span className="scr-t">Agenda de hoje</span>
      <Row />
      <Row />
      <Row />
      <Row />
    </div>
  );
}

export function Services() {
  return (
    <section className="sec" id="servicos">
      <div className="wrap">
        <div className="sec-head">
          <h2 className="h2 fill-text">O que sai do nosso laboratório</h2>
          <p className="lead">
            Quatro tipos de projeto, o mesmo processo e o mesmo painel de acompanhamento.
          </p>
        </div>
        <div className="bento" id="bento">
          <article className="card c-sites">
            <div className="card-vis">
              <div className="browser" aria-hidden="true">
                <div className="b-bar">
                  <i></i>
                  <i></i>
                  <i></i>
                  <span className="b-url">seusite.com.br</span>
                </div>
                <div className="b-body">
                  {["nav", "hero", "img", "l1", "l2", "c", "c", "c"].map((kind, d) => (
                    <div key={d} className={`sk sk-${kind}`} style={cssVars({ "--d": d })}></div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <h3>Sites e landing pages</h3>
              <p>Sites institucionais e páginas de venda rápidos, bonitos e fáceis de atualizar.</p>
            </div>
          </article>
          <article className="card c-apps">
            <div className="card-vis">
              <div className="phone" aria-hidden="true">
                <div className="ph-notch"></div>
                <div className="ph-screen">
                  <div className="ph-track">
                    <AgendaScreen />
                    <div className="scr">
                      <span className="scr-t">Relatório</span>
                      <div className="bars">
                        {BARS.map((h, i) => (
                          <i key={i} style={cssVars({ "--h": h })}></i>
                        ))}
                      </div>
                      <Row />
                    </div>
                    <div className="scr">
                      <span className="scr-t">Pedido confirmado</span>
                      <div className="ok">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#fff"
                          strokeWidth="3"
                          strokeLinecap="square"
                        >
                          <path d="M5 12.5l4.5 4.5L19 7.5" />
                        </svg>
                      </div>
                      <div className="lines">
                        <i></i>
                        <i></i>
                      </div>
                      <div className="ph-btn"></div>
                    </div>
                    {/* the first screen again, so the loop restarts without a jump */}
                    <AgendaScreen />
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3>Aplicativos</h3>
              <p>Apps para iPhone e Android, do protótipo à publicação nas lojas.</p>
            </div>
          </article>
          <article className="card c-sys">
            <div className="card-vis">
              <div className="dash" aria-hidden="true">
                <div className="kpis">
                  {["Pedidos", "Clientes", "Estoque"].map((label) => (
                    <div key={label} className="kpi">
                      {label}
                      <b></b>
                    </div>
                  ))}
                </div>
                <div className="chart">
                  {CHART.map((h, d) => (
                    <i key={d} style={cssVars({ "--h": h, "--d": d })}></i>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <h3>Sistemas sob medida</h3>
              <p>
                Painéis, ERPs e ferramentas internas feitos para o jeito que a sua empresa trabalha.
              </p>
            </div>
          </article>
          <article className="card c-int">
            <div className="card-vis">
              <svg className="beams" viewBox="0 0 320 168" aria-hidden="true">
                <path className="base" d="M98 32C122 32 112 84 136 84" />
                <path className="base" d="M98 84H136" />
                <path className="base" d="M98 136C122 136 112 84 136 84" />
                <path className="base" d="M184 84H222" />
                <path
                  className="pulse-path"
                  pathLength={150}
                  style={cssVars({ "--d": 0 })}
                  d="M98 32C122 32 112 84 136 84"
                />
                <path
                  className="pulse-path"
                  pathLength={150}
                  style={cssVars({ "--d": 1 })}
                  d="M98 84H136"
                />
                <path
                  className="pulse-path"
                  pathLength={150}
                  style={cssVars({ "--d": 2 })}
                  d="M98 136C122 136 112 84 136 84"
                />
                <path
                  className="pulse-path"
                  pathLength={150}
                  style={cssVars({ "--d": 1.5 })}
                  d="M184 84H222"
                />
                <rect className="node" x="10" y="18" width="88" height="28" rx="8" />
                <text x="54" y="36" textAnchor="middle">
                  Seu ERP
                </text>
                <rect className="node" x="10" y="70" width="88" height="28" rx="8" />
                <text x="54" y="88" textAnchor="middle">
                  Planilhas
                </text>
                <rect className="node" x="10" y="122" width="88" height="28" rx="8" />
                <text x="54" y="140" textAnchor="middle">
                  Pagamentos
                </text>
                <rect className="hub" x="136" y="60" width="48" height="48" rx="12" />
                <text className="hub-t" x="160" y="88" textAnchor="middle">
                  API
                </text>
                <rect className="node" x="222" y="70" width="88" height="28" rx="8" />
                <text x="266" y="88" textAnchor="middle">
                  Seu app
                </text>
              </svg>
            </div>
            <div>
              <h3>Integrações</h3>
              <p>Conectamos o seu sistema a pagamentos, planilhas, ERPs e outras APIs.</p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
