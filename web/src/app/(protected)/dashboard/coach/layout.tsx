import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  if (profile?.role !== "coach") redirect("/dashboard");
  return <>{children}</>;
}
