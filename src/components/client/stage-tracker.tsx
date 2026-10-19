import { cn } from "@/lib/utils";

export type StageStatus = "pendente" | "em_andamento" | "concluida";

export interface Stage {
  title: string;
  status: StageStatus;
}

interface StageTrackerProps {
  /** Stages already sorted by position (project_stages). The tracker fetches nothing. */
  stages: Stage[];
  /** Dashboard-card version: dots only, titles kept for screen readers. Always horizontal. */
  compact?: boolean;
  label?: string;
}

// Complete class names only (Tailwind can't see names built at runtime). The full tracker is
// vertical until its container reaches 40rem (640px), then horizontal.
const LAYOUT = {
  responsive: {
    list: "flex flex-col @min-[40rem]:grid @min-[40rem]:auto-cols-fr @min-[40rem]:grid-flow-col",
    step: "gap-4 pb-6 last:pb-0 @min-[40rem]:flex-col @min-[40rem]:items-center @min-[40rem]:gap-2 @min-[40rem]:px-1 @min-[40rem]:pb-0 @min-[40rem]:text-center",
    lineIn: "hidden @min-[40rem]:block",
    lineOut: "@min-[40rem]:hidden",
    text: "pt-0.5 @min-[40rem]:items-center @min-[40rem]:pt-0",
  },
  compact: {
    list: "grid auto-cols-fr grid-flow-col",
    step: "flex-col items-center gap-2 px-1 text-center",
    lineIn: "block",
    lineOut: "hidden",
    text: "",
  },
};

const reached = (stage: Stage | undefined) => stage !== undefined && stage.status !== "pendente";

/** The client's line of project stages, with the current one pulsing. */
export function StageTracker({
  stages,
  compact = false,
  label = "Andamento do projeto",
}: StageTrackerProps) {
  const layout = compact ? LAYOUT.compact : LAYOUT.responsive;

  return (
    <div className="@container">
      <ol aria-label={label} className={layout.list}>
        {stages.map((stage, index) => {
          const done = stage.status === "concluida";
          const current = stage.status === "em_andamento";
          return (
            <li
              key={`${index}-${stage.title}`}
              aria-current={current ? "step" : undefined}
              className={cn("relative flex", layout.step)}
            >
              {index > 0 && (
                // horizontal: the line arriving from the previous stage's dot
                <Line
                  filled={reached(stage)}
                  axis="x"
                  className={cn("absolute top-[11px] right-1/2 h-0.5 w-full", layout.lineIn)}
                />
              )}
              {index < stages.length - 1 && (
                // vertical: the line leaving towards the next stage's dot
                <Line
                  filled={reached(stages[index + 1])}
                  axis="y"
                  className={cn("absolute top-3 -bottom-3 left-[11px] w-0.5", layout.lineOut)}
                />
              )}
              <Dot done={done} current={current} />
              <span className={compact ? "sr-only" : cn("flex flex-col gap-0.5", layout.text)}>
                <span className={cn("type-eyebrow", current ? "text-accent" : "text-ink-muted")}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className={current ? "type-label text-ink" : "type-small text-ink-muted"}>
                  {stage.title}
                </span>
                {current && <span className="type-eyebrow text-accent">em andamento</span>}
              </span>
              {done && <span className="sr-only">concluída</span>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Line({
  filled,
  axis,
  className,
}: {
  filled: boolean;
  axis: "x" | "y";
  className: string;
}) {
  return (
    <span aria-hidden="true" className={cn("bg-stage-todo", className)}>
      <span
        className={cn(
          "block size-full bg-stage-done transition-transform duration-250 ease-out",
          axis === "x" ? "origin-left" : "origin-top",
          axis === "x"
            ? filled
              ? "scale-x-100"
              : "scale-x-0"
            : filled
              ? "scale-y-100"
              : "scale-y-0",
        )}
      />
    </span>
  );
}

function Dot({ done, current }: { done: boolean; current: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200 ease-out",
        done && "border-stage-done bg-stage-done text-on-accent",
        // the next dot lights up only after the line has finished filling
        current && "border-stage-current bg-stage-current delay-250",
        !done && !current && "border-stage-todo bg-surface",
      )}
    >
      {done && (
        <svg
          viewBox="0 0 12 12"
          className="size-3"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M2.5 6.5 5 9l4.5-5.5" strokeLinecap="square" />
        </svg>
      )}
      {current && (
        <span className="absolute -inset-0.5 animate-stage-pulse rounded-full border-2 border-stage-current motion-reduce:scale-150 motion-reduce:animate-none motion-reduce:opacity-50" />
      )}
    </span>
  );
}
