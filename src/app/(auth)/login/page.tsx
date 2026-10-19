import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Entrar", robots: { index: false } };

export default function LoginPage() {
  return <ComingSoon title="Entrar" text="O acesso à área do cliente está em construção." />;
}
