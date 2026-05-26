"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { linkChildSchema } from "@/lib/validation";

export async function linkChild(formData: FormData) {
  const { supabase, user } = await requireUser();

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

  const relationship = (formData.get("relationship") as string) || "Parent";

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
