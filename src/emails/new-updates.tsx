import { EmailButton, EmailHeading, EmailLayout, EmailText, emailText } from "./layout";

export interface NewUpdatesProps {
  name: string | null;
  projectName: string;
  updates: { kind: string; title: string; when: string }[];
  url: string;
  /** /painel/conta, where the client silences these e-mails */
  preferencesUrl: string;
}

export const newUpdatesSubject = ({ projectName, updates }: NewUpdatesProps) =>
  updates.length === 1
    ? `${projectName}: ${updates[0]!.title}`
    : `${projectName}: ${updates.length} novidades`;

/** The feed's news, grouped: at most one of these per project every 2 hours. */
export function NewUpdatesEmail({
  name,
  projectName,
  updates,
  url,
  preferencesUrl,
}: NewUpdatesProps) {
  return (
    <EmailLayout
      preview={`Nova atualização: ${updates[0]?.title ?? projectName}.`}
      footer={
        <>
          Você recebe este e-mail porque acompanha {projectName} na área do cliente da SDG Labs.
          Para não receber mais as novidades por e-mail, ajuste em{" "}
          <a href={preferencesUrl} style={{ color: "#3c6e71" }}>
            sua conta
          </a>
          .
        </>
      }
    >
      <EmailHeading>Novidades em {projectName}</EmailHeading>
      <EmailText>{`Olá${name ? `, ${name}` : ""}. Saiu coisa nova no seu projeto:`}</EmailText>
      <ul style={{ ...emailText, paddingLeft: 20 }}>
        {updates.map((update, index) => (
          <li key={index} style={{ marginBottom: 8 }}>
            <strong>{update.title}</strong>
            <br />
            <span style={{ fontSize: 14, color: "#5a5a5a" }}>
              {update.kind} · {update.when}
            </span>
          </li>
        ))}
      </ul>
      <EmailButton href={url}>Ver as novidades</EmailButton>
    </EmailLayout>
  );
}
