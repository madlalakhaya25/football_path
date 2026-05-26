import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { AddDrillForm } from "./add-drill-form";
import { DeleteSessionButton } from "./delete-session-button";
import { DeleteDrillButton } from "./delete-drill-button";

const TYPE_LABEL: Record<string, string> = {
  general: "General",
  technical: "Technical",
  tactical: "Tactical",
  fitness: "Fitness",
  match_prep: "Match Prep",
  recovery: "Recovery",
};

export default async function CoachTrainingSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: session } = await supabase
    .from("training_sessions")
    .select("id, team_id, title, session_date, location, session_type, notes, teams ( name )")
    .eq("id", id)
    .eq("coach_id", user.id)
    .single();

  if (!session) notFound();

  const { data: drills } = await supabase
    .from("training_drills")
    .select("id, title, description, video_url, sort_order")
    .eq("session_id", id)
    .order("sort_order");

  const date = new Date(session.session_date);
  const teamName = Array.isArray(session.teams) ? session.teams[0]?.name : (session.teams as { name: string } | null)?.name;

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="space-y-1">
        <Link
          href="/dashboard/coach/training"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to training
        </Link>
        <div className="flex items-start justify-between gap-4 pt-2">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold">{session.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {date.toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              {" · "}
              {date.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
              {session.location && ` · ${session.location}`}
            </p>
          </div>
          <DeleteSessionButton id={id} />
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Badge variant="outline">{TYPE_LABEL[session.session_type] ?? session.session_type}</Badge>
          {teamName && <Badge variant="neutral">{teamName}</Badge>}
        </div>
      </div>

      {session.notes && (
        <section className="rounded-xl border border-border p-4 space-y-1">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Session notes</h2>
          <p className="text-sm whitespace-pre-wrap">{session.notes}</p>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          Drills{" "}
          <span className="text-muted-foreground text-sm font-normal">
            ({(drills ?? []).length})
          </span>
        </h2>

        {(drills ?? []).length > 0 && (
          <div className="divide-y divide-border rounded-xl border border-border">
            {(drills ?? []).map((drill, idx) => (
              <div key={drill.id} className="px-4 py-3 space-y-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">
                      <span className="text-muted-foreground mr-2">{idx + 1}.</span>
                      {drill.title}
                    </p>
                    {drill.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">{drill.description}</p>
                    )}
                    {drill.video_url && (
                      <a
                        href={drill.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline mt-0.5 inline-block"
                      >
                        Watch video →
                      </a>
                    )}
                  </div>
                  <DeleteDrillButton drillId={drill.id} sessionId={id} />
                </div>
              </div>
            ))}
          </div>
        )}

        <AddDrillForm sessionId={id} />
      </section>
    </div>
  );
}
