import { EmailButton, EmailFacts, EmailHeading, EmailLayout, EmailText } from "./layout";

export interface LeadReceivedProps {
  name: string;
  email: string;
  company: string | null;
  interest: string[];
  message: string | null;
  url: string;
}

export const leadReceivedSubject = ({ name, company }: LeadReceivedProps) =>
  `Novo lead: ${name}${company ? ` (${company})` : ""}`;

/** To the partners, when someone writes through the site's form. */
export function LeadReceivedEmail({
  name,
  email,
  company,
  interest,
  message,
  url,
}: LeadReceivedProps) {
  return (
    <EmailLayout preview={`${name} escreveu pelo site.`} footer="Aviso interno da SDG Labs.">
      <EmailHeading>Novo lead pelo site</EmailHeading>
      <EmailFacts
        facts={[
          ["Nome", name],
          [
            "E-mail",
            <a key="email" href={`mailto:${email}`}>
              {email}
            </a>,
          ],
          ["Empresa", company ?? "—"],
          ["Interesse", interest.length > 0 ? interest.join(", ") : "—"],
        ]}
      />
      {message && (
        <EmailText>
          <span style={{ whiteSpace: "pre-line" }}>{message}</span>
        </EmailText>
      )}
      <EmailButton href={url}>Abrir os leads</EmailButton>
    </EmailLayout>
  );
}
