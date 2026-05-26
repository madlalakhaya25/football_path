export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { ResetPasswordForm } from "./reset-password-form";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center"><span className="text-muted-foreground text-sm">Loading…</span></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
