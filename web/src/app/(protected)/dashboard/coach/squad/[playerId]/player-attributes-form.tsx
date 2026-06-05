"use client";
import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { upsertPlayerAttributes } from "@/app/actions/attributes";
import { getPositionAttrs, ATTR_META, ALL_ATTR_KEYS, type AttrKey } from "@/lib/attributes";

interface Props {
  playerId: string;
  initial: Partial<Record<AttrKey, number>> | null;
  position?: string | null;
}

function buildDefaults(initial: Partial<Record<AttrKey, number>> | null): Record<AttrKey, number> {
  const defaults = {} as Record<AttrKey, number>;
  for (const key of ALL_ATTR_KEYS) {
    defaults[key] = initial?.[key] ?? 50;
  }
  return defaults;
}

export function PlayerAttributesForm({ playerId, initial, position }: Props) {
  const [values, setValues] = useState<Record<AttrKey, number>>(() => buildDefaults(initial));
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const posAttrs = getPositionAttrs(position);

  function handleChange(key: AttrKey, value: number) {
    setSaved(false);
    setValues((v) => ({ ...v, [key]: value }));
  }

  function groupAvg(keys: AttrKey[]): number {
    if (keys.length === 0) return 0;
    return Math.round(keys.reduce((sum, k) => sum + values[k], 0) / keys.length);
  }

  function handleSubmit() {
    setError("");
    setSaved(false);
    startTransition(async () => {
      const result = await upsertPlayerAttributes(playerId, { ...values, notes: notes || undefined });
      if (result?.error) {
        setError(result.error);
      } else {
        setSaved(true);
      }
    });
  }

  const GROUPS: { label: string; keys: AttrKey[] }[] = [
    { label: "Technical", keys: posAttrs.technical },
    { label: "Physical",  keys: posAttrs.physical },
    { label: "Mental",    keys: posAttrs.mental },
  ];

  return (
    <div className="space-y-6">
      {GROUPS.map(({ label, keys }) => {
        const avg = groupAvg(keys);
        return (
          <div key={label} className="space-y-3">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {label}
              </p>
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums">
                {avg}
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {keys.map((key) => {
                const meta = ATTR_META[key];
                return (
                  <div key={key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{meta.label}</span>
                      <span className="tabular-nums text-muted-foreground w-8 text-right">{values[key]}</span>
                    </div>
                    <div className="relative flex items-center gap-2">
                      <input
                        type="range"
                        min={1}
                        max={99}
                        value={values[key]}
                        onChange={(e) => handleChange(key, Number(e.target.value))}
                        aria-label={meta.label}
                        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-muted accent-primary"
                        style={{ accentColor: "var(--color-primary)" }}
                      />
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${meta.color}`}
                        style={{ width: `${values[key]}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

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
