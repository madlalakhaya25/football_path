"use client";
import { useTransition } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteDrill } from "@/app/actions/training";

export function DeleteDrillButton({ drillId, sessionId }: { drillId: string; sessionId: string }) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteDrill(drillId, sessionId);
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleDelete}
      disabled={pending}
      className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
    >
      <X className="size-4" aria-hidden="true" />
      <span className="sr-only">Remove drill</span>
    </Button>
  );
}
