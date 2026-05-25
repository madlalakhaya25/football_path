import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Plus, UserX } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RemovePlayerButton } from "./remove-player-button";
import { POSITIONS } from "@/lib/types";

export default async function SquadPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: team } = await supabase
    .from("teams")
    .select("id, name, age_group")
    .eq("coach_id", user.id)
    .eq("active", true)
    .single();

  if (!team) redirect("/dashboard/coach");

  const { data: members } = await supabase
    .from("team_members")
    .select(`
      player_id, joined_at,
      players (
        id, full_name, position, preferred_foot, date_of_birth, photo_url,
        player_ratings ( rating )
      )
    `)
    .eq("team_id", team.id)
    .eq("active", true)
    .order("joined_at");

  const squad = (members ?? []).map((m: {
    player_id: string;
    joined_at: string;
    players: {
      id: string; full_name: string; position: string | null;
      preferred_foot: string | null; date_of_birth: string | null;
      photo_url: string | null; player_ratings: { rating: number }[];
    } | { id: string; full_name: string; position: string | null; preferred_foot: string | null; date_of_birth: string | null; photo_url: string | null; player_ratings: { rating: number }[] }[] | null;
  }) => {
    const p = Array.isArray(m.players) ? m.players[0] : m.players;
    if (!p) return null;
    const ratings = p.player_ratings.map((r) => r.rating);
    const avg = ratings.length
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
      : null;
    const age = p.date_of_birth
      ? Math.floor((Date.now() - new Date(p.date_of_birth).getTime()) / 31_557_600_000)
      : null;
    return { ...p, avg, age, joinedAt: m.joined_at };
  }).filter(Boolean);

  const byPosition: Record<string, typeof squad> = {};
  for (const p of squad) {
    const pos = p?.position ?? "unassigned";
    if (!byPosition[pos]) byPosition[pos] = [];
    byPosition[pos].push(p);
  }

  const posOrder = ["goalkeeper", "defender", "midfielder", "winger", "striker", "unassigned"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Squad</h1>
          <p className="text-sm text-muted-foreground">
            {team.name} {team.age_group && `· ${team.age_group}`} · {squad.length} players
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/coach/squad/add">
            <Plus className="size-4" aria-hidden="true" />
            Add player
          </Link>
        </Button>
      </div>

      {squad.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No players yet</CardTitle>
            <CardDescription>Add your first player to get started.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/dashboard/coach/squad/add">
                <Plus className="size-4" aria-hidden="true" />
                Add player
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {posOrder
            .filter((pos) => byPosition[pos]?.length)
            .map((pos) => (
              <section key={pos}>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {POSITIONS.find((p) => p.value === pos)?.label ?? "Unassigned"}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {byPosition[pos].map((player) => {
                    if (!player) return null;
                    const initials = player.full_name
                      .split(" ")
                      .slice(0, 2)
                      .map((w: string) => w[0])
                      .join("")
                      .toUpperCase();
                    return (
                      <div
                        key={player.id}
                        className="group relative flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40"
                      >
                        {/* Avatar */}
                        <Link href={`/dashboard/coach/squad/${player.id}`} className="flex-shrink-0">
                          {player.photo_url ? (
                            <Image
                              src={player.photo_url}
                              alt={player.full_name}
                              width={48}
                              height={48}
                              className="size-12 rounded-full object-cover"
                            />
                          ) : (
                            <span className="grid size-12 place-items-center rounded-full bg-brand/20 text-sm font-bold text-primary">
                              {initials}
                            </span>
                          )}
                        </Link>

                        {/* Info */}
                        <Link href={`/dashboard/coach/squad/${player.id}`} className="min-w-0 flex-1">
                          <p className="truncate font-semibold leading-tight">{player.full_name}</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {player.age && (
                              <Badge variant="neutral" className="text-xs">Age {player.age}</Badge>
                            )}
                            {player.preferred_foot && (
                              <Badge variant="neutral" className="text-xs capitalize">
                                {player.preferred_foot}
                              </Badge>
                            )}
                          </div>
                          {player.avg && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              ★ {player.avg} avg
                            </p>
                          )}
                        </Link>

                        {/* Remove */}
                        <RemovePlayerButton playerId={player.id} playerName={player.full_name} />
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
        </div>
      )}
    </div>
  );
}
