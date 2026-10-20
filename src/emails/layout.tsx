import type { CSSProperties, ReactNode } from "react";

// The building blocks of every e-mail: tables and inline styles, which is what e-mail clients
// read. Colors are the design system's grafite, petroleo, nevoa and surface-alt, as literals:
// e-mail clients know nothing of the site's CSS variables.

const INK = "#353535";
const ACCENT = "#3c6e71";
const MUTED = "#5a5a5a";
const LINE = "#d9d9d9";
const PAGE = "#f2f2f2";
const FONT = "Arial, Helvetica, sans-serif";

export const emailText: CSSProperties = {
  margin: "0 0 16px",
  fontSize: 16,
  lineHeight: "24px",
  color: INK,
};

/** The frame of every e-mail: the name SDG LABS on top, one white card, a short footer. */
export function EmailLayout({
  preview,
  footer,
  children,
}: {
  /** the line inboxes show next to the subject */
  preview: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <html lang="pt-BR">
      {/* an e-mail document, not a page: next/head does not apply */}
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, padding: 0, background: PAGE }}>
        <div style={{ display: "none", maxHeight: 0, overflow: "hidden" }}>{preview}</div>
        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          style={{ background: PAGE }}
        >
          <tbody>
            <tr>
              <td align="center" style={{ padding: "32px 16px" }}>
                <table
                  role="presentation"
                  width="100%"
                  cellPadding={0}
                  cellSpacing={0}
                  style={{
                    maxWidth: 520,
                    background: "#ffffff",
                    border: `1px solid ${LINE}`,
                    borderRadius: 8,
                  }}
                >
                  <tbody>
                    <tr>
                      <td style={{ padding: 32, fontFamily: FONT, color: INK }}>
                        <p
                          style={{
                            margin: "0 0 24px",
                            fontSize: 14,
                            fontWeight: "bold",
                            letterSpacing: 2,
                          }}
                        >
                          SDG <span style={{ color: ACCENT }}>LABS</span>
                        </p>
                        {children}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p
                  style={{
                    margin: "16px 0 0",
                    maxWidth: 520,
                    fontFamily: FONT,
                    fontSize: 12,
                    lineHeight: "18px",
                    color: MUTED,
                  }}
                >
                  {footer ?? "SDG Labs · A fórmula do seu software."}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}

export function EmailHeading({ children }: { children: ReactNode }) {
  return (
    <h1 style={{ margin: "0 0 16px", fontSize: 24, lineHeight: "32px", color: INK }}>{children}</h1>
  );
}

export function EmailText({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return (
    <p style={muted ? { ...emailText, fontSize: 14, lineHeight: "20px", color: MUTED } : emailText}>
      {children}
    </p>
  );
}

/** The one action of the e-mail. */
export function EmailButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <p style={{ margin: "8px 0 24px" }}>
      <a
        href={href}
        style={{
          display: "inline-block",
          padding: "12px 24px",
          background: ACCENT,
          color: "#ffffff",
          borderRadius: 4,
          fontSize: 16,
          fontWeight: "bold",
          textDecoration: "none",
        }}
      >
        {children}
      </a>
    </p>
  );
}

/** Label and value rows, for internal notices. */
export function EmailFacts({ facts }: { facts: [string, ReactNode][] }) {
  return (
    <table
      role="presentation"
      cellPadding={0}
      cellSpacing={0}
      style={{ margin: "0 0 16px", width: "100%" }}
    >
      <tbody>
        {facts.map(([label, value]) => (
          <tr key={label}>
            <td
              style={{
                padding: "6px 12px 6px 0",
                fontSize: 14,
                color: MUTED,
                verticalAlign: "top",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </td>
            <td style={{ padding: "6px 0", fontSize: 14, color: INK }}>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
