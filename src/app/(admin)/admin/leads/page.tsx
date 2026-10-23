import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DeleteLead } from "@/components/admin/delete-lead";
import { LeadStatusSelect } from "@/components/admin/lead-status-select";
import { ListSkeleton, PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireRole } from "@/lib/auth/current-user";
import {
  interestLabel,
  LEAD_STATUS_LABELS,
  LEAD_STATUSES,
  type LeadStatus,
} from "@/lib/lead-labels";
import { cn } from "@/lib/utils";
import { getLeads } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Leads", robots: { index: false } };

export default function LeadsPage({ searchParams }: PageProps<"/admin/leads">) {
  return (
    <>
      <PageHeader title="Leads" description="Quem escreveu pelo formulário do site." />
      <Suspense fallback={<ListSkeleton label="Carregando os leads" />}>
        <Leads searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const isStatus = (value: unknown): value is LeadStatus =>
  typeof value === "string" && (LEAD_STATUSES as string[]).includes(value);

async function Leads({ searchParams }: Pick<PageProps<"/admin/leads">, "searchParams">) {
  await requireRole("admin");
  const { status } = await searchParams;
  const filter = isStatus(status) ? status : undefined;
  const leads = await getLeads(filter);

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Filtrar por status" className="flex flex-wrap gap-2">
        {[undefined, ...LEAD_STATUSES].map((option) => (
          <Link
            key={option ?? "todos"}
            href={option ? `/admin/leads?status=${option}` : "/admin/leads"}
            aria-current={filter === option ? "page" : undefined}
            className={cn(
              "inline-flex min-h-9 items-center rounded-sm border px-4 type-label no-underline",
              filter === option
                ? "border-accent bg-accent text-on-accent"
                : "border-border-strong text-ink hover:bg-surface-alt",
            )}
          >
            {option ? LEAD_STATUS_LABELS[option] : "Todos"}
          </Link>
        ))}
      </nav>

      {leads.length === 0 ? (
        <p className="text-ink-muted">
          {filter ? "Nenhum lead com esse status." : "Nenhum lead ainda."}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quando</TableHead>
              <TableHead>Quem</TableHead>
              <TableHead>Interesse</TableHead>
              <TableHead>Mensagem</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id} className="align-top">
                <TableCell className="whitespace-nowrap text-ink-muted">
                  {lead.createdAtLabel}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="type-label">{lead.name}</span>
                    {lead.company && <span className="text-ink-muted">{lead.company}</span>}
                    <a href={`mailto:${lead.email}`}>{lead.email}</a>
                    {lead.phone && <span className="text-ink-muted">{lead.phone}</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {lead.interest.length === 0
                      ? "—"
                      : lead.interest.map((value) => (
                          <Badge key={value} size="sm" variant="muted">
                            {interestLabel(value)}
                          </Badge>
                        ))}
                  </div>
                </TableCell>
                <TableCell className="max-w-80 min-w-56">
                  {lead.message ? <p className="whitespace-pre-line">{lead.message}</p> : "—"}
                </TableCell>
                <TableCell className="min-w-40">
                  <div className="flex flex-col gap-2">
                    <LeadStatusSelect id={lead.id} status={lead.status} leadName={lead.name} />
                    <DeleteLead id={lead.id} leadName={lead.name} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
