import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, Calendar, Star } from "lucide-react";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("academy_id")
    .eq("id", user.id)
    .single();

  if (!profile?.academy_id) redirect("/auth/role");

  const academyId = profile.academy_id;

  const [players, teams, fixtures, ratings] = await Promise.all([
    supabase.from("players").select("id", { count: "exact" }).eq("academy_id", academyId).eq("active", true),
    supabase.from("teams").select("id", { count: "exact" }).eq("academy_id", academyId).eq("active", true),
    supabase.from("fixtures").select("id", { count: "exact" }).eq("status", "upcoming"),
    supabase.from("player_ratings").select("id", { count: "exact" }),
  ]);

  const stats = [
    { label: "Active players", value: players.count ?? 0, Icon: Users },
    { label: "Teams", value: teams.count ?? 0, Icon: Shield },
    { label: "Upcoming fixtures", value: fixtures.count ?? 0, Icon: Calendar },
    { label: "Ratings logged", value: ratings.count ?? 0, Icon: Star },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Academy Overview</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, Icon }) => (
          <Card key={label}>
            <CardHeader className="flex-row items-center gap-3 pb-2">
              <span className="grid size-9 place-items-center rounded-lg bg-brand/15 text-primary">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tabular-nums">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
