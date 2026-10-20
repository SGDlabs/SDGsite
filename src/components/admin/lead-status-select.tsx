"use client";

import { useState } from "react";
import { fieldClasses } from "@/components/ui/input";
import { LEAD_STATUS_LABELS, LEAD_STATUSES, type LeadStatus } from "@/lib/lead-labels";
import { cn } from "@/lib/utils";
import { updateLeadStatus } from "@/server/actions/leads";

/** Changes a lead's status right in the table; goes back if saving fails. */
export function LeadStatusSelect({
  id,
  status,
  leadName,
}: {
  id: string;
  status: LeadStatus;
  leadName: string;
}) {
  const [value, setValue] = useState(status);
  const [error, setError] = useState<string | null>(null);
  // plain state, not a transition: the action revalidates this page, and the pending state must
  // end when the action answers, not when the refreshed page has finished rendering
  const [saving, setSaving] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      <select
        aria-label={`Status de ${leadName}`}
        value={value}
        disabled={saving}
        className={cn(fieldClasses, "min-h-9 py-1.5")}
        onChange={async (event) => {
          const next = event.target.value as LeadStatus;
          const previous = value;
          setValue(next);
          setError(null);
          setSaving(true);
          const result = await updateLeadStatus({ id, status: next }).catch(() => null);
          setSaving(false);
          if (!result?.ok) {
            setValue(previous);
            setError(result?.formError ?? "Não conseguimos mudar o status.");
          }
        }}
      >
        {LEAD_STATUSES.map((option) => (
          <option key={option} value={option}>
            {LEAD_STATUS_LABELS[option]}
          </option>
        ))}
      </select>
      {error && (
        <span role="alert" className="type-small text-ink">
          {error}
        </span>
      )}
    </div>
  );
}
