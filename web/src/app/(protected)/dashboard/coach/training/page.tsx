import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TYPE_LABEL: Record<string, string> = {
  general: "General",
  technical: "Technical",
  tactical: "Tactical",
  fitness: "Fitness",
  match_prep: "Match Prep",
  recovery: "Recovery",
};

export default async function CoachTrainingPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string }>;
}) {
  const { team: teamParam } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: allTeams } = await supabase
    .from("teams")
    .select("id, name, age_group")
    .eq("coach_id", user.id)
    .eq("active", true)
    .order("created_at");

  if (!allTeams?.length) redirect("/dashboard/coach");

  const team = allTeams.find((t) => t.id === teamParam) ?? allTeams[0];

  const { data: sessions } = await supabase
    .from("training_sessions")
    .select("id, title, session_date, location, session_type")
    .eq("team_id", team.id)
    .eq("coach_id", user.id)
    .order("session_date", { ascending: false });

  const now = new Date();
  const upcoming = (sessions ?? []).filter((s) => new Date(s.session_date) >= now);
  const past = (sessions ?? []).filter((s) => new Date(s.session_date) < now);

  type Session = NonNullable<typeof sessions>[number];

  function SessionRow({ s }: { s: Session }) {
    const date = new Date(s.session_date);
    return (
      <Link
        href={`/dashboard/coach/training/${s.id}`}
        className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
      >
        <div className="min-w-0">
          <p className="font-medium">{s.title}</p>
          <p className="text-xs text-muted-foreground">
            {date.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
            {s.location && ` · ${s.location}`}
          </p>
        </div>
        <Badge variant="outline" className="capitalize shrink-0">
          {TYPE_LABEL[s.session_type] ?? s.session_type}
        </Badge>
      </Link>
    );
  }

  return (
    <div className="space-y-6">
      {allTeams.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {allTeams.map((t) => (
            <Link
              key={t.id}
              href={`/dashboard/coach/training?team=${t.id}`}
              className={cn(
                "rounded-full px-3 py-1 text-sm font-medium border transition-colors",
                t.id === team.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              )}
            >
              {t.name} {t.age_group && `· ${t.age_group}`}
            </Link>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Training</h1>
        <Button asChild>
          <Link href={`/dashboard/coach/training/new?team=${team.id}`}>
            <Plus className="size-4" aria-hidden="true" />
            New session
          </Link>
        </Button>
      </div>

      {(sessions ?? []).length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No sessions yet</CardTitle>
            <CardDescription>Plan your first training session.</CardDescription>
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
              <div className="divide-y divide-border rounded-xl border border-border">
                {past.map((s) => <SessionRow key={s.id} s={s} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
