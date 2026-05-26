"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { addDrill } from "@/app/actions/training";

export function AddDrillForm({ sessionId }: { sessionId: string }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) =>
      (await addDrill(formData)) ?? null,
    null
  );

  return (
    <form action={formAction} className="rounded-xl border border-dashed border-border p-4 space-y-4">
      <h3 className="text-sm font-semibold">Add drill</h3>
      <input type="hidden" name="session_id" value={sessionId} />

      <div className="space-y-1.5">
        <label htmlFor="drill-title" className="text-sm font-medium">Title *</label>
        <input
          id="drill-title"
          name="title"
          required
          placeholder="e.g. 4v4 possession rondo"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="drill-description" className="text-sm font-medium">Description</label>
        <textarea
          id="drill-description"
          name="description"
          rows={2}
          maxLength={500}
          placeholder="Optional instructions…"
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="drill-video" className="text-sm font-medium">Video URL</label>
        <input
          id="drill-video"
          name="video_url"
          type="url"
          placeholder="https://youtube.com/…"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {state?.error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Adding…" : "Add drill"}
      </Button>
    </form>
  );
}
