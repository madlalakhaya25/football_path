"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { updateProfile } from "@/app/actions/profile";

const COACHING_ROLES = [
  "Head Coach",
  "Assistant Coach",
  "Goalkeeper Coach",
  "Fitness Coach",
  "Technical Director",
  "Academy Director",
];

export function ProfileForm({
  defaultValues,
}: {
  defaultValues: { full_name: string; phone: string; bio: string; coaching_role: string };
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) =>
      (await updateProfile(formData)) ?? null,
    null
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="full_name" className="text-sm font-medium">Full name *</label>
        <input
          id="full_name"
          name="full_name"
          required
          defaultValue={defaultValues.full_name}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="coaching_role" className="text-sm font-medium">Coaching role</label>
        <input
          id="coaching_role"
          name="coaching_role"
          list="coaching-roles"
          defaultValue={defaultValues.coaching_role}
          placeholder="e.g. Head Coach"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <datalist id="coaching-roles">
          {COACHING_ROLES.map((r) => <option key={r} value={r} />)}
        </datalist>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="phone" className="text-sm font-medium">Phone</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={defaultValues.phone}
          placeholder="+27 …"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="bio" className="text-sm font-medium">Bio</label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          maxLength={300}
          defaultValue={defaultValues.bio}
          placeholder="A short description about your coaching philosophy…"
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
          Profile updated.
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
