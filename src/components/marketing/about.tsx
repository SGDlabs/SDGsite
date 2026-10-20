const TEAM = [
  { letter: "G", name: "Gustavo", text: "[Uma frase sobre a sua área e experiência]" },
  { letter: "D", name: "Daniel", text: "[Uma frase sobre a área e a experiência dele]" },
];

export function About() {
  return (
    <section className="sec" id="sobre" style={{ paddingTop: 0 }}>
      <div className="wrap about">
        <div>
          <h2 className="h2 fill-text">Dois sócios, um laboratório</h2>
          <p className="lead">
            A SDG Labs é a software house do Gustavo e do Daniel. Quem fecha um projeto com a gente
            fala direto com quem escreve o código.
          </p>
        </div>
        <div className="team">
          {TEAM.map((member) => (
            <article key={member.name} className="member tilt">
              <canvas data-letter={member.letter} aria-hidden="true"></canvas>
              <h3>{member.name}</h3>
              <span className="role">Sócio-fundador</span>
              <p>{member.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
