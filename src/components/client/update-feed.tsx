"use client";

import { useId, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fieldClasses } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UPDATE_KIND_LABELS, type UpdateKind } from "@/lib/project-labels";
import { cn } from "@/lib/utils";
import type { StageView, UpdateView } from "@/server/queries/projects";
import { MediaGallery } from "./media-gallery";

const KINDS = Object.keys(UPDATE_KIND_LABELS) as UpdateKind[];

interface UpdateFeedProps {
  updates: UpdateView[];
  stages: Pick<StageView, "id" | "position" | "title">[];
}

/** The project's feed, newest first, filtered by stage and by kind in the browser. */
export function UpdateFeed({ updates, stages }: UpdateFeedProps) {
  const [stageId, setStageId] = useState("");
  const [kind, setKind] = useState<UpdateKind | "">("");
  const stageSelect = useId();
  const stageTitle = new Map(stages.map((stage) => [stage.id, stage.title]));

  const visible = updates.filter(
    (update) => (!stageId || update.stageId === stageId) && (!kind || update.kind === kind),
  );
  const filtered = Boolean(stageId || kind);

  return (
    <div className="flex flex-col gap-6">
      {updates.length > 0 && (
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-6">
          <div className="flex flex-col gap-2 md:w-64">
            <Label htmlFor={stageSelect}>Etapa</Label>
            <select
              id={stageSelect}
              value={stageId}
              onChange={(event) => setStageId(event.target.value)}
              className={cn(fieldClasses, "min-h-11")}
            >
              <option value="">Todas as etapas</option>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.position}. {stage.title}
                </option>
              ))}
            </select>
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 type-label text-ink">Tipo</legend>
            <div className="flex flex-wrap gap-2">
              {[
                ["", "Todos"] as const,
                ...KINDS.map((k) => [k, UPDATE_KIND_LABELS[k]] as const),
              ].map(([value, text]) => (
                <Button
                  key={value || "all"}
                  size="sm"
                  variant={kind === value ? "primary" : "outline"}
                  aria-pressed={kind === value}
                  onClick={() => setKind(value)}
                >
                  {text}
                </Button>
              ))}
            </div>
          </fieldset>
        </div>
      )}

      {updates.length === 0 ? (
        <p className="rounded-md border border-dashed border-border-strong p-6 text-ink-muted">
          Nenhuma atualização ainda. Os prints, vídeos e notas do projeto aparecem aqui assim que a
          gente publicar.
        </p>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-md border border-dashed border-border-strong p-6">
          <p className="text-ink-muted">Nenhuma atualização com esses filtros.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setStageId("");
              setKind("");
            }}
          >
            Limpar filtros
          </Button>
        </div>
      ) : (
        <ol
          className="flex flex-col gap-4"
          aria-label={filtered ? "Atualizações filtradas" : "Atualizações"}
        >
          {visible.map((update) => (
            <li key={update.id}>
              <UpdateItem
                update={update}
                stageTitle={update.stageId ? stageTitle.get(update.stageId) : undefined}
              />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function UpdateItem({ update, stageTitle }: { update: UpdateView; stageTitle?: string }) {
  const images = update.media.filter((media) => media.kind === "image");
  const videos = update.media.filter((media) => media.kind === "video");

  return (
    <article className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 type-small text-ink-muted">
        <Badge size="sm" variant={update.kind === "marco" ? "accent" : "muted"}>
          {UPDATE_KIND_LABELS[update.kind]}
        </Badge>
        <time dateTime={update.createdAt}>{update.createdAtLabel}</time>
        {stageTitle && <span>{stageTitle}</span>}
      </div>
      <h3 className="type-h3">{update.title}</h3>
      {update.body && <p className="whitespace-pre-line">{update.body}</p>}
      {images.length > 0 && <MediaGallery images={images} title={update.title} />}
      {videos.map((video) => (
        // screen recordings, without speech to caption
        <video
          key={video.id}
          src={video.url}
          controls
          playsInline
          preload="metadata"
          aria-label={update.title}
          className="w-full rounded-sm border border-border bg-surface-alt"
        />
      ))}
    </article>
  );
}
