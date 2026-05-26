import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";

export default async function CoachSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, bio, coaching_role")
    .eq("id", user.id)
    .single();

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold">Profile settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Update your coaching profile.</p>
      </div>
      <ProfileForm
        defaultValues={{
          full_name: profile?.full_name ?? "",
          phone: profile?.phone ?? "",
          bio: profile?.bio ?? "",
          coaching_role: profile?.coaching_role ?? "",
        }}
      />
    </div>
  );
}
