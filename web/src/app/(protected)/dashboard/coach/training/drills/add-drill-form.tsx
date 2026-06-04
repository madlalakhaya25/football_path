"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { saveDrill } from "@/app/actions/drills";

const CATEGORIES = [
  { value: "warm_up", label: "Warm Up" },
  { value: "technical", label: "Technical" },
  { value: "tactical", label: "Tactical" },
  { value: "physical", label: "Physical" },
  { value: "small_sided", label: "Small Sided" },
  { value: "cool_down", label: "Cool Down" },
] as const;

const DIFFICULTIES = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
] as const;

type Category = (typeof CATEGORIES)[number]["value"];
type Difficulty = (typeof DIFFICULTIES)[number]["value"];

export function AddDrillLibraryForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const dur = formData.get("duration_minutes") as string;
      return (
        await saveDrill({
          name: formData.get("name") as string,
          description: (formData.get("description") as string) || undefined,
          category: formData.get("category") as Category,
          duration_minutes: dur ? Number(dur) : undefined,
          difficulty: (formData.get("difficulty") as Difficulty) || undefined,
          video_url: (formData.get("video_url") as string) || undefined,
        })
      ) ?? null;
    },
    null
  );

  return (
    <form action={formAction} className="rounded-xl border border-dashed border-border p-4 space-y-4">
      <h3 className="text-sm font-semibold">Add drill to library</h3>

      <div className="space-y-1.5">
        <label htmlFor="drill-name" className="text-sm font-medium">Name *</label>
        <input
          id="drill-name"
          name="name"
          required
          placeholder="e.g. 4v4 possession rondo"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="drill-category" className="text-sm font-medium">Category *</label>
          <select
            id="drill-category"
            name="category"
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Select…</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="drill-difficulty" className="text-sm font-medium">Difficulty</label>
          <select
            id="drill-difficulty"
            name="difficulty"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Select…</option>
            {DIFFICULTIES.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>
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

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="drill-duration" className="text-sm font-medium">Duration (minutes)</label>
          <input
            id="drill-duration"
            name="duration_minutes"
            type="number"
            min={1}
            max={120}
            placeholder="e.g. 15"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
      </div>

      {state?.error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Add to library"}
      </Button>
    </form>
  );
}
