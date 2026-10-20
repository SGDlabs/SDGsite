import { EmailButton, EmailHeading, EmailLayout, EmailText } from "./layout";

export interface StageCompletedProps {
  name: string | null;
  projectName: string;
  completed: { position: number; title: string };
  /** the stage that starts now, or null when the project is done */
  next: { position: number; title: string } | null;
  total: number;
  url: string;
}

export const stageCompletedSubject = ({ projectName, next }: StageCompletedProps) =>
  next ? `${projectName}: etapa ${next.position} começou` : `${projectName}: projeto concluído`;

/** To the client, when the admin closes a stage. */
export function StageCompletedEmail(props: StageCompletedProps) {
  const { name, projectName, completed, next, total, url } = props;
  return (
    <EmailLayout
      preview={
        next
          ? `${completed.title} concluída. Agora: ${next.title}.`
          : `${completed.title} concluída: o projeto está pronto.`
      }
    >
      <EmailHeading>
        {next ? `Etapa ${completed.position} de ${total} concluída` : "Projeto concluído"}
      </EmailHeading>
      <EmailText>{`Olá${name ? `, ${name}` : ""}.`}</EmailText>
      <EmailText>
        A gente concluiu a etapa <strong>{completed.title}</strong> do projeto {projectName}.
      </EmailText>
      {next ? (
        <EmailText>
          Agora começa a etapa {next.position} de {total}: <strong>{next.title}</strong>. As
          novidades aparecem na área do cliente assim que saírem.
        </EmailText>
      ) : (
        <EmailText>Era a última etapa: seu projeto está pronto. Obrigado pela parceria.</EmailText>
      )}
      <EmailButton href={url}>Ver o projeto</EmailButton>
      <EmailText muted>Seu software, etapa por etapa.</EmailText>
    </EmailLayout>
  );
}
