import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  if (!profile?.role || !profile.academy_id) redirect("/auth/role");

  return (
    <DashboardShell profile={profile}>
      {children}
    </DashboardShell>
  );
}
