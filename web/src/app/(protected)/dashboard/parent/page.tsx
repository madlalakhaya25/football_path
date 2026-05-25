import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RatingRing } from "@/components/ui/rating-ring";
import { POSITIONS } from "@/lib/types";

export default async function ParentDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: links } = await supabase
    .from("parent_player_links")
    .select(`
      players (
        id, full_name, position, date_of_birth, share_token,
        player_ratings ( rating )
      )
    `)
    .eq("parent_id", user.id);

  type ChildPlayer = { id: string; full_name: string; position: string | null; date_of_birth: string | null; share_token: string; player_ratings: { rating: number }[] };
  const children = (links ?? []).flatMap((l: { players: ChildPlayer | ChildPlayer[] | null }) =>
    Array.isArray(l.players) ? l.players : l.players ? [l.players] : []
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Children</h1>

      {children.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No children linked yet</CardTitle>
            <CardDescription>
              Ask your child&apos;s coach for their share code, then link them here.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {children.map((child) => {
            if (!child) return null;
            const ratings = (child.player_ratings ?? []).map((r: { rating: number }) => r.rating);
            const avg = ratings.length
              ? Math.round((ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length) * 20)
              : 0;
            const pos = POSITIONS.find((p) => p.value === child.position)?.label ?? "—";
            const age = child.date_of_birth
              ? Math.floor((Date.now() - new Date(child.date_of_birth).getTime()) / 31_557_600_000)
              : null;

            return (
              <Card key={child.id} className="overflow-hidden">
                <div className="h-1 bg-brand" />
                <CardHeader className="flex-row items-center justify-between">
                  <div>
                    <CardTitle>{child.full_name}</CardTitle>
                    <CardDescription>{pos}</CardDescription>
                  </div>
                  <RatingRing value={avg} size={64} />
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Badge variant="brand">{pos}</Badge>
                  {age && <Badge variant="neutral">Age {age}</Badge>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
