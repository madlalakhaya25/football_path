import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function PlayerAnnouncementsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: player } = await supabase
    .from("players")
    .select("id")
    .eq("profile_id", user.id)
    .eq("active", true)
    .single();

  if (!player) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Announcements</h1>
        <p className="text-muted-foreground">No player profile found. Ask your coach to add you to the squad.</p>
      </div>
    );
  }

  const { data: memberRows } = await supabase
    .from("team_members")
    .select("team_id, teams(name)")
    .eq("player_id", player.id)
    .eq("active", true);

  const teamIds = (memberRows ?? []).map((m: { team_id: string }) => m.team_id);

  if (!teamIds.length) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Announcements</h1>
        <p className="text-muted-foreground">You&apos;re not in a team yet. Ask your coach for the team invite code.</p>
      </div>
    );
  }

  const teamMap = new Map(
    (memberRows ?? []).map((m: { team_id: string; teams: { name: string } | { name: string }[] | null }) => [
      m.team_id,
      Array.isArray(m.teams) ? m.teams[0]?.name : (m.teams as { name: string } | null)?.name,
    ])
  );

  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, title, body, created_at, team_id, teams(name)")
    .in("team_id", teamIds)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Announcements</h1>

      {(announcements ?? []).length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No announcements yet</CardTitle>
            <CardDescription>Your coach&apos;s announcements will appear here.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-3">
          {(announcements ?? []).map((a) => {
            const teamName = teamMap.get(a.team_id) ?? (Array.isArray(a.teams) ? a.teams[0]?.name : (a.teams as { name: string } | null)?.name);
            const date = new Date(a.created_at);
            return (
              <div key={a.id} className="rounded-xl border border-border p-4 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{a.title}</p>
                  {teamIds.length > 1 && teamName && (
                    <Badge variant="outline" className="text-xs">{teamName}</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{a.body}</p>
                <p className="text-xs text-muted-foreground">
                  {date.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                  {" · "}
                  {date.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
