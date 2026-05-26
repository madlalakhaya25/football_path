import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users } from "lucide-react";
import { TeamActions } from "./team-actions";

export default async function AdminTeamsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("academy_id")
    .eq("id", user.id)
    .single();
  if (!profile?.academy_id) redirect("/auth/role");

  const { data: teams } = await supabase
    .from("teams")
    .select(`
      id, name, age_group, invite_code, active, created_at,
      profiles ( full_name ),
      team_members ( player_id, active )
    `)
    .eq("academy_id", profile.academy_id)
    .eq("active", true)
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Teams</h1>
        <p className="text-sm text-muted-foreground">{teams?.length ?? 0} active teams</p>
      </div>

      {(teams ?? []).length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No teams yet</CardTitle>
            <CardDescription>Teams are created by coaches.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(teams ?? []).map((t: {
            id: string; name: string; age_group: string | null; invite_code: string;
            profiles: { full_name: string } | { full_name: string }[] | null;
            team_members: { player_id: string; active: boolean }[];
          }) => {
            const coach = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles;
            const activeCount = (t.team_members ?? []).filter((m) => m.active).length;

            return (
              <div key={t.id} className="rounded-xl border border-border bg-card p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    {t.age_group && <p className="text-sm text-muted-foreground">{t.age_group}</p>}
                  </div>
                  <Badge variant="brand">{t.age_group ?? "Open"}</Badge>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="size-4" aria-hidden="true" />
                  <span>{activeCount} player{activeCount !== 1 ? "s" : ""}</span>
                </div>

                {coach && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Coach: </span>
                    <span className="font-medium">{coach.full_name}</span>
                  </p>
                )}

                <div className="pt-1 border-t border-border">
                  <p className="text-xs text-muted-foreground">Invite code</p>
                  <p className="font-mono font-bold tracking-widest">{t.invite_code}</p>
                </div>

                <TeamActions teamId={t.id} name={t.name} ageGroup={t.age_group ?? ""} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
