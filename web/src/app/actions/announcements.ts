"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

const announcementSchema = z.object({
  team_id: z.string().uuid("Invalid team"),
  title: z.string().min(1, "Title is required").max(100),
  body: z.string().min(1, "Message is required").max(2000),
});

async function getCoachTeamIds(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from("teams")
    .select("id")
    .eq("coach_id", userId)
    .eq("active", true);
  return (data ?? []).map((t: { id: string }) => t.id);
}

export async function createAnnouncement(formData: FormData) {
  const { supabase, user } = await requireUser();

  const raw = {
    team_id: formData.get("team_id") as string,
    title: formData.get("title") as string,
    body: formData.get("body") as string,
  };
  const parsed = announcementSchema.safeParse(raw);
  if (!parsed.success) {
    const msgs = parsed.error.flatten().fieldErrors;
    return { error: Object.values(msgs).flat()[0] ?? "Invalid input." };
  }

  // Verify coach owns this team
  const teamIds = await getCoachTeamIds(supabase, user.id);
  if (!teamIds.includes(parsed.data.team_id)) return { error: "Team not found." };

  const { error } = await supabase.from("announcements").insert({
    team_id: parsed.data.team_id,
    coach_id: user.id,
    title: parsed.data.title,
    body: parsed.data.body,
  });

  if (error) return { error: error.message };
  revalidateAnnouncementFeeds();
  return { success: true };
}

export async function deleteAnnouncement(id: string) {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("announcements")
    .delete()
    .eq("id", id)
    .eq("coach_id", user.id)
    .select("id");

  if (error) return { error: error.message };
  if (!data?.length) return { error: "Announcement not found." };
  revalidateAnnouncementFeeds();
  return { success: true };
}

function revalidateAnnouncementFeeds() {
  revalidatePath("/dashboard/coach/announcements", "page");
  revalidatePath("/dashboard/player/announcements", "page");
  revalidatePath("/dashboard/parent/announcements", "page");
}
