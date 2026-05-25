import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, academy_id, full_name, avatar_url")
    .eq("id", user.id)
    .single();

  if (!profile?.role || !profile.academy_id) redirect("/auth/role");

  return (
    <DashboardShell profile={profile}>
      {children}
    </DashboardShell>
  );
}
