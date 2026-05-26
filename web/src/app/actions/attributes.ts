"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const attributesSchema = z.object({
  pace:      z.number().int().min(1).max(99),
  shooting:  z.number().int().min(1).max(99),
  passing:   z.number().int().min(1).max(99),
  dribbling: z.number().int().min(1).max(99),
  defending: z.number().int().min(1).max(99),
  physical:  z.number().int().min(1).max(99),
  notes:     z.string().max(300).optional(),
});

export async function upsertPlayerAttributes(
  playerId: string,
  payload: {
    pace: number; shooting: number; passing: number;
    dribbling: number; defending: number; physical: number;
    notes: string;
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const parsed = attributesSchema.safeParse({
    ...payload,
    notes: payload.notes || undefined,
  });
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
    return { error: first ?? "Invalid input." };
  }

  const { error } = await supabase
    .from("player_attributes")
    .upsert(
      {
        player_id:   playerId,
        coach_id:    user.id,
        ...parsed.data,
        notes:       parsed.data.notes ?? null,
        assessed_at: new Date().toISOString(),
      },
      { onConflict: "player_id,coach_id" }
    );

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/coach/squad/${playerId}`);
  return { success: true };
}
