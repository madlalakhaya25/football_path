import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RatingRing } from "@/components/ui/rating-ring";
import { StatBar } from "@/components/ui/stat-bar";
import { POSITIONS } from "@/lib/types";

export default async function PlayerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: player } = await supabase
    .from("players")
    .select(`
      id, full_name, position, preferred_foot, date_of_birth, photo_url, share_token,
      player_ratings ( rating, created_at )
    `)
    .eq("profile_id", user.id)
    .single();

  const ratings: number[] = (player?.player_ratings ?? []).map((r: { rating: number }) => r.rating);
  const avgRating = ratings.length
    ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 20)
    : 0;

  const posLabel = POSITIONS.find((p) => p.value === player?.position)?.label ?? "—";
  const age = player?.date_of_birth
    ? Math.floor((Date.now() - new Date(player.date_of_birth).getTime()) / 31_557_600_000)
    : null;

  if (!player) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Passport</h1>
        <p className="text-muted-foreground">
          Your player profile hasn&apos;t been created yet. Ask your coach to add you to the squad.
        </p>
      </div>
    );
  }

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
            <RatingRing value={avgRating} size={84} />
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
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
            <CardDescription>
              {ratings.length} rating{ratings.length !== 1 ? "s" : ""} from coaches
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {ratings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No ratings yet.</p>
            ) : (
              <StatBar label="Average" value={avgRating} />
            )}
          </CardContent>
        </Card>

        {/* Share */}
        <Card>
          <CardHeader>
            <CardTitle>Share Passport</CardTitle>
            <CardDescription>Give scouts your unique code.</CardDescription>
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
