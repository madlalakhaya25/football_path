"use client";
import { useTransition } from "react";
import { UserX } from "lucide-react";
import { removePlayerFromSquad } from "@/app/actions/squad";
import { cn } from "@/lib/utils";

interface Props {
  playerId: string;
  playerName: string;
  teamId: string;
}

export function RemovePlayerButton({ playerId, playerName, teamId }: Props) {
  const [pending, startTransition] = useTransition();

  function handleRemove() {
    if (!confirm(`Remove ${playerName} from the squad?`)) return;
    startTransition(async () => {
      await removePlayerFromSquad(playerId, teamId);
    });
  }

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={pending}
      aria-label={`Remove ${playerName}`}
      className={cn(
        "shrink-0 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100",
        pending && "opacity-50 cursor-wait"
      )}
    >
      <UserX className="size-4" aria-hidden="true" />
    </button>
  );
}
