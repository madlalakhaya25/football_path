"use server";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

export async function claimPlayerProfile(formData: FormData) {
  const { supabase } = await requireUser();

  const token = (formData.get("share_token") as string ?? "").toLowerCase().trim();
  if (!token) return { error: "Share token is required." };

  // Use a SECURITY DEFINER RPC so the lookup works regardless of whether
  // the player's profile has academy_id populated yet (migration 004)
  const { data, error } = await supabase.rpc("claim_player_profile", {
    p_share_token: token,
  });

  if (error) return { error: error.message };

  const result = data as { error?: string; success?: boolean };
  if (result?.error) return { error: result.error };

  redirect("/dashboard/player");
}
