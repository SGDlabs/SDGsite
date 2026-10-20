import "server-only";
import { z } from "zod";
import { formatDateTime, formatDay } from "@/lib/format";
import type { ProjectStatus, ProjectType, StageStatus, UpdateKind } from "@/lib/project-labels";
import { createClient } from "@/lib/supabase/server";

// Reads for the client area, always as the signed-in user: row level security decides which
// projects come back (a client's company only; everything for an admin). Call requireRole first.

/** Signed media links last this long; every render (and every realtime refresh) signs again. */
const SIGNED_URL_SECONDS = 60 * 60;

export interface StageView {
  id: string;
  position: number;
  title: string;
  description: string | null;
  status: StageStatus;
  startedAt: string | null;
  completedAt: string | null;
}

export interface ProjectSummary {
  id: string;
  name: string;
  type: ProjectType;
  status: ProjectStatus;
  currentPosition: number;
  stages: Pick<StageView, "position" | "title" | "status">[];
  /** "18 de out. de 2026", or null before the first update */
  lastUpdate: string | null;
}

export interface MediaView {
  id: string;
  url: string;
  kind: "image" | "video";
  mimeType: string;
  width: number | null;
  height: number | null;
}

export interface UpdateView {
  id: string;
  kind: UpdateKind;
  title: string;
  body: string | null;
  stageId: string | null;
  createdAt: string;
  createdAtLabel: string;
  media: MediaView[];
}

export interface ProjectDetail {
  id: string;
  name: string;
  type: ProjectType;
  status: ProjectStatus;
  currentPosition: number;
  startedAt: string | null;
  dueAt: string | null;
  /** "18 de out. de 2026" */
  dueAtLabel: string | null;
  stages: (StageView & { startedAtLabel: string | null; completedAtLabel: string | null })[];
  updates: UpdateView[];
}

const byPosition = <T extends { position: number }>(a: T, b: T) => a.position - b.position;

/** The projects the signed-in user can see, newest first, for the /painel cards. */
export async function getMyProjects(): Promise<ProjectSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, name, type, status, current_stage_position, project_stages (position, title, status), project_updates (created_at)",
    )
    .order("created_at", { ascending: false })
    .order("created_at", { referencedTable: "project_updates", ascending: false })
    .limit(1, { referencedTable: "project_updates" });
  if (error) throw new Error(`projects could not be read (${error.code})`);

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    status: row.status,
    currentPosition: row.current_stage_position,
    stages: [...row.project_stages].sort(byPosition),
    lastUpdate: row.project_updates[0] ? formatDay(row.project_updates[0].created_at) : null,
  }));
}

/**
 * One project with its stages and feed, newest update first, and signed links to its media.
 * Null when it does not exist or the user may not see it (the same answer, on purpose).
 */
export async function getProject(id: string): Promise<ProjectDetail | null> {
  if (!z.uuid().safeParse(id).success) return null;

  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("projects")
    .select(
      `id, name, type, status, current_stage_position, started_at, due_at,
       project_stages (id, position, title, description, status, started_at, completed_at),
       project_updates (id, kind, title, body, stage_id, created_at,
         update_media (id, storage_path, mime_type, width, height, created_at))`,
    )
    .eq("id", id)
    .order("created_at", { referencedTable: "project_updates", ascending: false })
    .maybeSingle();
  if (error) throw new Error(`project could not be read (${error.code})`);
  if (!row) return null;

  const paths = row.project_updates.flatMap((update) =>
    update.update_media.map((media) => media.storage_path),
  );
  const signed = new Map<string, string>();
  if (paths.length > 0) {
    const { data: urls, error: signError } = await supabase.storage
      .from("project-media")
      .createSignedUrls(paths, SIGNED_URL_SECONDS);
    if (signError) throw new Error(`media links could not be signed (${signError.message})`);
    for (const url of urls) if (url.path && url.signedUrl) signed.set(url.path, url.signedUrl);
  }

  return {
    id: row.id,
    name: row.name,
    type: row.type,
    status: row.status,
    currentPosition: row.current_stage_position,
    startedAt: row.started_at,
    dueAt: row.due_at,
    dueAtLabel: row.due_at ? formatDay(row.due_at) : null,
    stages: [...row.project_stages].sort(byPosition).map((stage) => ({
      id: stage.id,
      position: stage.position,
      title: stage.title,
      description: stage.description,
      status: stage.status,
      startedAt: stage.started_at,
      completedAt: stage.completed_at,
      startedAtLabel: stage.started_at ? formatDay(stage.started_at) : null,
      completedAtLabel: stage.completed_at ? formatDay(stage.completed_at) : null,
    })),
    updates: row.project_updates.map((update) => ({
      id: update.id,
      kind: update.kind,
      title: update.title,
      body: update.body,
      stageId: update.stage_id,
      createdAt: update.created_at,
      createdAtLabel: formatDateTime(update.created_at),
      media: [...update.update_media]
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .flatMap((media) => {
          const url = signed.get(media.storage_path);
          if (!url) return [];
          return [
            {
              id: media.id,
              url,
              kind: media.mime_type.startsWith("video/") ? ("video" as const) : ("image" as const),
              mimeType: media.mime_type,
              width: media.width,
              height: media.height,
            },
          ];
        }),
    })),
  };
}
