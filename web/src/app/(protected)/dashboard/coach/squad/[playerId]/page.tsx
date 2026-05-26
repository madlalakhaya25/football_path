import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RatingRing } from "@/components/ui/rating-ring";
import { StatBar } from "@/components/ui/stat-bar";
import { POSITIONS, FEET } from "@/lib/types";
import { RemovePlayerButton } from "../remove-player-button";
import { RatingEditRow } from "./rating-edit-row";
import { StandaloneRatingForm } from "./standalone-rating-form";
import { PlayerAttributesForm } from "./player-attributes-form";

const ATTR_LABELS = [
  { key: "pace",      label: "Pace" },
  { key: "shooting",  label: "Shooting" },
  { key: "passing",   label: "Passing" },
  { key: "dribbling", label: "Dribbling" },
  { key: "defending", label: "Defending" },
  { key: "physical",  label: "Physical" },
] as const;

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ playerId: string }>;
}) {
  const { playerId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: player }, { data: myAttrs }] = await Promise.all([
    supabase
      .from("players")
      .select(`
        id, full_name, position, secondary_pos, preferred_foot, date_of_birth, photo_url, share_token,
        player_ratings (
          id, rating, note, created_at,
          fixtures ( opponent, fixture_date )
        )
      `)
      .eq("id", playerId)
      .single(),
    supabase
      .from("player_attributes")
      .select("pace, shooting, passing, dribbling, defending, physical")
      .eq("player_id", playerId)
      .eq("coach_id", user.id)
      .single(),
  ]);

  if (!player) notFound();

  type Rating = {
    id: string;
    rating: number;
    note: string | null;
    created_at: string;
    fixtures: { opponent: string; fixture_date: string } | { opponent: string; fixture_date: string }[] | null;
  };

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

  type AttrKey = "pace" | "shooting" | "passing" | "dribbling" | "defending" | "physical";
  const initialAttrs = myAttrs as Record<AttrKey, number> | null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/coach/squad">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Squad
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Passport card */}
        <Card className="overflow-hidden">
          <div className="h-1 bg-brand" />
          <CardHeader>
            <div className="flex items-center justify-between">
              {player.photo_url ? (
                <Image src={player.photo_url} alt={player.full_name} width={64} height={64} className="size-16 rounded-full object-cover" />
              ) : (
                <span className="grid size-16 place-items-center rounded-full bg-brand/20 text-lg font-bold text-primary">
                  {initials}
                </span>
              )}
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

            {/* Attribute bars snapshot */}
            {initialAttrs && (
              <div className="space-y-1.5 pt-2 border-t border-border">
                {ATTR_LABELS.map(({ key, label }) => (
                  <StatBar key={key} label={label} value={initialAttrs[key]} />
                ))}
              </div>
            )}

            <div className="pt-2">
              <RemovePlayerButton playerId={player.id} playerName={player.full_name} />
            </div>
          </CardContent>
        </Card>

        {/* Ratings history */}
        <div className="space-y-3 lg:col-span-2">
          <h2 className="text-lg font-semibold">Rating history</h2>

          <StandaloneRatingForm playerId={player.id} />

          {ratings.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">No ratings yet</CardTitle>
                <CardDescription>Ratings appear after matches are logged, or add one above.</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="divide-y divide-border rounded-xl border border-border">
              {[...ratings]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((r) => {
                  const fixture = Array.isArray(r.fixtures) ? r.fixtures[0] : r.fixtures;
                  return (
                    <RatingEditRow
                      key={r.id}
                      ratingId={r.id}
                      playerId={player.id}
                      initialRating={r.rating}
                      initialNote={r.note}
                      opponent={fixture?.opponent ?? null}
                      date={r.created_at}
                    />
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Ability attributes */}
      <Card>
        <CardHeader>
          <CardTitle>Ability assessment</CardTitle>
          <CardDescription>
            Rate this player&apos;s attributes from 1–99. Your assessment is saved per player and shown on their public passport.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlayerAttributesForm playerId={player.id} initial={initialAttrs} />
        </CardContent>
      </Card>
    </div>
  );
}
