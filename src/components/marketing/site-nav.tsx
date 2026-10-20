import Link from "next/link";
import type { ComponentProps } from "react";
import { cssVars } from "./brand";
import { NavLogo } from "./pixel-logo";

/** On the home page the nav scrolls to sections; elsewhere it links back to them. */
function navLinks(onHome: boolean) {
  const to = (hash: string) => (onHome ? hash : `/${hash}`);
  return [
    { href: to("#servicos"), label: "Serviços" },
    { href: to("#processo"), label: "Processo" },
    { href: to("#painel"), label: "Painel do cliente" },
    { href: onHome ? "#portfolio" : "/portfolio", label: "Portfólio" },
    { href: to("#sobre"), label: "Sobre" },
  ];
}

/** Hash links stay plain anchors (the landing script scrolls to them); page links use next/link. */
function NavAnchor({ href, ...props }: ComponentProps<"a"> & { href: string }) {
  return href.startsWith("#") ? <a href={href} {...props} /> : <Link href={href} {...props} />;
}

export function SiteNav({ onHome = false, current }: { onHome?: boolean; current?: string }) {
  const links = navLinks(onHome);
  const contact = onHome ? "#contato" : "/#contato";
  return (
    <>
      <header className="nav" id="nav">
        <div className="nav-inner">
          <NavAnchor
            href={onHome ? "#topo" : "/"}
            className="brand"
            aria-label="SDG Labs, voltar ao início"
          >
            <NavLogo />
          </NavAnchor>
          <nav className="links" id="links" aria-label="Seções">
            <span className="hl" aria-hidden="true"></span>
            {links.map((link) => (
              <NavAnchor
                key={link.href}
                href={link.href}
                aria-current={current === link.href ? "page" : undefined}
              >
                {link.label}
              </NavAnchor>
            ))}
          </nav>
          <NavAnchor href={contact} className="btn btn-primary btn-sm nav-cta magnetic">
            <span>Começar um projeto</span>
          </NavAnchor>
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
        {links.map((link, i) => (
          <NavAnchor key={link.href} href={link.href} style={cssVars({ "--i": i })}>
            {link.label}
          </NavAnchor>
        ))}
        <NavAnchor href={contact} className="btn btn-primary" style={cssVars({ "--i": 5 })}>
          <span>Começar um projeto</span>
        </NavAnchor>
      </div>
    </>
  );
}
