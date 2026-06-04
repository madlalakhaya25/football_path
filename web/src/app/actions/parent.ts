"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

type LookupType = "share_token" | "id_number" | "mysafa_number";

export async function linkChild(formData: FormData) {
  const { supabase, user } = await requireUser();

  const lookupType = (formData.get("lookup_type") as LookupType) ?? "share_token";
  const lookupValue = (formData.get("lookup_value") as string ?? "").trim();
  const relationship = (formData.get("relationship") as string) || "Parent";

  if (!lookupValue) return { error: "Please enter a value to search." };

  let playerQuery = supabase.from("players").select("id, full_name");

  if (lookupType === "id_number") {
    playerQuery = playerQuery.eq("id_number", lookupValue);
  } else if (lookupType === "mysafa_number") {
    playerQuery = playerQuery.eq("mysafa_number", lookupValue);
  } else {
    playerQuery = playerQuery.eq("share_token", lookupValue.toLowerCase());
  }

  const { data: player } = await playerQuery.maybeSingle();

  if (!player) {
    const labels: Record<LookupType, string> = {
      share_token: "share code",
      id_number: "ID / birth certificate number",
      mysafa_number: "MySAFA registration number",
    };
    return { error: `No player found with that ${labels[lookupType]}. Double-check and try again.` };
  }

  const { error } = await supabase
    .from("parent_player_links")
    .upsert(
      { parent_id: user.id, player_id: player.id, relationship },
      { onConflict: "parent_id,player_id" }
    );

  if (error) return { error: error.message };
  revalidatePath("/dashboard/parent");
  redirect("/dashboard/parent");
}
