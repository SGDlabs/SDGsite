"use client";

import { useState } from "react";
import { StageTracker, type Stage } from "@/components/client/stage-tracker";
import { Button } from "@/components/ui/button";

export interface DemoStage {
  title: string;
  description: string;
}

/** The StageTracker with a button that simulates project progress, so visitors see the dashboard they will get. */
export function StageTrackerDemo({
  stages,
  initial = 2,
}: {
  stages: DemoStage[];
  initial?: number;
}) {
  const [current, setCurrent] = useState(initial);
  const active = stages[current]; // undefined once every stage is done

  const tracked: Stage[] = stages.map((stage, index) => ({
    title: stage.title,
    status: index < current ? "concluida" : index === current ? "em_andamento" : "pendente",
  }));

  return (
    <div className="flex flex-col items-center gap-8 rounded-md border border-border bg-surface px-4 py-8 md:px-8 md:py-12">
      <div className="self-stretch">
        <StageTracker stages={tracked} label="Exemplo de andamento de projeto" />
      </div>
      <div aria-live="polite" className="flex min-h-16 max-w-140 flex-col gap-1 text-center">
        <p className="type-label">
          {active
            ? `Etapa ${current + 1} de ${stages.length} — ${active.title}`
            : "Projeto entregue — todas as etapas concluídas."}
        </p>
        {active && <p className="type-small text-ink-muted">{active.description}</p>}
      </div>
      <Button variant="secondary" onClick={() => setCurrent(active ? current + 1 : 0)}>
        {active ? "Simular avanço de etapa" : "Recomeçar o exemplo"}
      </Button>
    </div>
  );
}
