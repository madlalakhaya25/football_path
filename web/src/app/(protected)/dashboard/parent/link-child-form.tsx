"use client";

import { useState, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { linkChild } from "@/app/actions/parent";
import { cn } from "@/lib/utils";

const METHODS = [
  {
    value: "share_token",
    label: "Share code",
    placeholder: "e.g. a1b2c3d4",
    hint: "Found on your child's passport page or given by their coach.",
    inputMode: "text" as const,
    autoCapitalize: "none",
  },
  {
    value: "id_number",
    label: "SA ID / birth cert no.",
    placeholder: "13-digit ID number",
    hint: "Must match the ID number your child entered on their profile.",
    inputMode: "numeric" as const,
    autoCapitalize: "off",
  },
  {
    value: "mysafa_number",
    label: "MySAFA number",
    placeholder: "e.g. SA-2024-00123",
    hint: "The SAFA/GDFA registration number your child entered on their profile.",
    inputMode: "text" as const,
    autoCapitalize: "off",
  },
] as const;

const RELATIONSHIPS = ["Parent", "Guardian", "Grandparent", "Sibling", "Other"];

export function LinkChildForm() {
  const [method, setMethod] = useState<typeof METHODS[number]["value"]>("share_token");

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) =>
      (await linkChild(formData)) ?? null,
    null
  );

  const active = METHODS.find((m) => m.value === method)!;

  return (
    <form action={formAction} className="space-y-4 max-w-sm">
      {/* Method selector */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Find child by</p>
        <div className="flex rounded-lg border border-border overflow-hidden">
          {METHODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMethod(m.value)}
              className={cn(
                "flex-1 px-2 py-2 text-xs font-medium transition-colors",
                method === m.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hidden lookup type */}
      <input type="hidden" name="lookup_type" value={method} />

      {/* Lookup value */}
      <div className="space-y-1.5">
        <label htmlFor="lookup_value" className="text-sm font-medium">
          {active.label}
        </label>
        <input
          key={method}
          id="lookup_value"
          name="lookup_value"
          type="text"
          placeholder={active.placeholder}
          inputMode={active.inputMode}
          autoCapitalize={active.autoCapitalize}
          autoComplete="off"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <p className="text-xs text-muted-foreground">{active.hint}</p>
      </div>

      {/* Relationship */}
      <div className="space-y-1.5">
        <label htmlFor="relationship" className="text-sm font-medium">Relationship</label>
        <select
          id="relationship"
          name="relationship"
          defaultValue="Parent"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-destructive">{state.error}</p>
      )}

      <Button type="submit" disabled={pending} size="sm">
        {pending ? "Searching…" : "Link child"}
      </Button>
    </form>
  );
}
