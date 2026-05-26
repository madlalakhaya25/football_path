"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { linkChild } from "@/app/actions/parent";

const RELATIONSHIPS = ["Parent", "Guardian", "Grandparent", "Sibling", "Other"];

export function LinkChildForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) =>
      (await linkChild(formData)) ?? null,
    null
  );

  return (
    <form action={formAction} className="space-y-3 max-w-sm">
      <div className="space-y-1.5">
        <label htmlFor="share_token" className="text-sm font-medium">Share code *</label>
        <input
          id="share_token"
          name="share_token"
          type="text"
          placeholder="e.g. a1b2c3d4e5"
          maxLength={20}
          autoCapitalize="none"
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
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
        <p role="alert" className="text-xs text-destructive">{state.error}</p>
      )}
      <Button type="submit" disabled={pending} size="sm">
        {pending ? "Linking…" : "Link child"}
      </Button>
    </form>
  );
}
