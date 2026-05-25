"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { createTeam } from "@/app/actions/squad";
import { AGE_GROUPS } from "@/lib/types";

export function CreateTeamForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return (await createTeam(formData)) ?? null;
    },
    null
  );

  return (
    <form action={formAction} className="space-y-4 max-w-sm">
      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium">Team name *</label>
        <input
          id="name"
          name="name"
          required
          placeholder="e.g. GrowFit U17"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="age_group" className="text-sm font-medium">Age group</label>
        <select
          id="age_group"
          name="age_group"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Select…</option>
          {AGE_GROUPS.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      {state?.error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create team"}
      </Button>
    </form>
  );
}
