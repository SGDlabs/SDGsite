import Link from "next/link";

export function SiteFooter({ onHome = false }: { onHome?: boolean }) {
  const to = (hash: string) => (onHome ? hash : `/${hash}`);
  const links = [
    { href: to("#servicos"), label: "Serviços" },
    { href: to("#processo"), label: "Processo" },
    { href: to("#painel"), label: "Painel do cliente" },
    { href: onHome ? "#portfolio" : "/portfolio", label: "Portfólio" },
    { href: to("#contato"), label: "Contato" },
    // not in the prototype: the way into the client area
    { href: "/login", label: "Entrar" },
  ];
  return (
    <footer className="foot">
      <div className="wrap">
        {/* the name rises out of the liquid when the footer scrolls into view */}
        <canvas className="bigword" id="bigword" role="img" aria-label="SDG Labs"></canvas>
        <div className="foot-row">
          <p>A fórmula do seu software.</p>
          <nav aria-label="Rodapé">
            {links.map((link) =>
              link.href.startsWith("#") ? (
                <a key={link.href} href={link.href}>
                  {link.label}
                </a>
              ) : (
                <Link key={link.href} href={link.href}>
                  {link.label}
                </Link>
              ),
            )}
          </nav>
          <p>© 2026 SDG Labs</p>
        </div>
      </div>
    </footer>
  );
}
