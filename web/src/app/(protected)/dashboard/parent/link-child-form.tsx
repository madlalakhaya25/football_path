"use client";
import { useActionState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { linkChild } from "@/app/actions/parent";

export function LinkChildForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) =>
      (await linkChild(formData)) ?? null,
    null
  );

  if (state?.success) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <Check className="size-4" aria-hidden="true" />
        Child linked successfully!
      </div>
    );
  }

  return (
    <form action={formAction} className="flex gap-2 max-w-sm">
      <input
        name="share_token"
        type="text"
        placeholder="Share code (e.g. a1b2c3d4e5)"
        maxLength={20}
        autoCapitalize="none"
        className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <Button type="submit" disabled={pending} size="sm">
        {pending ? "Linking…" : "Link"}
      </Button>
      {state?.error && (
        <p role="alert" className="absolute mt-11 text-xs text-destructive">{state.error}</p>
      )}
    </form>
  );
}
