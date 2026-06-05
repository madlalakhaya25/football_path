"use client";
import { useTransition } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cancelFixture } from "@/app/actions/fixtures";

export function CancelFixtureButton({ fixtureId }: { fixtureId: string }) {
  const [pending, start] = useTransition();

  function handleCancel() {
    if (!confirm("Cancel this fixture?")) return;
    start(async () => {
      const res = await cancelFixture(fixtureId);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Fixture cancelled");
      }
    });
  }

  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={handleCancel}>
      <X className="size-4" aria-hidden="true" />
      {pending ? "Cancelling…" : "Cancel fixture"}
    </Button>
  );
}
