"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";

export async function markMatchAttendance(
  fixtureId: string,
  playerId: string,
  status: "present" | "absent" | "late" | "excused"
) {
  const { supabase, user } = await requireUser();

  const { error } = await supabase.from("match_attendance").upsert(
    {
      fixture_id: fixtureId,
      player_id: playerId,
      status,
      marked_by: user.id,
      marked_at: new Date().toISOString(),
    },
    { onConflict: "fixture_id,player_id" }
  );

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/coach/fixtures/${fixtureId}`, "page");
  return { success: true };
}
