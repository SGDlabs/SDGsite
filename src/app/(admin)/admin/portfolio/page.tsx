import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ListSkeleton, PageHeader } from "@/components/admin/page-header";
import { PortfolioFlag, PortfolioOrderButtons } from "@/components/admin/portfolio-row-actions";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireRole } from "@/lib/auth/current-user";
import { getAdminPortfolio } from "@/server/queries/admin";
import { PORTFOLIO_CATEGORIES } from "@/types/portfolio";

export const metadata: Metadata = { title: "Portfólio", robots: { index: false } };

export default function AdminPortfolioPage() {
  return (
    <>
      <PageHeader
        title="Portfólio"
        description="Os casos de /portfolio, na ordem em que aparecem. Os em destaque vão para a landing."
        action={
          <Button asChild>
            <Link href="/admin/portfolio/novo">Novo caso</Link>
          </Button>
        }
      />
      <Suspense fallback={<ListSkeleton label="Carregando o portfólio" />}>
        <PortfolioTable />
      </Suspense>
    </>
  );
}

async function PortfolioTable() {
  await requireRole("admin");
  const items = await getAdminPortfolio();
  if (items.length === 0) {
    return <p className="text-ink-muted">Nenhum caso ainda. Comece por “Novo caso”.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ordem</TableHead>
          <TableHead>Caso</TableHead>
          <TableHead>Categoria</TableHead>
          <TableHead>Publicado</TableHead>
          <TableHead>Destaque</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item, index) => (
          <TableRow key={item.id}>
            <TableCell>
              <PortfolioOrderButtons
                id={item.id}
                title={item.title}
                isFirst={index === 0}
                isLast={index === items.length - 1}
              />
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-0.5">
                <Link href={`/admin/portfolio/${item.id}`} className="type-label">
                  {item.title}
                </Link>
                <span className="text-ink-muted">/portfolio/{item.slug}</span>
              </div>
            </TableCell>
            <TableCell>{PORTFOLIO_CATEGORIES[item.category]}</TableCell>
            <TableCell>
              <PortfolioFlag
                id={item.id}
                flag="published"
                value={item.published}
                label={`${item.title} publicado`}
              />
            </TableCell>
            <TableCell>
              <PortfolioFlag
                id={item.id}
                flag="featured"
                value={item.featured}
                label={`${item.title} em destaque`}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
