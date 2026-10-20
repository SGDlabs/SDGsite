"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const OPTIONS = [
  { value: "system", label: "Sistema" },
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
] as const;

type Choice = (typeof OPTIONS)[number]["value"];

/** Forces a theme through data-theme on <html> so both can be checked side by side. */
export function ThemeToggle() {
  const [choice, setChoice] = useState<Choice>("system");

  useEffect(() => {
    const root = document.documentElement;
    if (choice === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", choice);
    return () => root.removeAttribute("data-theme");
  }, [choice]);

  return (
    <div role="group" aria-label="Tema" className="flex flex-wrap gap-2">
      {OPTIONS.map((option) => (
        <Button
          key={option.value}
          size="sm"
          variant={choice === option.value ? "primary" : "outline"}
          aria-pressed={choice === option.value}
          onClick={() => setChoice(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
