"use client";
import { useTransition } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { setAttendance } from "@/app/actions/training";
import { cn } from "@/lib/utils";

interface Props {
  sessionId: string;
  current: "attending" | "unavailable" | null;
}

export function AttendanceButton({ sessionId, current }: Props) {
  const [pending, startTransition] = useTransition();

  function handleClick(status: "attending" | "unavailable") {
    startTransition(async () => {
      const res = await setAttendance(sessionId, status);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(status === "attending" ? "Marked as going" : "Marked as unavailable");
      }
    });
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => handleClick("attending")}
        className={cn(
          "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
          current === "attending"
            ? "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400"
            : "border-border text-muted-foreground hover:border-green-400 hover:text-green-600",
          pending && "opacity-50 cursor-wait"
        )}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <CheckCircle2 className="size-4" aria-hidden="true" />
        )}
        Going
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => handleClick("unavailable")}
        className={cn(
          "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
          current === "unavailable"
            ? "border-destructive bg-destructive/10 text-destructive"
            : "border-border text-muted-foreground hover:border-destructive/50 hover:text-destructive",
          pending && "opacity-50 cursor-wait"
        )}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <XCircle className="size-4" aria-hidden="true" />
        )}
        Can&apos;t make it
      </button>
    </div>
  );
}
