import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnnouncementForm } from "./announcement-form";
import { DeleteAnnouncementButton } from "./delete-announcement-button";

export default async function CoachAnnouncementsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: allTeams } = await supabase
    .from("teams")
    .select("id, name")
    .eq("coach_id", user.id)
    .eq("active", true)
    .order("created_at");

  if (!allTeams?.length) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Announcements</h1>
        <Card>
          <CardHeader>
            <CardTitle>No teams yet</CardTitle>
            <CardDescription>Create a team first before posting announcements.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const teamIds = allTeams.map((t) => t.id);

  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, title, body, created_at, team_id, teams(name)")
    .in("team_id", teamIds)
    .order("created_at", { ascending: false });

  const teamMap = new Map(allTeams.map((t) => [t.id, t.name]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Announcements</h1>

      <Card>
        <CardHeader>
          <CardTitle>New announcement</CardTitle>
          <CardDescription>Post a message to your squad.</CardDescription>
        </CardHeader>
        <CardContent>
          <AnnouncementForm teams={allTeams} />
        </CardContent>
      </Card>

      {(announcements ?? []).length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No announcements yet</CardTitle>
            <CardDescription>Your posted announcements will appear here.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Posted · {(announcements ?? []).length}
          </h2>
          <div className="space-y-3">
            {(announcements ?? []).map((a) => {
              const teamName = teamMap.get(a.team_id) ?? (Array.isArray(a.teams) ? a.teams[0]?.name : (a.teams as { name: string } | null)?.name);
              const date = new Date(a.created_at);
              return (
                <div key={a.id} className="group relative rounded-xl border border-border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{a.title}</p>
                        {allTeams.length > 1 && teamName && (
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
                    <DeleteAnnouncementButton id={a.id} title={a.title} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
