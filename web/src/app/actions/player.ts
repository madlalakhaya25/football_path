"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function claimPlayerProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const token = (formData.get("share_token") as string ?? "").toLowerCase().trim();
  if (!token) return { error: "Share token is required." };

  // Find the unclaimed player record with this token
  const { data: player } = await supabase
    .from("players")
    .select("id, full_name")
    .eq("share_token", token)
    .is("profile_id", null)
    .single();

  if (!player) return { error: "Token not found, or this profile has already been claimed." };

  // Claim it — the player_self_claim RLS policy (migration 003) permits this
  const { error } = await supabase
    .from("players")
    .update({ profile_id: user.id })
    .eq("id", player.id)
    .is("profile_id", null);

  if (error) return { error: error.message };

  redirect("/dashboard/player");
}
