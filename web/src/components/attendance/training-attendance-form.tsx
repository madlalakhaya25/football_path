"use client";
import { useTransition } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { markTrainingAttendance } from "@/app/actions/attendance";

interface Player {
  id: string;
  full_name: string;
}

interface ExistingRecord {
  player_id: string;
  status: string;
}

interface Props {
  sessionId: string;
  players: Player[];
  existing: ExistingRecord[];
}

function PlayerRow({
  sessionId,
  player,
  currentStatus,
}: {
  sessionId: string;
  player: Player;
  currentStatus: string | null;
}) {
  const [pending, startTransition] = useTransition();

  function mark(status: "present" | "absent") {
    startTransition(async () => {
      await markTrainingAttendance(sessionId, player.id, status);
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
      <span className="text-sm font-medium">{player.full_name}</span>
      <div className="flex gap-1.5">
        <button
          type="button"
          disabled={pending}
          onClick={() => mark("present")}
          className={cn(
            "flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
            currentStatus === "present"
              ? "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400"
              : "border-border text-muted-foreground hover:border-green-400 hover:text-green-600",
            pending && "cursor-wait opacity-50"
          )}
        >
          <CheckCircle2 className="size-3.5" aria-hidden="true" />
          Present
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => mark("absent")}
          className={cn(
            "flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
            currentStatus === "absent"
              ? "border-destructive bg-destructive/10 text-destructive"
              : "border-border text-muted-foreground hover:border-destructive/50 hover:text-destructive",
            pending && "cursor-wait opacity-50"
          )}
        >
          <XCircle className="size-3.5" aria-hidden="true" />
          Absent
        </button>
      </div>
    </div>
  );
}

export function TrainingAttendanceForm({ sessionId, players, existing }: Props) {
  const statusMap = Object.fromEntries(existing.map((r) => [r.player_id, r.status]));
  const presentCount = existing.filter((r) => r.status === "present").length;

  if (players.length === 0) return null;

  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-base font-semibold">Attendance</h2>
        <span className="text-sm text-muted-foreground">
          {presentCount} / {players.length} present
        </span>
      </div>
      <div className="divide-y divide-border">
        {players.map((p) => (
          <PlayerRow
            key={p.id}
            sessionId={sessionId}
            player={p}
            currentStatus={statusMap[p.id] ?? null}
          />
        ))}
      </div>
    </section>
  );
}
