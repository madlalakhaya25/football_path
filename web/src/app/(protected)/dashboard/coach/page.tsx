import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Calendar, Trophy, Plus } from "lucide-react";
import { CreateTeamForm } from "@/components/create-team-form";

export default async function CoachDashboardPage() {
  const { supabase, user } = await requireUser();

  const { data: teamRows } = await supabase
    .from("teams")
    .select("id, name, age_group, invite_code")
    .eq("coach_id", user.id)
    .eq("active", true);

  const allTeams = await Promise.all(
    (teamRows ?? []).map(async (team) => {
      const [{ count: squadCount }, { count: upcomingCount }] = await Promise.all([
        supabase
          .from("team_members")
          .select("*", { count: "exact", head: true })
          .eq("team_id", team.id)
          .eq("active", true),
        supabase
          .from("fixtures")
          .select("*", { count: "exact", head: true })
          .eq("team_id", team.id)
          .eq("status", "upcoming"),
      ]);
      return { ...team, squadCount: squadCount ?? 0, upcomingCount: upcomingCount ?? 0 };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Coach Dashboard</h1>
        {allTeams.length > 0 && (
          <Button asChild>
            <Link href="#create-team">
              <Plus className="size-4" aria-hidden="true" />
              New team
            </Link>
          </Button>
        )}
      </div>

      {allTeams.length === 0 ? (
        <Card id="create-team">
          <CardHeader>
            <CardTitle>Create your team</CardTitle>
            <CardDescription>Set up your team to start managing your squad and fixtures.</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateTeamForm />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {allTeams.map((team) => (
              <Card key={team.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg leading-tight">{team.name}</CardTitle>
                    {team.age_group && (
                      <Badge variant="brand" className="shrink-0 text-xs">
                        {team.age_group}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium">
                      <Users className="size-3 text-muted-foreground" aria-hidden="true" />
                      {team.squadCount} players
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium">
                      <Calendar className="size-3 text-muted-foreground" aria-hidden="true" />
                      {team.upcomingCount} upcoming
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium">
                      <Trophy className="size-3 text-muted-foreground" aria-hidden="true" />
                      <span className="font-mono tracking-widest">{team.invite_code}</span>
                    </span>
                  </div>
                  <div className="mt-auto flex gap-2">
                    <Button asChild size="sm" variant="outline" className="flex-1">
                      <Link href={`/dashboard/coach/squad?team=${team.id}`}>
                        Squad →
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="flex-1">
                      <Link href={`/dashboard/coach/fixtures?team=${team.id}`}>
                        Fixtures →
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card id="create-team">
            <CardHeader>
              <CardTitle>Create another team</CardTitle>
              <CardDescription>Add a new team to your coaching portfolio.</CardDescription>
            </CardHeader>
            <CardContent>
              <CreateTeamForm />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
