import { ContactForm } from "./contact-form";

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
        <ContactForm />
      </div>
      <canvas className="liquid" id="liquid" aria-hidden="true"></canvas>
    </section>
  );
}
