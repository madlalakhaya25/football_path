import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RatingRing } from "@/components/ui/rating-ring";
import { StatBar } from "@/components/ui/stat-bar";
import { POSITIONS } from "@/lib/types";
import { ClaimProfileForm } from "./claim-profile-form";
import { RatingChart } from "@/components/rating-chart";
import { MediaGallery } from "@/components/media/media-gallery";
import { DocumentHub } from "@/components/records/document-hub";

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
      player_ratings ( rating, created_at, fixtures ( opponent, fixture_date ) ),
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

  const currentSeason = new Date().getFullYear().toString();

  // Fetch documents and media in parallel
  const [{ data: myDocuments }, { data: myMediaTags }] = await Promise.all([
    supabase
      .from("player_documents")
      .select("document_type, status, signer_name, signed_at, uploaded_at, upload_url")
      .eq("player_id", player.id)
      .eq("season", currentSeason),
    supabase
      .from("media_tags")
      .select("media_uploads ( id, url, media_type, caption, created_at )")
      .eq("player_id", player.id),
  ]);

  // Ratings
  type RatingRow = {
    rating: number;
    created_at: string;
    fixtures: { opponent: string; fixture_date: string } | { opponent: string; fixture_date: string }[] | null;
  };
  const ratingRows: RatingRow[] = player.player_ratings ?? [];
  const ratingValues = ratingRows.map((r) => r.rating);

  // Chart data — sorted ascending by date
  const chartData = [...ratingRows]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((r) => {
      const fixture = Array.isArray(r.fixtures) ? r.fixtures[0] : r.fixtures;
      const dateStr = fixture?.fixture_date ?? r.created_at;
      return {
        date: new Date(dateStr).toLocaleDateString("en-ZA", { day: "numeric", month: "short" }),
        rating: r.rating,
        opponent: fixture?.opponent ?? undefined,
      };
    });
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

  // Normalize media tag items
  type RawMediaUpload = {
    id: string;
    url: string;
    media_type: string;
    caption: string | null;
    created_at: string;
  } | null;
  type RawMediaTag = { media_uploads: RawMediaUpload | RawMediaUpload[] };
  const taggedMediaItems = (myMediaTags ?? []).flatMap((tag: RawMediaTag) => {
    const mu = tag.media_uploads;
    if (!mu) return [];
    const items = Array.isArray(mu) ? mu : [mu];
    return items.filter((item): item is NonNullable<RawMediaUpload> => item !== null).map((item) => ({
      id: item.id,
      url: item.url,
      media_type: item.media_type,
      caption: item.caption,
      created_at: item.created_at,
      tagged_players: [],
    }));
  });

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
            <CardDescription>Your public page includes a QR code scouts can scan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="rounded-md bg-muted px-4 py-3 text-center font-mono text-lg font-bold tracking-widest">
              {player.share_token}
            </p>
            <Button asChild variant="outline" size="sm" className="w-full gap-2">
              <Link href={`/passport/${player.share_token}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" aria-hidden="true" />
                View public passport &amp; QR
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {chartData.length >= 2 ? (
        <section className="rounded-xl border border-border bg-card p-4 space-y-2">
          <p className="text-sm font-semibold">Rating trend</p>
          <RatingChart data={chartData} />
        </section>
      ) : chartData.length === 1 ? (
        <section className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-sm font-semibold">Rating trend</p>
          <p className="text-sm text-muted-foreground mt-1">
            Rating trend appears after 2 or more rated matches. You have 1 so far — keep playing!
          </p>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-base font-semibold">My Photos &amp; Videos</h2>
        {taggedMediaItems.length > 0 ? (
          <MediaGallery items={taggedMediaItems} />
        ) : (
          <p className="text-sm text-muted-foreground">
            No media yet. Coaches will tag you in match photos and videos as they upload them.
          </p>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Documents &amp; Contracts</h2>
          <p className="text-sm text-muted-foreground">{currentSeason} season — your parent or guardian signs these on your behalf.</p>
        </div>
        <DocumentHub playerId={player.id} season={currentSeason} documents={myDocuments ?? []} readOnly />
      </section>
    </div>
  );
}
