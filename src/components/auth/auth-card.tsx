import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";

interface AuthCardProps {
  title: string;
  description: ReactNode;
  children: ReactNode;
  /** links under the form: back to sign in, forgot the password… */
  footer?: ReactNode;
}

/** The one card of each sign-in page, so it gets the pixel shadow. */
export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <Card featured className="gap-6 md:p-8">
      <header className="flex flex-col gap-2">
        <Eyebrow>Área do cliente</Eyebrow>
        <h1 className="type-h2">{title}</h1>
        <p className="type-body text-ink-muted">{description}</p>
      </header>
      {children}
      {footer && (
        <div className="flex flex-col gap-2 border-t border-border pt-4 type-small text-ink-muted">
          {footer}
        </div>
      )}
    </Card>
  );
}
