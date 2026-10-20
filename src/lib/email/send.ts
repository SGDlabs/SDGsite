import "server-only";
import { render } from "@react-email/render";
import type { ReactElement } from "react";
import { Resend } from "resend";
import { serverEnv } from "@/lib/env";

export interface Email {
  to: string[];
  subject: string;
  /** a template from src/emails */
  body: ReactElement;
}

/**
 * Sends one e-mail through Resend. Without RESEND_API_KEY (development, CI) it only logs the
 * subject, so every flow works without sending anything. Never throws: an e-mail that fails must
 * not undo what triggered it. Addresses are never logged.
 */
export async function sendEmail({ to, subject, body }: Email) {
  if (to.length === 0) return { sent: false as const, reason: "no recipients" };
  const { RESEND_API_KEY, EMAIL_FROM } = serverEnv();
  if (!RESEND_API_KEY || !EMAIL_FROM) {
    console.info("[email] not sent (RESEND_API_KEY or EMAIL_FROM unset)", {
      subject,
      recipients: to.length,
    });
    return { sent: false as const, reason: "not configured" };
  }

  try {
    const [html, text] = await Promise.all([render(body), render(body, { plainText: true })]);
    const { error } = await new Resend(RESEND_API_KEY).emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
      text,
    });
    if (error) {
      console.error("[email] not sent", { subject, name: error.name });
      return { sent: false as const, reason: error.name };
    }
    return { sent: true as const };
  } catch (error) {
    console.error("[email] not sent", { subject, error: (error as Error).message });
    return { sent: false as const, reason: "exception" };
  }
}

/** EMAIL_TEAM as a list ("a@x.com, b@x.com"). */
export function teamInbox() {
  return (serverEnv().EMAIL_TEAM ?? "")
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);
}
