import { randomUUID } from "node:crypto";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ListSkeleton, PageHeader, Panel } from "@/components/admin/page-header";
import { PortfolioForm } from "@/components/admin/portfolio-form";
import { requireRole } from "@/lib/auth/current-user";

export const metadata: Metadata = { title: "Novo caso", robots: { index: false } };

export default function NewPortfolioItemPage() {
  return (
    <>
      <Link href="/admin/portfolio" className="self-start type-label">
        ← Portfólio
      </Link>
      <PageHeader title="Novo caso" />
      <Panel title="Caso">
        <Suspense fallback={<ListSkeleton rows={6} label="Preparando o formulário" />}>
          <NewForm />
        </Suspense>
      </Panel>
    </>
  );
}

async function NewForm() {
  await requireRole("admin");
  await connection();
  return (
    <PortfolioForm
      isNew
      initial={{
        // the id comes first: images upload to its folder before the case is saved
        id: randomUUID(),
        title: "",
        slug: "",
        summary: "",
        body: "",
        category: "site",
        stack: "",
        liveUrl: "",
        coverPath: "",
        coverAlt: "",
        gallery: [],
        generativeCover: "",
        pixelArt: false,
        featured: false,
        published: false,
      }}
    />
  );
}
