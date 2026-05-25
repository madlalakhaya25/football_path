import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RatingRing } from "@/components/ui/rating-ring";
import { POSITIONS, FEET } from "@/lib/types";

export default async function ChildDetailPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Verify parent has this child linked
  const { data: link } = await supabase
    .from("parent_player_links")
    .select("player_id")
    .eq("parent_id", user.id)
    .eq("player_id", childId)
    .single();

  if (!link) notFound();

  const { data: player } = await supabase
    .from("players")
    .select(`
      id, full_name, position, secondary_pos, preferred_foot, date_of_birth, photo_url, share_token,
      player_ratings (
        id, rating, note, created_at,
        fixtures ( opponent, fixture_date )
      )
    `)
    .eq("id", childId)
    .single();

  if (!player) notFound();

  type Rating = { id: string; rating: number; note: string | null; created_at: string; fixtures: { opponent: string; fixture_date: string } | { opponent: string; fixture_date: string }[] | null };
  const ratings: Rating[] = player.player_ratings ?? [];
  const ratingValues = ratings.map((r) => r.rating);
  const avg = ratingValues.length
    ? Math.round((ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length) * 20)
    : 0;

  const posLabel = POSITIONS.find((p) => p.value === player.position)?.label ?? "—";
  const footLabel = FEET.find((f) => f.value === player.preferred_foot)?.label;
  const age = player.date_of_birth
    ? Math.floor((Date.now() - new Date(player.date_of_birth).getTime()) / 31_557_600_000)
    : null;
  const initials = player.full_name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/dashboard/parent">
          <ArrowLeft className="size-4" aria-hidden="true" />
          My Children
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden">
          <div className="h-1 bg-brand" />
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="grid size-16 place-items-center rounded-full bg-brand/20 text-lg font-bold text-primary">
                {initials}
              </span>
              <RatingRing value={avg} size={72} />
            </div>
            <CardTitle className="mt-3">{player.full_name}</CardTitle>
            <CardDescription>{posLabel}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="brand">{posLabel}</Badge>
              {age && <Badge variant="neutral">Age {age}</Badge>}
              {footLabel && <Badge variant="neutral">{footLabel} foot</Badge>}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Ratings</p>
                <p className="font-semibold">{ratings.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Share token</p>
                <p className="font-mono font-semibold tracking-wide">{player.share_token}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3 lg:col-span-2">
          <h2 className="text-lg font-semibold">Rating history</h2>
          {ratings.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">No ratings yet</CardTitle>
                <CardDescription>Ratings appear after the coach logs match results.</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="divide-y divide-border rounded-xl border border-border">
              {[...ratings]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((r) => {
                  const fixture = Array.isArray(r.fixtures) ? r.fixtures[0] : r.fixtures;
                  return (
                    <div key={r.id} className="flex items-start gap-4 px-4 py-3">
                      <div className="flex shrink-0 gap-0.5 pt-0.5">
                        {[1,2,3,4,5].map((n) => (
                          <Star key={n} className={`size-4 ${n <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} aria-hidden="true" />
                        ))}
                      </div>
                      <div className="min-w-0 flex-1">
                        {fixture && <p className="font-medium text-sm">vs {fixture.opponent}</p>}
                        {r.note && <p className="text-sm text-muted-foreground mt-0.5">&ldquo;{r.note}&rdquo;</p>}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(r.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
