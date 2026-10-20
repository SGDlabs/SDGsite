import { cssVars } from "./brand";
import { NavLogo } from "./pixel-logo";

const LINKS = [
  { href: "#servicos", label: "Serviços" },
  { href: "#processo", label: "Processo" },
  { href: "#painel", label: "Painel do cliente" },
  { href: "#portfolio", label: "Portfólio" },
  { href: "#sobre", label: "Sobre" },
];

export function SiteNav() {
  return (
    <>
      <header className="nav" id="nav">
        <div className="nav-inner">
          <a href="#topo" className="brand" aria-label="SDG Labs, voltar ao início">
            <NavLogo />
          </a>
          <nav className="links" id="links" aria-label="Seções">
            <span className="hl" aria-hidden="true"></span>
            {LINKS.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
          <a href="#contato" className="btn btn-primary btn-sm nav-cta magnetic">
            <span>Começar um projeto</span>
          </a>
          <button
            className="menu-btn"
            id="menuBtn"
            type="button"
            aria-expanded="false"
            aria-controls="mobileMenu"
          >
            Menu
          </button>
        </div>
      </header>
      <div className="mobile-menu" id="mobileMenu" hidden>
        {LINKS.map((link, i) => (
          <a key={link.href} href={link.href} style={cssVars({ "--i": i })}>
            {link.label}
          </a>
        ))}
        <a href="#contato" className="btn btn-primary" style={cssVars({ "--i": 5 })}>
          <span>Começar um projeto</span>
        </a>
      </div>
    </>
  );
}
