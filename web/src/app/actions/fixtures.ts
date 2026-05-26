"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createFixtureSchema } from "@/lib/validation";
import { z } from "zod";

async function getCoachTeamIds(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: teams } = await supabase
    .from("teams")
    .select("id")
    .eq("coach_id", userId)
    .eq("active", true);
  return (teams ?? []).map((t: { id: string }) => t.id);
}

export async function createFixture(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const teamId = formData.get("team_id") as string;
  if (!teamId) return { error: "No team selected." };

  const { data: team } = await supabase
    .from("teams")
    .select("id")
    .eq("id", teamId)
    .eq("coach_id", user.id)
    .eq("active", true)
    .single();

  if (!team) return { error: "Team not found." };

  const raw = {
    opponent: formData.get("opponent") as string,
    venue: (formData.get("venue") as string) || undefined,
    fixture_date: formData.get("fixture_date") as string,
    is_home: formData.get("is_home") === "true",
    notes: (formData.get("notes") as string) || undefined,
  };

  const parsed = createFixtureSchema.safeParse(raw);
  if (!parsed.success) {
    const msgs = parsed.error.flatten().fieldErrors;
    return { error: Object.values(msgs).flat()[0] ?? "Invalid input." };
  }

  const { error } = await supabase
    .from("fixtures")
    .insert({ ...parsed.data, team_id: teamId });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/coach/fixtures");
  redirect(`/dashboard/coach/fixtures?team=${teamId}`);
}

export async function cancelFixture(fixtureId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const teamIds = await getCoachTeamIds(supabase, user.id);
  if (!teamIds.length) return { error: "No team found." };

  const { error } = await supabase
    .from("fixtures")
    .update({ status: "cancelled" })
    .eq("id", fixtureId)
    .in("team_id", teamIds);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/coach/fixtures");
  return { success: true };
}

const logMatchSchema = z.object({
  fixture_id: z.string().uuid(),
  team_score: z.coerce.number().int().min(0).max(30),
  opponent_score: z.coerce.number().int().min(0).max(30),
  match_notes: z.string().max(500).optional(),
  appearances: z.array(z.object({ player_id: z.string().uuid(), played: z.boolean() })),
  ratings: z.array(z.object({
    player_id: z.string().uuid(),
    rating: z.coerce.number().int().min(1).max(5),
    note: z.string().max(200).optional(),
  })),
});

export async function logMatch(payload: unknown) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const teamIds = await getCoachTeamIds(supabase, user.id);
  if (!teamIds.length) return { error: "No team found." };

  const parsed = logMatchSchema.safeParse(payload);
  if (!parsed.success) return { error: "Invalid payload." };

  const { fixture_id, team_score, opponent_score, match_notes, appearances, ratings } = parsed.data;

  const { data: fixture } = await supabase
    .from("fixtures")
    .select("id")
    .eq("id", fixture_id)
    .in("team_id", teamIds)
    .single();

  if (!fixture) return { error: "Fixture not found." };

  const { error: fnError } = await supabase.functions.invoke("log-match", {
    body: { fixture_id, team_score, opponent_score, match_notes, appearances, ratings },
  });

  if (fnError) {
    // Fallback: write directly if edge function unavailable
    const [r1, r2, r3, r4] = await Promise.all([
      supabase.from("match_results").upsert(
        { fixture_id, team_score, opponent_score, match_notes, logged_by: user.id },
        { onConflict: "fixture_id" }
      ),
      supabase.from("fixtures").update({ status: "completed" }).eq("id", fixture_id),
      appearances.length
        ? supabase.from("match_appearances").upsert(
            appearances.map((a) => ({ fixture_id, ...a })),
            { onConflict: "fixture_id,player_id" }
          )
        : Promise.resolve({ error: null }),
      ratings.length
        ? supabase.from("player_ratings").upsert(
            ratings.map((r) => ({ fixture_id, ...r, coach_id: user.id })),
            { onConflict: "fixture_id,player_id,coach_id" }
          )
        : Promise.resolve({ error: null }),
    ]);
    const err = r1.error ?? r2.error ?? r3.error ?? r4.error;
    if (err) return { error: err.message };
  }

  revalidatePath(`/dashboard/coach/fixtures/${fixture_id}`);
  revalidatePath("/dashboard/coach/fixtures");
  redirect(`/dashboard/coach/fixtures/${fixture_id}`);
}
