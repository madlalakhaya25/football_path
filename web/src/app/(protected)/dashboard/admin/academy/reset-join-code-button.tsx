"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function ResetJoinCodeButton() {
  const [confirming, setConfirming] = useState(false);
  const [newCode, setNewCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleResetClick() {
    setConfirming(true);
    setError(null);
  }

  function handleCancel() {
    setConfirming(false);
    setError(null);
  }

  function handleConfirm() {
    startTransition(async () => {
      setError(null);
      const supabase = createClient();
      if (!supabase) { setError("Auth service unavailable."); return; }

      const { data, error: rpcError } = await supabase.rpc("reset_academy_join_code");

      if (rpcError || !data) {
        setError(rpcError?.message ?? "Failed to reset join code.");
        setConfirming(false);
        return;
      }

      setNewCode(data as string);
      setConfirming(false);
    });
  }

  return (
    <div className="space-y-3">
      {newCode && (
        <div className="rounded-lg border border-border bg-muted px-6 py-4">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">New join code</p>
          <p className="font-mono text-4xl font-extrabold tracking-widest text-primary">{newCode}</p>
          <p className="mt-2 text-xs text-muted-foreground">The old code is no longer valid. Share the new code with your members.</p>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {!confirming ? (
        <Button variant="outline" onClick={handleResetClick} disabled={isPending}>
          Reset code
        </Button>
      ) : (
        <div className="flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm font-medium text-destructive">
            Are you sure? This will invalidate the old code — existing members will not be affected, but anyone using the old code to join will no longer be able to.
          </p>
          <div className="flex gap-2">
            <Button variant="destructive" size="sm" onClick={handleConfirm} disabled={isPending}>
              {isPending ? "Resetting…" : "Confirm reset"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleCancel} disabled={isPending}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
