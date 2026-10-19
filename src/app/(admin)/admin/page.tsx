import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default function AdminPage() {
  return <ComingSoon title="Admin" text="O painel dos sócios está em construção." />;
}
