"use client";
import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createTrainingSession } from "@/app/actions/training";

const SESSION_TYPES = [
  { value: "general", label: "General" },
  { value: "technical", label: "Technical" },
  { value: "tactical", label: "Tactical" },
  { value: "fitness", label: "Fitness" },
  { value: "match_prep", label: "Match Prep" },
  { value: "recovery", label: "Recovery" },
];

function Field({
  label, name, required, placeholder, type = "text", defaultValue,
}: {
  label: string; name: string; required?: boolean; placeholder?: string; type?: string; defaultValue?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium">{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}

export function NewSessionForm({
  teamId,
  teams,
  backHref,
}: {
  teamId: string;
  teams: { id: string; name: string; age_group: string | null }[];
  backHref: string;
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) =>
      (await createTrainingSession(formData)) ?? null,
    null
  );

  const defaultDate = new Date(Date.now() + 2 * 86_400_000)
    .toISOString()
    .slice(0, 16);

  return (
    <form action={formAction} className="space-y-5">
      {teams.length > 1 ? (
        <div className="space-y-1.5">
          <label htmlFor="team_id" className="text-sm font-medium">Team *</label>
          <select
            id="team_id"
            name="team_id"
            defaultValue={teamId}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} {t.age_group ? `· ${t.age_group}` : ""}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <input type="hidden" name="team_id" value={teamId} />
      )}

      <Field label="Session title *" name="title" required placeholder="e.g. Pre-match activation" />
      <Field label="Date & time *" name="session_date" type="datetime-local" required defaultValue={defaultDate} />
      <Field label="Location" name="location" placeholder="e.g. Main pitch, field 3" />

      <div className="space-y-1.5">
        <label htmlFor="session_type" className="text-sm font-medium">Session type *</label>
        <select
          id="session_type"
          name="session_type"
          defaultValue="general"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {SESSION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="notes" className="text-sm font-medium">Notes</label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={1000}
          placeholder="Optional notes for the squad…"
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
        />
      </div>

      {state?.error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create session"}
        </Button>
        <Button asChild variant="outline">
          <Link href={backHref}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
