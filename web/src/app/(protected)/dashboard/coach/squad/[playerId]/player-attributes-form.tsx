"use client";
import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { upsertPlayerAttributes } from "@/app/actions/attributes";

const ATTRS = [
  { key: "pace",      label: "Pace",      color: "bg-sky-500" },
  { key: "shooting",  label: "Shooting",  color: "bg-orange-500" },
  { key: "passing",   label: "Passing",   color: "bg-emerald-500" },
  { key: "dribbling", label: "Dribbling", color: "bg-violet-500" },
  { key: "defending", label: "Defending", color: "bg-blue-500" },
  { key: "physical",  label: "Physical",  color: "bg-rose-500" },
] as const;

type AttrKey = (typeof ATTRS)[number]["key"];

interface Props {
  playerId: string;
  initial: Record<AttrKey, number> | null;
}

const DEFAULT_ATTRS: Record<AttrKey, number> = {
  pace: 50, shooting: 50, passing: 50, dribbling: 50, defending: 50, physical: 50,
};

export function PlayerAttributesForm({ playerId, initial }: Props) {
  const [values, setValues] = useState<Record<AttrKey, number>>(initial ?? DEFAULT_ATTRS);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleChange(key: AttrKey, value: number) {
    setSaved(false);
    setValues((v) => ({ ...v, [key]: value }));
  }

  function handleSubmit() {
    setError("");
    setSaved(false);
    startTransition(async () => {
      const result = await upsertPlayerAttributes(playerId, { ...values, notes });
      if (result?.error) {
        setError(result.error);
      } else {
        setSaved(true);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {ATTRS.map(({ key, label, color }) => (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{label}</span>
              <span className="tabular-nums text-muted-foreground w-8 text-right">{values[key]}</span>
            </div>
            <div className="relative flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={99}
                value={values[key]}
                onChange={(e) => handleChange(key, Number(e.target.value))}
                aria-label={label}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-muted accent-primary"
                style={{ accentColor: "var(--color-primary)" }}
              />
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${color}`}
                style={{ width: `${values[key]}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        maxLength={300}
        rows={2}
        placeholder="Assessment notes (optional)"
        className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save assessment"}
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-emerald-600">
            <Check className="size-4" />
            Saved
          </span>
        )}
      </div>
    </div>
  );
}
