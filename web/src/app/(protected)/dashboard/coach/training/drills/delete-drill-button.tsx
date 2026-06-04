"use client";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteDrill } from "@/app/actions/drills";

export function DeleteDrillLibraryButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={pending}
      className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
      onClick={() =>
        startTransition(async () => {
          await deleteDrill(id);
        })
      }
    >
      <Trash2 className="size-4" aria-hidden="true" />
      <span className="sr-only">Delete drill</span>
    </Button>
  );
}
