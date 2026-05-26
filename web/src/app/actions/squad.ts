"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createPlayerSchema, createTeamSchema } from "@/lib/validation";

async function getCoachTeam() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: team } = await supabase
    .from("teams")
    .select("id, academy_id")
    .eq("coach_id", user.id)
    .eq("active", true)
    .single();

  return { supabase, user, team };
}

export async function addPlayerToSquad(playerId: string) {
  const { supabase, team } = await getCoachTeam();
  if (!team) return { error: "No team found." };

  const { error } = await supabase
    .from("team_members")
    .upsert({ team_id: team.id, player_id: playerId, active: true }, { onConflict: "team_id,player_id" });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/coach/squad");
  return { success: true };
}

export async function removePlayerFromSquad(playerId: string) {
  const { supabase, team } = await getCoachTeam();
  if (!team) return { error: "No team found." };

  const { error } = await supabase
    .from("team_members")
    .update({ active: false })
    .eq("team_id", team.id)
    .eq("player_id", playerId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/coach/squad");
  return { success: true };
}

export async function createPlayer(formData: FormData) {
  const { supabase, team } = await getCoachTeam();
  if (!team) return { error: "No team found." };

  const num = (key: string) => {
    const v = formData.get(key);
    return v !== null && v !== "" ? Number(v) : undefined;
  };
  const raw = {
    full_name: formData.get("full_name") as string,
    date_of_birth: (formData.get("date_of_birth") as string) || undefined,
    position: (formData.get("position") as string) || undefined,
    preferred_foot: (formData.get("preferred_foot") as string) || undefined,
    pace:      num("pace"),
    shooting:  num("shooting"),
    passing:   num("passing"),
    dribbling: num("dribbling"),
    defending: num("defending"),
    physical:  num("physical"),
  };

  const parsed = createPlayerSchema.safeParse(raw);
  if (!parsed.success) {
    const msgs = parsed.error.flatten().fieldErrors;
    return { error: Object.values(msgs).flat()[0] ?? "Invalid input." };
  }

  const { data: player, error: createErr } = await supabase
    .from("players")
    .insert({ ...parsed.data, academy_id: team.academy_id })
    .select("id")
    .single();

  if (createErr || !player) return { error: createErr?.message ?? "Could not create player." };

  const { error: memberErr } = await supabase
    .from("team_members")
    .insert({ team_id: team.id, player_id: player.id });

  if (memberErr) return { error: memberErr.message };

  revalidatePath("/dashboard/coach/squad");
  redirect("/dashboard/coach/squad");
}

export async function updateTeam(teamId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const raw = {
    name: formData.get("name") as string,
    age_group: (formData.get("age_group") as string) || undefined,
  };
  const parsed = createTeamSchema.safeParse(raw);
  if (!parsed.success) {
    const msgs = parsed.error.flatten().fieldErrors;
    return { error: Object.values(msgs).flat()[0] ?? "Invalid input." };
  }

  const { error } = await supabase
    .from("teams")
    .update(parsed.data)
    .eq("id", teamId)
    .eq("coach_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/teams");
  revalidatePath("/dashboard/coach");
  return { success: true };
}

export async function deleteTeam(teamId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { error } = await supabase
    .from("teams")
    .update({ active: false })
    .eq("id", teamId)
    .eq("coach_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/teams");
  revalidatePath("/dashboard/coach");
  redirect("/dashboard/admin/teams");
}

export async function createTeam(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("academy_id")
    .eq("id", user.id)
    .single();
  if (!profile?.academy_id) return { error: "No academy linked." };

  const raw = {
    name: formData.get("name") as string,
    age_group: (formData.get("age_group") as string) || undefined,
  };

  const parsed = createTeamSchema.safeParse(raw);
  if (!parsed.success) {
    const msgs = parsed.error.flatten().fieldErrors;
    return { error: Object.values(msgs).flat()[0] ?? "Invalid input." };
  }

  const { error } = await supabase
    .from("teams")
    .insert({ ...parsed.data, academy_id: profile.academy_id, coach_id: user.id });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/coach");
  redirect("/dashboard/coach");
}
