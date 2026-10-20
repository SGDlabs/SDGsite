import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { LinkErrorNotice } from "@/components/auth/link-error";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Entrar", robots: { index: false } };

export default function LoginPage() {
  return (
    <AuthCard
      title="Entrar"
      description="Seu software, etapa por etapa. Entre para ver o andamento do seu projeto."
      footer={
        <p>
          O acesso é por convite. Ainda não trabalha com a gente?{" "}
          <Link href="/#contato">Conte sobre o seu projeto</Link>.
        </p>
      }
    >
      <Suspense fallback={null}>
        <LinkErrorNotice />
      </Suspense>
      <LoginForm />
    </AuthCard>
  );
}
