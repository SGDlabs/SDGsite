import type { ReactNode } from "react";
import { FEED_ICONS, type FeedIcon } from "./brand";
import { PanelIcon } from "./pixel-logo";

const STAGES = [
  { name: "Ideias", state: "done" },
  { name: "Design", state: "done" },
  { name: "Desenvolvimento", state: "cur" },
  { name: "Testes", state: "" },
  { name: "Entrega", state: "" },
];

const FEED: { title: string; meta: string; icon: FeedIcon; video?: boolean }[] = [
  { title: "Prints da tela de agendamento", meta: "Desenvolvimento · agora", icon: "print" },
  {
    title: "Vídeo: fluxo de cadastro",
    meta: "Desenvolvimento · ontem",
    icon: "video",
    video: true,
  },
  { title: "Versão de teste 0.3 publicada", meta: "Desenvolvimento · há 2 dias", icon: "deploy" },
  { title: "Etapa concluída: Design", meta: "Design · há 5 dias", icon: "stage" },
];

const FILES = [
  { name: "Briefing.pdf", stage: "Etapa 1" },
  { name: "Protótipo no Figma", stage: "Etapa 2" },
  { name: "Cronograma", stage: "Etapa 1" },
];

function SideIcon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {children}
    </svg>
  );
}

export function Showcase() {
  return (
    <section className="sec showcase" id="painel">
      <div className="wrap">
        <div className="sec-head">
          <h2 className="h2 fill-text">Seu projeto, ao vivo</h2>
          <p className="lead">
            Quem contrata a SDG Labs ganha login num painel próprio. Lá aparecem a etapa atual, os
            prints, os vídeos e cada versão de teste, no momento em que a gente publica.
          </p>
        </div>
        <div className="device-stage">
          <div className="device" id="device">
            <div className="app">
              <aside className="app-side" aria-hidden="true">
                <PanelIcon />
                <span className="side-i on">
                  <SideIcon>
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                  </SideIcon>
                  Projetos
                </span>
                <span className="side-i">
                  <SideIcon>
                    <path d="M4 12h4l3-8 4 16 3-8h2" />
                  </SideIcon>
                  Atualizações
                </span>
                <span className="side-i">
                  <SideIcon>
                    <path d="M4 4h10l6 6v10H4z" />
                    <path d="M14 4v6h6" />
                  </SideIcon>
                  Arquivos
                </span>
                <span className="side-i">
                  <SideIcon>
                    <path d="M4 5h16v11H9l-5 4z" />
                  </SideIcon>
                  Mensagens
                </span>
                <span className="side-user">
                  <b>CE</b>Cliente exemplo
                </span>
              </aside>
              <div className="app-main">
                <div className="app-top">
                  <div>
                    <span className="crumb">Projetos</span>
                    <strong>App de agendamento</strong>
                  </div>
                  <span className="live">
                    <span className="pulse" aria-hidden="true"></span>Ao vivo
                  </span>
                </div>
                <div className="astages" aria-label="Etapa 3 de 5, Desenvolvimento, em andamento">
                  {STAGES.map((stage) => (
                    <div key={stage.name} className={stage.state ? `ast ${stage.state}` : "ast"}>
                      <i></i>
                      <span>{stage.name}</span>
                    </div>
                  ))}
                </div>
                <div className="app-cols">
                  <div className="panel">
                    <div className="panel-h">
                      Atualizações <span>Etapa 3 de 5</span>
                    </div>
                    <ul className="feed" id="feed">
                      {FEED.map((item) => (
                        <li key={item.title} className="fi">
                          <span
                            className="fi-ic"
                            data-ic={item.icon}
                            dangerouslySetInnerHTML={{ __html: FEED_ICONS[item.icon] }}
                          ></span>
                          <span className="fi-tx">
                            <strong>{item.title}</strong>
                            <span>{item.meta}</span>
                          </span>
                          <span className={item.video ? "fi-th vid" : "fi-th"}></span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="panel app-aside next">
                    <div className="panel-h">Próxima entrega</div>
                    <div className="next-card">
                      <strong>Versão de teste 0.4</strong>
                      <span>Agenda, notificações e pagamentos</span>
                      <div className="bar">
                        <i></i>
                      </div>
                    </div>
                    <div className="panel-h" style={{ margin: "6px 0 0" }}>
                      Arquivos
                    </div>
                    <ul className="files">
                      {FILES.map((file) => (
                        <li key={file.name}>
                          {file.name}
                          <span>{file.stage}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              <div className="toast" id="toast" role="status" aria-live="polite">
                <span className="pulse" aria-hidden="true"></span>
                <span id="toastText">Nova atualização no seu projeto</span>
              </div>
            </div>
          </div>
        </div>
        <p className="sc-note">Exemplo ilustrativo do painel do cliente.</p>
      </div>
    </section>
  );
}
