import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

const ROLE_ROUTES: Record<UserRole, string> = {
  admin: "/dashboard/admin",
  coach: "/dashboard/coach",
  player: "/dashboard/player",
  parent: "/dashboard/parent",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile?.role) redirect("/auth/role");

  redirect(ROLE_ROUTES[profile.role as UserRole] ?? "/dashboard/player");
}
