import "server-only";
import { createElement } from "react";
import { LeadReceivedEmail, leadReceivedSubject } from "@/emails/lead-received";
import { NewUpdatesEmail, newUpdatesSubject } from "@/emails/new-updates";
import { StageCompletedEmail, stageCompletedSubject } from "@/emails/stage-completed";
import { sendEmail, teamInbox } from "@/lib/email/send";
import { formatDateTime } from "@/lib/format";
import { interestLabel } from "@/lib/lead-labels";
import { UPDATE_KIND_LABELS } from "@/lib/project-labels";
import { createAdminClient } from "@/lib/supabase/admin";

// E-mails triggered by what happens in the site. They run with after() (once the response is
// sent) and never throw: a mail server down must not undo a stage or lose a lead.

export interface Recipient {
  email: string;
  name: string | null;
}

/**
 * The people of a client company who receive project e-mails: client users who already accepted
 * the invitation (an unconfirmed address may not be theirs yet). `onlyUpdates`: those who did not
 * silence the feed's news in /painel/conta.
 */
export async function clientRecipients(
  clientId: string,
  { onlyUpdates = false } = {},
): Promise<Recipient[]> {
  const admin = createAdminClient();
  let query = admin
    .from("profiles")
    .select("id, full_name")
    .eq("client_id", clientId)
    .eq("role", "client");
  if (onlyUpdates) query = query.eq("notify_updates", true);
  const { data: profiles } = await query;

  const recipients = await Promise.all(
    (profiles ?? []).map(async (profile) => {
      const { data } = await admin.auth.admin.getUserById(profile.id);
      const user = data.user;
      return user?.email && user.email_confirmed_at
        ? { email: user.email, name: profile.full_name }
        : null;
    }),
  );
  return recipients.filter((recipient): recipient is Recipient => recipient !== null);
}

/** "Etapa concluída": to the client's people, after the admin advances a stage. */
export async function notifyStageCompleted(input: {
  projectId: string;
  /** the stage that started, or null when the project is done (advance_project_stage's result) */
  next: { position: number; title: string } | null;
  origin: string;
}) {
  try {
    const { data: project } = await createAdminClient()
      .from("projects")
      .select("id, name, client_id, project_stages (position, title, status)")
      .eq("id", input.projectId)
      .single();
    if (!project) return;

    const stages = [...project.project_stages].sort((a, b) => a.position - b.position);
    const completed = input.next
      ? stages.findLast((stage) => stage.position < input.next!.position)
      : stages.at(-1);
    if (!completed) return;

    const recipients = await clientRecipients(project.client_id);
    for (const recipient of recipients) {
      const props = {
        name: recipient.name,
        projectName: project.name,
        completed: { position: completed.position, title: completed.title },
        next: input.next,
        total: stages.length,
        url: `${input.origin}/painel/projetos/${project.id}`,
      };
      await sendEmail({
        to: [recipient.email],
        subject: stageCompletedSubject(props),
        body: createElement(StageCompletedEmail, props),
      });
    }
  } catch (error) {
    console.error("[notifications] stage completed", { error: (error as Error).message });
  }
}

/** To the partners, when a lead arrives through the site's form. */
export async function notifyNewLead(input: {
  lead: { name: string; email: string; company?: string; types: string[]; message?: string };
  origin: string;
}) {
  try {
    const props = {
      name: input.lead.name,
      email: input.lead.email,
      company: input.lead.company || null,
      interest: input.lead.types.map(interestLabel),
      message: input.lead.message || null,
      url: `${input.origin}/admin/leads?status=novo`,
    };
    await sendEmail({
      to: teamInbox(),
      subject: leadReceivedSubject(props),
      body: createElement(LeadReceivedEmail, props),
    });
  } catch (error) {
    console.error("[notifications] new lead", { error: (error as Error).message });
  }
}

/** At most one news e-mail per project in this window (claim_project_digest enforces it). */
export const DIGEST_EVERY = "2 hours";

/**
 * "Nova atualização": the project's news since the last digest, to the client's people who did
 * not silence it, if the last digest was sent at least two hours ago. Called right after a post
 * (often too soon: then it does nothing) and by the hourly cron, which catches what was left.
 * Returns whether a digest went out.
 */
export async function sendProjectDigest(input: { projectId: string; origin: string }) {
  try {
    const admin = createAdminClient();
    const { data: claim } = await admin
      .rpc("claim_project_digest", { p_project_id: input.projectId, p_every: DIGEST_EVERY })
      .single();
    if (!claim?.allowed) return false;

    const [{ data: project }, { data: updates }] = await Promise.all([
      admin.from("projects").select("id, name, client_id").eq("id", input.projectId).single(),
      admin
        .from("project_updates")
        .select("kind, title, created_at")
        .eq("project_id", input.projectId)
        .neq("kind", "marco")
        .gt("created_at", claim.since)
        .order("created_at"),
    ]);
    if (!project || !updates?.length) return false;

    const recipients = await clientRecipients(project.client_id, { onlyUpdates: true });
    for (const recipient of recipients) {
      const props = {
        name: recipient.name,
        projectName: project.name,
        updates: updates.map((update) => ({
          kind: UPDATE_KIND_LABELS[update.kind],
          title: update.title,
          when: formatDateTime(update.created_at),
        })),
        url: `${input.origin}/painel/projetos/${project.id}`,
        preferencesUrl: `${input.origin}/painel/conta`,
      };
      await sendEmail({
        to: [recipient.email],
        subject: newUpdatesSubject(props),
        body: createElement(NewUpdatesEmail, props),
      });
    }
    return true;
  } catch (error) {
    console.error("[notifications] digest", { error: (error as Error).message });
    return false;
  }
}

/** The cron's round: every project with news not yet sent. */
export async function sendPendingDigests(origin: string) {
  const { data: projects } = await createAdminClient()
    .from("projects")
    .select("id")
    .in("status", ["ativo", "pausado"]);
  let sent = 0;
  for (const project of projects ?? []) {
    if (await sendProjectDigest({ projectId: project.id, origin })) sent += 1;
  }
  return sent;
}
