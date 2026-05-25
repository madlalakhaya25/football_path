import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { POSITIONS } from "@/lib/types";
import { AdminPlayerSearch } from "./admin-player-search";

export default async function AdminPlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("academy_id")
    .eq("id", user.id)
    .single();

  if (!profile?.academy_id) redirect("/auth/role");

  let query = supabase
    .from("players")
    .select(`
      id, full_name, position, preferred_foot, date_of_birth, active,
      player_ratings ( rating )
    `)
    .eq("academy_id", profile.academy_id)
    .eq("active", true)
    .order("full_name");

  if (q) query = query.ilike("full_name", `%${q}%`);

  const { data: players } = await query;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Players</h1>
        <p className="text-sm text-muted-foreground">{players?.length ?? 0} active players</p>
      </div>

      <Suspense fallback={null}>
        <AdminPlayerSearch initialQ={q} />
      </Suspense>

      {(players ?? []).length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No players found</CardTitle>
            <CardDescription>{q ? `No results for "${q}".` : "No players in the academy yet."}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border">
          {(players ?? []).map((p: {
            id: string; full_name: string; position: string | null;
            preferred_foot: string | null; date_of_birth: string | null;
            player_ratings: { rating: number }[];
          }) => {
            const ratings = p.player_ratings.map((r) => r.rating);
            const avg = ratings.length
              ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
              : null;
            const posLabel = POSITIONS.find((pos) => pos.value === p.position)?.label;
            const age = p.date_of_birth
              ? Math.floor((Date.now() - new Date(p.date_of_birth).getTime()) / 31_557_600_000)
              : null;
            const initials = p.full_name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();

            return (
              <Link
                key={p.id}
                href={`/dashboard/admin/players/${p.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand/15 text-xs font-bold text-primary">
                  {initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{p.full_name}</p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {posLabel && <Badge variant="neutral" className="text-xs">{posLabel}</Badge>}
                    {age && <Badge variant="neutral" className="text-xs">Age {age}</Badge>}
                  </div>
                </div>
                {avg && <span className="shrink-0 text-sm text-muted-foreground">★ {avg}</span>}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
