"use client";
import { useActionState } from "react";
import { changePassword } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const INPUT = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(
    async (_: unknown, fd: FormData) => (await changePassword(fd)) ?? null,
    null
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Change password</CardTitle>
        <CardDescription>Choose a strong password of at least 8 characters.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="new_password" className="text-sm font-medium">New password</label>
            <input id="new_password" type="password" name="new_password" minLength={8} required autoComplete="new-password" className={INPUT} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="confirm_password" className="text-sm font-medium">Confirm password</label>
            <input id="confirm_password" type="password" name="confirm_password" minLength={8} required autoComplete="new-password" className={INPUT} />
          </div>
          {state?.error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}
          {state?.success && <p role="status" className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">Password updated.</p>}
          <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Update password"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
