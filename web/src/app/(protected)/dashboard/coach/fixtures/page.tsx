import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STATUS_VARIANT = {
  upcoming: "neutral",
  completed: "success",
  cancelled: "danger",
  postponed: "warning",
} as const;

export default async function CoachFixturesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: team } = await supabase
    .from("teams")
    .select("id, name")
    .eq("coach_id", user.id)
    .eq("active", true)
    .single();

  if (!team) redirect("/dashboard/coach");

  const { data: fixtures } = await supabase
    .from("fixtures")
    .select("id, opponent, venue, fixture_date, is_home, status")
    .eq("team_id", team.id)
    .order("fixture_date", { ascending: false });

  const upcoming = (fixtures ?? []).filter((f: { status: string }) => f.status === "upcoming");
  const past = (fixtures ?? []).filter((f: { status: string }) => f.status !== "upcoming");

  function FixtureRow({ f }: { f: { id: string; opponent: string; venue: string | null; fixture_date: string; is_home: boolean; status: string } }) {
    const date = new Date(f.fixture_date);
    return (
      <Link
        href={`/dashboard/coach/fixtures/${f.id}`}
        className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
      >
        <div className="min-w-0">
          <p className="font-medium">
            {f.is_home ? "vs" : "@"} {f.opponent}
          </p>
          <p className="text-xs text-muted-foreground">
            {date.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
            {f.venue && ` · ${f.venue}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs shrink-0">
            {f.is_home ? "Home" : "Away"}
          </Badge>
          <Badge variant={STATUS_VARIANT[f.status as keyof typeof STATUS_VARIANT] ?? "neutral"} className="capitalize shrink-0">
            {f.status}
          </Badge>
        </div>
      </Link>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Fixtures</h1>
        <Button asChild>
          <Link href="/dashboard/coach/fixtures/new">
            <Plus className="size-4" aria-hidden="true" />
            New fixture
          </Link>
        </Button>
      </div>

      {(fixtures ?? []).length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No fixtures yet</CardTitle>
            <CardDescription>Schedule your first match.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Upcoming · {upcoming.length}
              </h2>
              <div className="divide-y divide-border rounded-xl border border-border">
                {upcoming.map((f: { id: string; opponent: string; venue: string | null; fixture_date: string; is_home: boolean; status: string }) => <FixtureRow key={f.id} f={f} />)}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Past · {past.length}
              </h2>
              <div className="divide-y divide-border rounded-xl border border-border">
                {past.map((f: { id: string; opponent: string; venue: string | null; fixture_date: string; is_home: boolean; status: string }) => <FixtureRow key={f.id} f={f} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
