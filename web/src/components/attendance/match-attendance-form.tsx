"use client";
import { useTransition, useState } from "react";
import { cn } from "@/lib/utils";
import { markMatchAttendance } from "@/app/actions/attendance";

type AttendanceStatus = "present" | "absent" | "late" | "excused";

interface Player {
  id: string;
  full_name: string;
}

interface ExistingRecord {
  player_id: string;
  status: AttendanceStatus;
}

interface Props {
  fixtureId: string;
  players: Player[];
  existing: ExistingRecord[];
}

const STATUS_CONFIG: {
  value: AttendanceStatus;
  label: string;
  active: string;
  hover: string;
}[] = [
  {
    value: "present",
    label: "Present",
    active: "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400",
    hover: "hover:border-green-400 hover:text-green-600",
  },
  {
    value: "absent",
    label: "Absent",
    active: "border-destructive bg-destructive/10 text-destructive",
    hover: "hover:border-destructive/50 hover:text-destructive",
  },
  {
    value: "late",
    label: "Late",
    active: "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    hover: "hover:border-amber-400 hover:text-amber-600",
  },
  {
    value: "excused",
    label: "Excused",
    active: "border-muted-foreground bg-muted text-muted-foreground",
    hover: "hover:border-muted-foreground/50",
  },
];

export function MatchAttendanceForm({ fixtureId, players, existing }: Props) {
  const [pending, startTransition] = useTransition();
  const [statusMap, setStatusMap] = useState<Record<string, AttendanceStatus>>(
    () => Object.fromEntries(existing.map((r) => [r.player_id, r.status]))
  );

  function handleClick(playerId: string, status: AttendanceStatus) {
    setStatusMap((prev) => ({ ...prev, [playerId]: status }));
    startTransition(async () => {
      await markMatchAttendance(fixtureId, playerId, status);
    });
  }

  const counts = Object.values(statusMap).reduce<Record<string, number>>(
    (acc, s) => ({ ...acc, [s]: (acc[s] ?? 0) + 1 }),
    {}
  );

  const summaryParts: string[] = [];
  if (counts.present) summaryParts.push(`${counts.present} present`);
  if (counts.absent) summaryParts.push(`${counts.absent} absent`);
  if (counts.late) summaryParts.push(`${counts.late} late`);
  if (counts.excused) summaryParts.push(`${counts.excused} excused`);

  return (
    <div className="space-y-3">
      {summaryParts.length > 0 && (
        <p className="text-sm text-muted-foreground font-medium">
          {summaryParts.join(" · ")}
        </p>
      )}
      <div className="divide-y divide-border rounded-xl border border-border">
        {players.map((player) => {
          const current = statusMap[player.id] ?? null;
          const initials = player.full_name
            .split(" ")
            .slice(0, 2)
            .map((w) => w[0])
            .join("")
            .toUpperCase();
          return (
            <div key={player.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand/15 text-xs font-bold text-primary">
                {initials}
              </span>
              <span className="flex-1 min-w-0 text-sm font-medium truncate">
                {player.full_name}
              </span>
              <div className="flex gap-1.5 flex-wrap">
                {STATUS_CONFIG.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    disabled={pending}
                    onClick={() => handleClick(player.id, s.value)}
                    className={cn(
                      "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                      current === s.value
                        ? s.active
                        : `border-border text-muted-foreground ${s.hover}`,
                      pending && "opacity-50 cursor-wait"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
