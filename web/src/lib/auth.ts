import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Cached per-request profile fetch — deduplicates across layout + sub-layout calls. */
export const getProfile = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, role, academy_id, full_name, avatar_url")
    .eq("id", user.id)
    .single();
  return data ?? null;
});

/** Auth guard for server actions — returns supabase client + user or redirects. */
export async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  return { supabase, user };
}
