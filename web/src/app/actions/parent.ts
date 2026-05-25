"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { linkChildSchema } from "@/lib/validation";

export async function linkChild(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const raw = { share_token: formData.get("share_token") as string };
  const parsed = linkChildSchema.safeParse(raw);
  if (!parsed.success) {
    const msgs = parsed.error.flatten().fieldErrors;
    return { error: Object.values(msgs).flat()[0] ?? "Invalid code." };
  }

  const { data: player } = await supabase
    .from("players")
    .select("id")
    .eq("share_token", parsed.data.share_token.trim().toLowerCase())
    .single();

  if (!player) return { error: "No player found with that code. Double-check and try again." };

  const { error } = await supabase
    .from("parent_player_links")
    .upsert({ parent_id: user.id, player_id: player.id }, { onConflict: "parent_id,player_id" });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/parent");
  return { success: true };
}
