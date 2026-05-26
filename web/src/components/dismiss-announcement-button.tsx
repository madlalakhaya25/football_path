"use client";
import { useTransition } from "react";
import { X } from "lucide-react";
import { dismissAnnouncement } from "@/app/actions/announcements";
import { cn } from "@/lib/utils";

export function DismissAnnouncementButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  function handleDismiss(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      await dismissAnnouncement(id);
    });
  }

  return (
    <button
      type="button"
      onClick={handleDismiss}
      disabled={pending}
      aria-label="Dismiss announcement"
      className={cn(
        "shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors",
        "hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        pending && "opacity-50 cursor-wait"
      )}
    >
      <X className="size-4" aria-hidden="true" />
    </button>
  );
}
