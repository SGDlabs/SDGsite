"use client";

import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type RealtimeStatus = "connecting" | "live" | "offline";

/**
 * Listens to one project's changes (the project, its stages and its feed) through Supabase
 * Realtime, which only delivers rows the user may read (RLS). Each change refreshes the page's
 * server data, so the first load and every update come from the same server code; a burst of
 * changes (advancing a stage writes three rows) becomes one refresh.
 */
export function useProjectRealtime(
  projectId: string,
  onNewUpdate?: (update: { title: string }) => void,
  { enabled = true }: { enabled?: boolean } = {},
): RealtimeStatus {
  const router = useRouter();
  const [status, setStatus] = useState<RealtimeStatus>("connecting");
  const announce = useEffectEvent((update: { title: string }) => onNewUpdate?.(update));

  useEffect(() => {
    if (!enabled) return;
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let dropped = false;
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | undefined;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), 200);
    };

    const subscribe = () =>
      supabase
        // wait: SUBSCRIBED only once the database changes are really flowing
        .channel(`project:${projectId}`, { config: { postgres_changes_options: { wait: true } } })
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "projects", filter: `id=eq.${projectId}` },
          refresh,
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "project_stages",
            filter: `project_id=eq.${projectId}`,
          },
          refresh,
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "project_updates",
            filter: `project_id=eq.${projectId}`,
          },
          (payload) => {
            if (payload.eventType === "INSERT" && typeof payload.new.title === "string") {
              announce({ title: payload.new.title });
            }
            refresh();
          },
        )
        .subscribe((state) => {
          if (state === "SUBSCRIBED") {
            setStatus("live");
            // back after a drop: catch up with whatever changed meanwhile
            if (dropped) refresh();
          } else if (state === "CHANNEL_ERROR" || state === "TIMED_OUT") {
            dropped = true;
            setStatus("offline");
          }
        });

    // The user's token must reach Realtime before the channel joins. supabase-js hands it over
    // only after reading the session, and a channel that joins first is a visitor's: row level
    // security then filters out every change.
    void supabase.realtime.setAuth().then(() => {
      if (!cancelled) channel = subscribe();
    });

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [projectId, router, enabled]);

  return status;
}
