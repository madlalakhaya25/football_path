"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";

const INPUT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

type ActionResult = { error?: string; success?: boolean } | null;

interface AcademyInfoFormProps {
  defaultName: string;
  defaultProvince: string;
  action: (prevState: unknown, formData: FormData) => Promise<ActionResult>;
}

export function AcademyInfoForm({ defaultName, defaultProvince, action }: AcademyInfoFormProps) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="academy_name" className="text-sm font-medium">Club name</label>
        <input
          id="academy_name"
          name="name"
          type="text"
          defaultValue={defaultName}
          required
          minLength={2}
          placeholder="Growfit FC"
          className={INPUT_CLASS}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="academy_province" className="text-sm font-medium">
          Province / City <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <input
          id="academy_province"
          name="province"
          type="text"
          defaultValue={defaultProvince}
          placeholder="e.g. Gauteng, Cape Town"
          className={INPUT_CLASS}
        />
      </div>

      {state?.error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      {state?.success && (
        <p role="status" className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-600 dark:text-green-400">
          Club information updated.
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
