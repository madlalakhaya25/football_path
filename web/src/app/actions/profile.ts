"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";

const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").max(80),
  phone: z.string().max(20).optional(),
  bio: z.string().max(300).optional(),
  coaching_role: z.string().max(80).optional(),
});

export async function updateProfile(formData: FormData) {
  const { supabase, user } = await requireUser();

  const raw = {
    full_name: formData.get("full_name") as string,
    phone: (formData.get("phone") as string) || undefined,
    bio: (formData.get("bio") as string) || undefined,
    coaching_role: (formData.get("coaching_role") as string) || undefined,
  };

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    const msgs = parsed.error.flatten().fieldErrors;
    return { error: Object.values(msgs).flat()[0] ?? "Invalid input." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone ?? null,
      bio: parsed.data.bio ?? null,
      coaching_role: parsed.data.coaching_role ?? null,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard", "layout");
  return { success: true };
}
