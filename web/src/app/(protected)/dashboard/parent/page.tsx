import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RatingRing } from "@/components/ui/rating-ring";
import { POSITIONS } from "@/lib/types";
import { LinkChildForm } from "./link-child-form";

const ATTR_KEYS = ["pace", "shooting", "passing", "dribbling", "defending", "physical"] as const;
type AttrKey = (typeof ATTR_KEYS)[number];

export default async function ParentDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: links } = await supabase
    .from("parent_player_links")
    .select(`
      players (
        id, full_name, position, date_of_birth, share_token,
        player_ratings ( rating ),
        player_attributes ( pace, shooting, passing, dribbling, defending, physical )
      )
    `)
    .eq("parent_id", user.id);

  type AttrRow = Record<AttrKey, number>;
  type ChildPlayer = {
    id: string; full_name: string; position: string | null;
    date_of_birth: string | null; share_token: string;
    player_ratings: { rating: number }[];
    player_attributes: AttrRow[];
  };

  const children = (links ?? []).flatMap((l: { players: ChildPlayer | ChildPlayer[] | null }) =>
    Array.isArray(l.players) ? l.players : l.players ? [l.players] : []
  );

  function childOverall(child: ChildPlayer) {
    const attrRows = child.player_attributes ?? [];
    if (attrRows.length > 0) {
      const avg = (key: AttrKey) => attrRows.reduce((s, r) => s + r[key], 0) / attrRows.length;
      return Math.round(ATTR_KEYS.reduce((s, k) => s + avg(k), 0) / ATTR_KEYS.length);
    }
    const ratings = child.player_ratings.map((r) => r.rating);
    return ratings.length
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 20)
      : 0;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">My Children</h1>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-1">Link a child</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Enter your child&apos;s share code (found on their passport page or ask the coach).
        </p>
        <LinkChildForm />
      </div>

      {children.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No children linked yet</CardTitle>
            <CardDescription>Ask your child&apos;s coach for their share code.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {children.map((child) => {
            const overall = childOverall(child);
            const pos = POSITIONS.find((p) => p.value === child.position)?.label ?? "—";
            const age = child.date_of_birth
              ? Math.floor((Date.now() - new Date(child.date_of_birth).getTime()) / 31_557_600_000)
              : null;

            return (
              <Link key={child.id} href={`/dashboard/parent/${child.id}`} className="block">
                <Card className="overflow-hidden transition-colors hover:border-primary/50">
                  <div className="h-1 bg-brand" />
                  <CardHeader className="flex-row items-center justify-between">
                    <div>
                      <CardTitle>{child.full_name}</CardTitle>
                      <CardDescription>{pos}</CardDescription>
                    </div>
                    <RatingRing value={overall} size={64} />
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    <Badge variant="brand">{pos}</Badge>
                    {age && <Badge variant="neutral">Age {age}</Badge>}
                    <Badge variant="neutral">{child.player_ratings.length} ratings</Badge>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
