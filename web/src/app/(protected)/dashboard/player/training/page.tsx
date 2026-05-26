import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TYPE_LABEL: Record<string, string> = {
  general: "General",
  technical: "Technical",
  tactical: "Tactical",
  fitness: "Fitness",
  match_prep: "Match Prep",
  recovery: "Recovery",
};

export default async function PlayerTrainingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: player } = await supabase
    .from("players")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!player) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Training</h1>
        <p className="text-muted-foreground">No player profile found. Ask your coach to add you to the squad.</p>
      </div>
    );
  }

  const { data: memberRows } = await supabase
    .from("team_members")
    .select("team_id, teams ( name )")
    .eq("player_id", player.id)
    .eq("active", true);

  const teamIds = (memberRows ?? []).map((m: { team_id: string }) => m.team_id);
  const teamMap = new Map(
    (memberRows ?? []).map((m: { team_id: string; teams: { name: string } | { name: string }[] | null }) => [
      m.team_id,
      Array.isArray(m.teams) ? m.teams[0] : m.teams,
    ])
  );

  if (!teamIds.length) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Training</h1>
        <p className="text-muted-foreground">You&apos;re not in a team yet. Ask your coach to add you.</p>
      </div>
    );
  }

  const { data: sessions } = await supabase
    .from("training_sessions")
    .select("id, team_id, title, session_date, location, session_type")
    .in("team_id", teamIds)
    .order("session_date", { ascending: false });

  const now = new Date();
  const allSessions = sessions ?? [];
  const upcoming = allSessions.filter((s) => new Date(s.session_date) >= now);
  const past = allSessions.filter((s) => new Date(s.session_date) < now);

  type Session = (typeof allSessions)[number];

  function SessionRow({ s }: { s: Session }) {
    const date = new Date(s.session_date);
    const teamInfo = teamMap.get(s.team_id) as { name: string } | null | undefined;

    return (
      <Link
        href={`/dashboard/player/training/${s.id}`}
        className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
      >
        <div className="min-w-0">
          <p className="font-medium">{s.title}</p>
          <p className="text-xs text-muted-foreground">
            {date.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" })}
            {" · "}
            {date.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
            {s.location && ` · ${s.location}`}
          </p>
          {teamIds.length > 1 && teamInfo && (
            <span className="text-xs text-muted-foreground">{teamInfo.name}</span>
          )}
        </div>
        <Badge variant="outline" className="capitalize shrink-0">
          {TYPE_LABEL[s.session_type] ?? s.session_type}
        </Badge>
      </Link>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Training</h1>

      {allSessions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No sessions yet</CardTitle>
            <CardDescription>Your upcoming training sessions will appear here.</CardDescription>
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
                {upcoming.map((s) => <SessionRow key={s.id} s={s} />)}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Past · {past.length}
              </h2>
              <div className={cn("divide-y divide-border rounded-xl border border-border opacity-75")}>
                {past.map((s) => <SessionRow key={s.id} s={s} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
