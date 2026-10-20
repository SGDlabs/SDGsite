import type { Metadata } from "next";
import { Suspense } from "react";
import { NewPasswordForm } from "@/components/auth/password-forms";
import { EmailPreferences } from "@/components/client/email-preferences";
import { Container } from "@/components/layout/container";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { requireRole } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sua conta", robots: { index: false } };

export default function AccountPage() {
  return (
    <main>
      <Container className="flex max-w-3xl flex-col gap-8 py-12 md:py-16">
        <header className="flex flex-col gap-3">
          <Eyebrow>Área do cliente</Eyebrow>
          <h1 className="type-h1">Sua conta</h1>
        </header>
        <Suspense fallback={<p className="text-ink-muted">Carregando…</p>}>
          <Account />
        </Suspense>
      </Container>
    </main>
  );
}

async function Account() {
  const user = await requireRole("client");
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("notify_updates")
    .eq("id", user.id)
    .single();

  return (
    <>
      <Card className="gap-2">
        <h2 className="type-h3">{user.name}</h2>
        <p className="text-ink-muted">{user.email}</p>
      </Card>
      <Card className="gap-4">
        <h2 className="type-h3">E-mails</h2>
        <EmailPreferences notifyUpdates={profile?.notify_updates ?? true} />
      </Card>
      <Card className="gap-4">
        <h2 className="type-h3">Trocar a senha</h2>
        <NewPasswordForm submitLabel="Trocar a senha" />
      </Card>
    </>
  );
}
