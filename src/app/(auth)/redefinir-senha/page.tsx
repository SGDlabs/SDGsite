import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { NewPasswordForm } from "@/components/auth/password-forms";

export const metadata: Metadata = {
  title: "Nova senha",
  robots: { index: false },
  // the link's token is in the URL: never send it to another site
  referrer: "no-referrer",
};

export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="Nova senha"
      description="Escolha a senha que você vai usar para entrar."
      footer={<Link href="/recuperar-senha">Pedir um novo link</Link>}
    >
      <NewPasswordForm />
    </AuthCard>
  );
}
