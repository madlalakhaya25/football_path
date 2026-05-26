"use client";
import { useActionState } from "react";
import { createAnnouncement } from "@/app/actions/announcements";
import { Button } from "@/components/ui/button";

interface Team {
  id: string;
  name: string;
}

interface Props {
  teams: Team[];
}

export function AnnouncementForm({ teams }: Props) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) =>
      (await createAnnouncement(formData)) ?? null,
    null
  );

  return (
    <form action={formAction} className="space-y-4">
      {teams.length > 1 && (
        <div className="space-y-1.5">
          <label htmlFor="team_id" className="text-sm font-medium">Team</label>
          <select
            id="team_id"
            name="team_id"
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}
      {teams.length === 1 && (
        <input type="hidden" name="team_id" value={teams[0].id} />
      )}

      <div className="space-y-1.5">
        <label htmlFor="title" className="text-sm font-medium">Title *</label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={100}
          placeholder="e.g. Training cancelled this Friday"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="body" className="text-sm font-medium">Message *</label>
        <textarea
          id="body"
          name="body"
          required
          rows={4}
          maxLength={2000}
          placeholder="Write your announcement here…"
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
        />
      </div>

      {state?.error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p role="status" className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
          Announcement posted!
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Posting…" : "Post announcement"}
      </Button>
    </form>
  );
}
