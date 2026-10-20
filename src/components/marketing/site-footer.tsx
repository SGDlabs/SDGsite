const LINKS = [
  { href: "#servicos", label: "Serviços" },
  { href: "#processo", label: "Processo" },
  { href: "#painel", label: "Painel do cliente" },
  { href: "#portfolio", label: "Portfólio" },
  { href: "#contato", label: "Contato" },
];

export function SiteFooter() {
  return (
    <footer className="foot">
      <div className="wrap">
        {/* the name rises out of the liquid when the footer scrolls into view */}
        <canvas className="bigword" id="bigword" role="img" aria-label="SDG Labs"></canvas>
        <div className="foot-row">
          <p>A fórmula do seu software.</p>
          <nav aria-label="Rodapé">
            {LINKS.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
          <p>© 2026 SDG Labs</p>
        </div>
      </div>
    </footer>
  );
}
