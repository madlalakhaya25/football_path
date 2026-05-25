import { Suspense } from "react";
import { VerifyForm } from "./verify-form";

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center"><span className="text-muted-foreground text-sm">Loading…</span></div>}>
      <VerifyForm />
    </Suspense>
  );
}
