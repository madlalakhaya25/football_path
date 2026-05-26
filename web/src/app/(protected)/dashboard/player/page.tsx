import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RatingRing } from "@/components/ui/rating-ring";
import { StatBar } from "@/components/ui/stat-bar";
import { POSITIONS } from "@/lib/types";
import { ClaimProfileForm } from "./claim-profile-form";

const ATTR_KEYS = ["pace", "shooting", "passing", "dribbling", "defending", "physical"] as const;
type AttrKey = (typeof ATTR_KEYS)[number];

const ATTR_LABELS: Record<AttrKey, string> = {
  pace: "Pace", shooting: "Shooting", passing: "Passing",
  dribbling: "Dribbling", defending: "Defending", physical: "Physical",
};

export default async function PlayerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: player } = await supabase
    .from("players")
    .select(`
      id, full_name, position, preferred_foot, date_of_birth, photo_url, share_token,
      player_ratings ( rating, created_at ),
      player_attributes ( pace, shooting, passing, dribbling, defending, physical )
    `)
    .eq("profile_id", user.id)
    .single();

  if (!player) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Passport</h1>
        <p className="text-muted-foreground text-sm">
          Your coach has added you to the squad — enter the share token they gave you to link your profile.
        </p>
        <ClaimProfileForm />
      </div>
    );
  }

  // Ratings
  type RatingRow = { rating: number; created_at: string };
  const ratingRows: RatingRow[] = player.player_ratings ?? [];
  const ratingValues = ratingRows.map((r) => r.rating);
  const matchAvg = ratingValues.length
    ? Math.round((ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length) * 20)
    : 0;

  // Attributes — average across all coaches who assessed this player
  type AttrRow = Record<AttrKey, number>;
  const attrRows: AttrRow[] = (player.player_attributes ?? []) as AttrRow[];
  const attrs = attrRows.length > 0
    ? Object.fromEntries(
        ATTR_KEYS.map((key) => [
          key,
          Math.round(attrRows.reduce((s, r) => s + r[key], 0) / attrRows.length),
        ])
      ) as Record<AttrKey, number>
    : null;

  // Overall: average of attributes if assessed, else match rating average
  const attrsOverall = attrs
    ? Math.round(ATTR_KEYS.reduce((s, k) => s + attrs[k], 0) / ATTR_KEYS.length)
    : null;
  const overall = attrsOverall ?? matchAvg;

  const posLabel = POSITIONS.find((p) => p.value === player.position)?.label ?? "—";
  const age = player.date_of_birth
    ? Math.floor((Date.now() - new Date(player.date_of_birth).getTime()) / 31_557_600_000)
    : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Passport</h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Profile card */}
        <Card className="overflow-hidden sm:col-span-2 lg:col-span-1">
          <div className="h-1 bg-brand" />
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>{player.full_name}</CardTitle>
              <CardDescription>{posLabel}</CardDescription>
            </div>
            <RatingRing value={overall} size={84} />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="brand">{posLabel}</Badge>
              {age && <Badge variant="neutral">Age {age}</Badge>}
              {player.preferred_foot && (
                <Badge variant="neutral" className="capitalize">
                  {player.preferred_foot} foot
                </Badge>
              )}
            </div>
            {attrs && (
              <div className="space-y-1.5 pt-2 border-t border-border">
                {ATTR_KEYS.map((key) => (
                  <StatBar key={key} label={ATTR_LABELS[key]} value={attrs[key]} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
            <CardDescription>
              {ratingValues.length} rating{ratingValues.length !== 1 ? "s" : ""} from coaches
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {ratingValues.length === 0 ? (
              <p className="text-sm text-muted-foreground">No match ratings yet.</p>
            ) : (
              <StatBar label="Average" value={matchAvg} />
            )}
          </CardContent>
        </Card>

        {/* Share */}
        <Card>
          <CardHeader>
            <CardTitle>Share Passport</CardTitle>
            <CardDescription>Give coaches and scouts your unique code.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="rounded-md bg-muted px-4 py-3 text-center font-mono text-lg font-bold tracking-widest">
              {player.share_token}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
