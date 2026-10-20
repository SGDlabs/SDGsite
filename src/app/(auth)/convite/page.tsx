import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { InviteForm } from "@/components/auth/password-forms";

export const metadata: Metadata = {
  title: "Convite",
  robots: { index: false },
  // the invitation's token is in the URL: never send it to another site
  referrer: "no-referrer",
};

export default function InvitePage() {
  return (
    <AuthCard
      title="Boas-vindas"
      description="Confirme seu nome e escolha uma senha. Depois disso, você acompanha o projeto por aqui."
    >
      <InviteForm />
    </AuthCard>
  );
}
