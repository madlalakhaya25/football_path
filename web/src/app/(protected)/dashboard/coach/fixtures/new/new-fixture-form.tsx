"use client";
import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createFixture } from "@/app/actions/fixtures";

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

export function NewFixtureForm({ teamId, backHref }: { teamId: string; backHref: string }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) =>
      (await createFixture(formData)) ?? null,
    null
  );

  const defaultDate = new Date(Date.now() + 7 * 86_400_000)
    .toISOString()
    .slice(0, 16);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="team_id" value={teamId} />
      <Field label="Opponent *" name="opponent" required placeholder="e.g. Sundowns Academy" />
      <Field label="Venue" name="venue" placeholder="e.g. FNB Stadium" />
      <Field label="Date & time *" name="fixture_date" type="datetime-local" required defaultValue={defaultDate} />

      <div className="space-y-1.5">
        <span className="text-sm font-medium">Location</span>
        <div className="flex gap-4">
          {[["true", "Home"], ["false", "Away"]].map(([val, label]) => (
            <label key={val} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="is_home"
                value={val}
                defaultChecked={val === "true"}
                className="accent-primary"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="notes" className="text-sm font-medium">Notes</label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={500}
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
          {pending ? "Saving…" : "Create fixture"}
        </Button>
        <Button asChild variant="outline">
          <Link href={backHref}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
