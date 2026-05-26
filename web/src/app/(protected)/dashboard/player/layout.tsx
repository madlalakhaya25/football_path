import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";

export default async function PlayerLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  if (profile?.role !== "player") redirect("/dashboard");
  return <>{children}</>;
}
