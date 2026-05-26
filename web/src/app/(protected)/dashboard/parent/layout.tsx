import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  if (profile?.role !== "parent") redirect("/dashboard");
  return <>{children}</>;
}
