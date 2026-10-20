const TYPES = [
  { id: "t-site", value: "site", label: "Site" },
  { id: "t-app", value: "app", label: "Aplicativo" },
  { id: "t-sys", value: "sistema", label: "Sistema" },
  { id: "t-int", value: "integracao", label: "Integração" },
  { id: "t-idk", value: "nao-sei", label: "Ainda não sei" },
];

export function Contact() {
  return (
    <section className="sec contact" id="contato">
      <div className="wrap contact-grid">
        <div>
          <h2 className="h1x">Qual é o seu próximo experimento?</h2>
          <p className="lead">
            Conta o que você precisa. A gente responde com as próximas etapas e um horário para
            conversar.
          </p>
          <dl className="alt">
            <div>
              <dt>E-mail</dt>
              <dd>[contato@sdglabs.com.br]</dd>
            </div>
            <div>
              <dt>WhatsApp</dt>
              <dd>[número da SDG Labs]</dd>
            </div>
          </dl>
        </div>
        {/* Validation and the success note come from the landing script; it only reaches the leads table in prompt 6. */}
        <form className="form" id="form" noValidate>
          <div className="f-row">
            <div className="field-w">
              <label htmlFor="f-name">Nome</label>
              <input id="f-name" name="name" autoComplete="name" placeholder="Seu nome" />
              <span className="err-msg" id="e-name"></span>
            </div>
            <div className="field-w">
              <label htmlFor="f-email">E-mail</label>
              <input
                id="f-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="voce@empresa.com.br"
              />
              <span className="err-msg" id="e-email"></span>
            </div>
          </div>
          <div className="field-w">
            <label htmlFor="f-company">Empresa (opcional)</label>
            <input
              id="f-company"
              name="company"
              autoComplete="organization"
              placeholder="Nome da empresa"
            />
          </div>
          <fieldset className="chips">
            <legend>O que você quer construir?</legend>
            {TYPES.map((type) => (
              <label key={type.id} className="chip">
                <input type="checkbox" id={type.id} name="type" value={type.value} />
                <span>{type.label}</span>
              </label>
            ))}
          </fieldset>
          <div className="field-w">
            <label htmlFor="f-msg">Conta um pouco do projeto</label>
            <textarea
              id="f-msg"
              name="message"
              placeholder="O que você precisa, para quando e qualquer referência que ajude"
            ></textarea>
          </div>
          <button className="btn btn-primary btn-lg magnetic" id="f-submit" type="submit">
            <span>Enviar mensagem</span>
          </button>
          <div id="formNote" role="status" aria-live="polite"></div>
        </form>
      </div>
      <canvas className="liquid" id="liquid" aria-hidden="true"></canvas>
    </section>
  );
}
