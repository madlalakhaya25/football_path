import { redirect } from "next/navigation";
import { Megaphone } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnnouncementForm } from "./announcement-form";
import { DeleteAnnouncementButton } from "./delete-announcement-button";
import { formatRelativeTime } from "@/lib/utils";

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
        <EmptyState
          icon={<Megaphone className="size-8 text-muted-foreground/40" />}
          title="No teams yet"
          description="Create a team first before posting announcements."
        />
      </div>
    );
  }

  const teamIds = allTeams.map((t) => t.id);

  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, title, body, created_at, team_id")
    .in("team_id", teamIds)
    .order("created_at", { ascending: false });

  const teamMap = new Map(allTeams.map((t) => [t.id, t.name]));
  const multiTeam = allTeams.length > 1;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Announcements</h1>
        {(announcements ?? []).length > 0 && (
          <span className="text-sm text-muted-foreground">
            {(announcements ?? []).length} posted
          </span>
        )}
      </div>

      {/* Compose */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">New announcement</CardTitle>
          <CardDescription>Broadcast a message to your squad.</CardDescription>
        </CardHeader>
        <CardContent>
          <AnnouncementForm teams={allTeams} />
        </CardContent>
      </Card>

      {/* Feed */}
      {(announcements ?? []).length === 0 ? (
        <EmptyState
          icon={<Megaphone className="size-8 text-muted-foreground/40" />}
          title="Nothing posted yet"
          description="Your announcements will appear here once you send one."
        />
      ) : (
        <div className="space-y-2">
          {(announcements ?? []).map((a) => {
            const teamName = teamMap.get(a.team_id);
            const isRecent = Date.now() - new Date(a.created_at).getTime() < 24 * 3_600_000;
            return (
              <article
                key={a.id}
                className="group flex gap-0 overflow-hidden rounded-xl border border-border bg-card"
              >
                {/* Left accent bar */}
                <div className="w-1 shrink-0 bg-primary" />

                <div className="flex flex-1 items-start gap-3 px-4 py-3.5">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold leading-snug">{a.title}</p>
                      {isRecent && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {a.body}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      {multiTeam && teamName && (
                        <Badge variant="outline" className="text-xs">{teamName}</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(a.created_at)}
                      </span>
                    </div>
                  </div>
                  <DeleteAnnouncementButton id={a.id} title={a.title} />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-12 text-center">
      {icon}
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
}
