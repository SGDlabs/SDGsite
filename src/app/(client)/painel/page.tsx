import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Painel", robots: { index: false } };

export default function ClientDashboardPage() {
  return <ComingSoon title="Seus projetos" text="O painel de acompanhamento está em construção." />;
}
