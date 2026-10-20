import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ListSkeleton, PageHeader, Panel } from "@/components/admin/page-header";
import { DeletePortfolioItem } from "@/components/admin/delete-portfolio-item";
import { PortfolioForm } from "@/components/admin/portfolio-form";
import { requireRole } from "@/lib/auth/current-user";
import type { GENERATIVE_COVERS } from "@/lib/validations/portfolio";
import { getAdminPortfolioItem } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Caso", robots: { index: false } };

export default function PortfolioItemPage({ params }: PageProps<"/admin/portfolio/[id]">) {
  return (
    <>
      <Link href="/admin/portfolio" className="self-start type-label">
        ← Portfólio
      </Link>
      <Suspense fallback={<ListSkeleton rows={8} label="Carregando o caso" />}>
        <Item params={params} />
      </Suspense>
    </>
  );
}

function galleryOf(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((image) =>
    image && typeof image === "object" && typeof image.path === "string"
      ? [{ path: image.path as string, alt: typeof image.alt === "string" ? image.alt : "" }]
      : [],
  );
}

async function Item({ params }: Pick<PageProps<"/admin/portfolio/[id]">, "params">) {
  await requireRole("admin");
  const { id } = await params;
  const item = await getAdminPortfolioItem(id);
  if (!item) notFound();

  return (
    <>
      <PageHeader
        eyebrow={item.published ? "Publicado" : "Rascunho"}
        title={item.title}
        action={
          item.published ? (
            <Link href={`/portfolio/${item.slug}`} className="type-label">
              Ver no site
            </Link>
          ) : undefined
        }
      />
      <Panel title="Caso">
        <PortfolioForm
          isNew={false}
          initial={{
            id: item.id,
            title: item.title,
            slug: item.slug,
            summary: item.summary,
            body: item.body,
            category: item.category,
            stack: item.stack.join(", "),
            liveUrl: item.live_url ?? "",
            coverPath: item.cover_path ?? "",
            coverAlt: item.cover_alt,
            gallery: galleryOf(item.gallery),
            generativeCover: (item.generative_cover ?? "") as
              (typeof GENERATIVE_COVERS)[number] | "",
            pixelArt: item.pixel_art,
            featured: item.featured,
            published: item.published,
          }}
        />
      </Panel>
      <Panel title="Excluir">
        <DeletePortfolioItem id={item.id} title={item.title} />
      </Panel>
    </>
  );
}
