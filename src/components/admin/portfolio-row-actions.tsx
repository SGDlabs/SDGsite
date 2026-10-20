"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { movePortfolioItem, setPortfolioFlag } from "@/server/actions/portfolio";

/** Up and down in the listing order. */
export function PortfolioOrderButtons({
  id,
  title,
  isFirst,
  isLast,
}: {
  id: string;
  title: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [moving, setMoving] = useState(false);
  const move = async (direction: "up" | "down") => {
    setMoving(true);
    await movePortfolioItem({ id, direction });
    setMoving(false);
  };
  return (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        size="sm"
        aria-label={`Subir ${title}`}
        disabled={isFirst || moving}
        onClick={() => move("up")}
      >
        ↑
      </Button>
      <Button
        variant="ghost"
        size="sm"
        aria-label={`Descer ${title}`}
        disabled={isLast || moving}
        onClick={() => move("down")}
      >
        ↓
      </Button>
    </div>
  );
}

/** Published / featured, switched right in the table. */
export function PortfolioFlag({
  id,
  flag,
  value,
  label,
}: {
  id: string;
  flag: "published" | "featured";
  value: boolean;
  label: string;
}) {
  const [checked, setChecked] = useState(value);
  const [saving, setSaving] = useState(false);
  return (
    <input
      type="checkbox"
      aria-label={label}
      checked={checked}
      disabled={saving}
      className="size-5 accent-accent"
      onChange={async (event) => {
        const next = event.target.checked;
        setChecked(next);
        setSaving(true);
        const result = await setPortfolioFlag({ id, flag, value: next }).catch(() => null);
        setSaving(false);
        if (!result?.ok) setChecked(!next);
      }}
    />
  );
}
