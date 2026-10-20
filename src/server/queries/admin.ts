import "server-only";
import { z } from "zod";
import { formatDateTime, formatDay } from "@/lib/format";
import type { ProjectStatus, ProjectType, UpdateKind } from "@/lib/project-labels";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { LeadStatus } from "@/lib/lead-labels";
import type { Tables } from "@/types/database";

// Reads for the admin panel, as the signed-in admin (row level security lets admins read
// everything). Call requireRole("admin") first.

const fail = (what: string, error: { code?: string; message: string }) =>
  new Error(`${what} could not be read (${error.code ?? error.message})`);

export interface OverviewProject {
  id: string;
  name: string;
  clientName: string;
  type: ProjectType;
  currentPosition: number;
  stageCount: number;
  currentTitle: string | undefined;
}

export interface OverviewUpdate {
  id: string;
  projectId: string;
  projectName: string;
  kind: UpdateKind;
  title: string;
  createdAt: string;
  createdAtLabel: string;
}

/** /admin: active projects, the lead inbox and the latest posts. */
export async function getOverview() {
  const supabase = await createClient();
  const [projects, leads, newLeads, updates] = await Promise.all([
    supabase
      .from("projects")
      .select(
        "id, name, type, current_stage_position, clients (name), project_stages (position, title)",
      )
      .eq("status", "ativo")
      .order("updated_at", { ascending: false }),
    supabase
      .from("leads")
      .select("id, name, company, created_at")
      .eq("status", "novo")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "novo"),
    supabase
      .from("project_updates")
      .select("id, project_id, kind, title, created_at, projects (name)")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);
  for (const [what, result] of [
    ["projects", projects],
    ["leads", leads],
    ["lead count", newLeads],
    ["updates", updates],
  ] as const) {
    if (result.error) throw fail(what, result.error);
  }

  return {
    projects: (projects.data ?? []).map((row): OverviewProject => ({
      id: row.id,
      name: row.name,
      clientName: row.clients?.name ?? "",
      type: row.type,
      currentPosition: row.current_stage_position,
      stageCount: row.project_stages.length,
      currentTitle: row.project_stages.find((s) => s.position === row.current_stage_position)
        ?.title,
    })),
    newLeadCount: newLeads.count ?? 0,
    newLeads: (leads.data ?? []).map((lead) => ({
      id: lead.id,
      name: lead.name,
      company: lead.company,
      createdAtLabel: formatDay(lead.created_at),
    })),
    updates: (updates.data ?? []).map((row): OverviewUpdate => ({
      id: row.id,
      projectId: row.project_id,
      projectName: row.projects?.name ?? "",
      kind: row.kind,
      title: row.title,
      createdAt: row.created_at,
      createdAtLabel: formatDateTime(row.created_at),
    })),
  };
}

export interface ClientRow {
  id: string;
  name: string;
  contactEmail: string | null;
  projectCount: number;
  userCount: number;
}

/** /admin/clientes */
export async function getClients(): Promise<ClientRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, contact_email, projects (count), profiles (count)")
    .order("name");
  if (error) throw fail("clients", error);
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    contactEmail: row.contact_email,
    projectCount: row.projects[0]?.count ?? 0,
    userCount: row.profiles[0]?.count ?? 0,
  }));
}

export type ClientDetail = Tables<"clients"> & {
  projects: { id: string; name: string; type: ProjectType; status: ProjectStatus }[];
};

/** /admin/clientes/[id], or null when the id does not exist. */
export async function getClient(id: string): Promise<ClientDetail | null> {
  if (!z.uuid().safeParse(id).success) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*, projects (id, name, type, status)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw fail("client", error);
  return data;
}

export interface ClientUser {
  id: string;
  name: string | null;
  email: string;
  /** "Convite enviado", "Ativo desde…" */
  status: string;
}

/**
 * The people with access to a client's area. E-mails and sign-in dates live in Supabase Auth,
 * which only the service role reads.
 */
export async function getClientUsers(clientId: string): Promise<ClientUser[]> {
  const supabase = await createClient();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("client_id", clientId)
    .order("created_at");
  if (error) throw fail("client users", error);
  if (profiles.length === 0) return [];

  const admin = createAdminClient();
  const users = await Promise.all(
    profiles.map(async (profile) => {
      const { data } = await admin.auth.admin.getUserById(profile.id);
      const user = data.user;
      const status = user?.last_sign_in_at
        ? `Último acesso em ${formatDay(user.last_sign_in_at)}`
        : user?.invited_at
          ? `Convite enviado em ${formatDay(user.invited_at)}`
          : "Sem acesso ainda";
      return { id: profile.id, name: profile.full_name, email: user?.email ?? "", status };
    }),
  );
  return users;
}

export interface LeadRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  message: string | null;
  interest: string[];
  status: LeadStatus;
  createdAtLabel: string;
}

/** /admin/leads, newest first, optionally one status only. */
export async function getLeads(status?: LeadStatus): Promise<LeadRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("leads")
    .select("id, name, email, phone, company, message, service_interest, status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw fail("leads", error);
  return data.map((lead) => ({
    id: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    company: lead.company,
    message: lead.message,
    interest: lead.service_interest,
    status: lead.status,
    createdAtLabel: formatDateTime(lead.created_at),
  }));
}
