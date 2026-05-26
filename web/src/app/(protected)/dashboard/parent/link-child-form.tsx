"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { linkChild } from "@/app/actions/parent";

export function LinkChildForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) =>
      (await linkChild(formData)) ?? null,
    null
  );

  return (
    <form action={formAction} className="space-y-2 max-w-sm">
      <div className="flex gap-2">
        <input
          name="share_token"
          type="text"
          placeholder="Share code (e.g. a1b2c3d4e5)"
          maxLength={20}
          autoCapitalize="none"
          required
          className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button type="submit" disabled={pending} size="sm">
          {pending ? "Linking…" : "Link"}
        </Button>
      </div>
      {state?.error && (
        <p role="alert" className="text-xs text-destructive">{state.error}</p>
      )}
    </form>
  );
}
