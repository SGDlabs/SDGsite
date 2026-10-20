import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { LinkErrorNotice } from "@/components/auth/link-error";
import { RecoverForm } from "@/components/auth/recover-form";

export const metadata: Metadata = { title: "Recuperar senha", robots: { index: false } };

export default function RecoverPasswordPage() {
  return (
    <AuthCard
      title="Recuperar senha"
      description="Escreva o e-mail do seu acesso. A gente envia um link para você criar uma nova senha."
      footer={<Link href="/login">Voltar para entrar</Link>}
    >
      <Suspense fallback={null}>
        <LinkErrorNotice />
      </Suspense>
      <RecoverForm />
    </AuthCard>
  );
}
