import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogResultForm } from "./log-result-form";

export default async function LogResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: fixture } = await supabase
    .from("fixtures")
    .select("id, opponent, fixture_date, is_home, status, team_id")
    .eq("id", id)
    .single();

  if (!fixture) notFound();
  if (fixture.status !== "upcoming") redirect(`/dashboard/coach/fixtures/${id}`);

  const { data: members } = await supabase
    .from("team_members")
    .select("players ( id, full_name, position )")
    .eq("team_id", fixture.team_id)
    .eq("active", true);

  type PlayerRow = { id: string; full_name: string; position: string | null };
  const squad: PlayerRow[] = (members ?? []).flatMap((m: { players: PlayerRow | PlayerRow[] | null }) =>
    Array.isArray(m.players) ? m.players : m.players ? [m.players] : []
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Log result</h1>
        <p className="text-sm text-muted-foreground">
          {fixture.is_home ? "vs" : "@"} {fixture.opponent} ·{" "}
          {new Date(fixture.fixture_date).toLocaleDateString("en-ZA", {
            day: "numeric", month: "short", year: "numeric",
          })}
        </p>
      </div>
      <LogResultForm fixtureId={id} squad={squad} isHome={fixture.is_home} opponent={fixture.opponent} />
    </div>
  );
}
