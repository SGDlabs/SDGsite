"use client";

import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { applyTheme, readTheme, subscribeTheme, type ThemeChoice } from "@/lib/theme";

const OPTIONS: { value: ThemeChoice; label: string }[] = [
  { value: "system", label: "Sistema" },
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
];

/** Forces a theme so both can be checked side by side: the same choice as the user menu's. */
export function ThemeToggle() {
  const choice = useSyncExternalStore(subscribeTheme, readTheme, () => "system" as const);

  return (
    <div role="group" aria-label="Tema" className="flex flex-wrap gap-2">
      {OPTIONS.map((option) => (
        <Button
          key={option.value}
          size="sm"
          variant={choice === option.value ? "primary" : "outline"}
          aria-pressed={choice === option.value}
          onClick={() => applyTheme(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
