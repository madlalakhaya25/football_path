import { redirect } from "next/navigation";
import { Megaphone } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";

export default async function ParentAnnouncementsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Find all players linked to this parent
  const { data: links } = await supabase
    .from("parent_player_links")
    .select("player_id")
    .eq("parent_id", user.id);

  const playerIds = (links ?? []).map((l: { player_id: string }) => l.player_id);

  if (!playerIds.length) {
    return (
      <PageShell>
        <EmptyState
          icon={<Megaphone className="size-8 text-muted-foreground/40" />}
          title="No children linked"
          description="Link your child's profile to see their team announcements."
        />
      </PageShell>
    );
  }

  // Find all teams those players belong to
  const { data: memberRows } = await supabase
    .from("team_members")
    .select("team_id, player_id, teams(name)")
    .in("player_id", playerIds)
    .eq("active", true);

  const teamIds = [...new Set((memberRows ?? []).map((m: { team_id: string }) => m.team_id))];

  // Build a map: team_id → team name
  const teamMap = new Map(
    (memberRows ?? []).map((m: {
      team_id: string;
      teams: { name: string } | { name: string }[] | null;
    }) => [
      m.team_id,
      Array.isArray(m.teams) ? m.teams[0]?.name : (m.teams as { name: string } | null)?.name,
    ])
  );

  if (!teamIds.length) {
    return (
      <PageShell>
        <EmptyState
          icon={<Megaphone className="size-8 text-muted-foreground/40" />}
          title="No team memberships yet"
          description="Your child's coach will add them to a team. Announcements will appear here."
        />
      </PageShell>
    );
  }

  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, title, body, created_at, team_id")
    .in("team_id", teamIds)
    .order("created_at", { ascending: false });

  const multiTeam = teamIds.length > 1;

  return (
    <PageShell count={(announcements ?? []).length}>
      {(announcements ?? []).length === 0 ? (
        <EmptyState
          icon={<Megaphone className="size-8 text-muted-foreground/40" />}
          title="Nothing yet"
          description="Your child's coach's announcements will appear here."
        />
      ) : (
        <div className="space-y-2">
          {(announcements ?? []).map((a) => {
            const teamName = teamMap.get(a.team_id);
            const isRecent = Date.now() - new Date(a.created_at).getTime() < 24 * 3_600_000;
            return (
              <article
                key={a.id}
                className="flex gap-0 overflow-hidden rounded-xl border border-border bg-card"
              >
                <div className="w-1 shrink-0 bg-primary" />
                <div className="flex-1 px-4 py-3.5 space-y-1.5">
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
              </article>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

function PageShell({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Announcements</h1>
        {count != null && count > 0 && (
          <span className="text-sm text-muted-foreground">{count} messages</span>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ icon, title, description }: {
  icon: React.ReactNode; title: string; description: string;
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
