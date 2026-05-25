import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Trophy } from "lucide-react";

export default async function CoachDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: team } = await supabase
    .from("teams")
    .select("id, name, age_group, invite_code")
    .eq("coach_id", user.id)
    .eq("active", true)
    .single();

  const [squadResult, fixturesResult] = await Promise.all([
    team
      ? supabase.from("team_members").select("player_id").eq("team_id", team.id).eq("active", true)
      : Promise.resolve({ data: [] }),
    team
      ? supabase.from("fixtures").select("id, opponent, fixture_date, status").eq("team_id", team.id).order("fixture_date", { ascending: false }).limit(5)
      : Promise.resolve({ data: [] }),
  ]);

  const squadCount = squadResult.data?.length ?? 0;
  const fixtures = fixturesResult.data ?? [];
  const upcoming = fixtures.filter((f: { status: string }) => f.status === "upcoming");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Coach Dashboard</h1>
        {team && (
          <Badge variant="brand" className="text-sm">
            {team.name} {team.age_group && `· ${team.age_group}`}
          </Badge>
        )}
      </div>

      {!team ? (
        <Card>
          <CardHeader>
            <CardTitle>No team yet</CardTitle>
            <CardDescription>Create a team to start managing your squad.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex-row items-center gap-3 pb-2">
              <span className="grid size-9 place-items-center rounded-lg bg-brand/15 text-primary">
                <Users className="size-4" aria-hidden="true" />
              </span>
              <CardTitle className="text-sm font-medium text-muted-foreground">Squad size</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tabular-nums">{squadCount}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center gap-3 pb-2">
              <span className="grid size-9 place-items-center rounded-lg bg-brand/15 text-primary">
                <Calendar className="size-4" aria-hidden="true" />
              </span>
              <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tabular-nums">{upcoming.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center gap-3 pb-2">
              <span className="grid size-9 place-items-center rounded-lg bg-brand/15 text-primary">
                <Trophy className="size-4" aria-hidden="true" />
              </span>
              <CardTitle className="text-sm font-medium text-muted-foreground">Invite code</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-lg font-bold tracking-widest">{team.invite_code}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {fixtures.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Recent fixtures</h2>
          <div className="divide-y divide-border rounded-xl border border-border">
            {fixtures.map((f: { id: string; opponent: string; fixture_date: string; status: string }) => (
              <div key={f.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium">vs {f.opponent}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(f.fixture_date).toLocaleDateString("en-ZA", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </p>
                </div>
                <Badge
                  variant={
                    f.status === "completed" ? "success"
                    : f.status === "cancelled" ? "danger"
                    : "neutral"
                  }
                  className="capitalize"
                >
                  {f.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
