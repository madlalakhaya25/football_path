"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Target, Users, Building2 } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/authStore";
import type { AuthProfile } from "@/store/authStore";
import type { UserRole } from "@/lib/types";

const ROLES: { value: UserRole; label: string; description: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "player", label: "Player", description: "Track your stats and build your passport.", Icon: Target },
  { value: "coach",  label: "Coach",  description: "Manage your squad and log match results.", Icon: Users },
  { value: "parent", label: "Parent", description: "Follow your child's progress.", Icon: Shield },
  { value: "admin",  label: "Admin",  description: "Manage an existing club as administrator.", Icon: Building2 },
];

const ROLE_ROUTES: Record<UserRole, string> = {
  admin: "/dashboard/admin",
  coach: "/dashboard/coach",
  player: "/dashboard/player",
  parent: "/dashboard/parent",
};

const INPUT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export default function RolePage() {
  const router = useRouter();
  const setProfile = useAuthStore((s) => s.setProfile);

  const [selected, setSelected] = useState<UserRole | null>(null);
  const [clubCode, setClubCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    if (!selected) return;
    if (!clubCode || clubCode.trim().length < 4) {
      setError("Enter your club join code.");
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    if (!supabase) { setError("Auth service unavailable — check Supabase env vars."); setLoading(false); return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }

    // Look up academy by join code
    const { data: academyData } = await supabase.rpc('find_academy_by_join_code', { p_code: clubCode.toUpperCase() });
    if (academyData?.error || !academyData?.academy_id) {
      setError("Invalid club code — check with your club admin.");
      setLoading(false);
      return;
    }

    const { data, error: upsertErr } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        role: selected,
        academy_id: academyData.academy_id,
        full_name: user.email?.split("@")[0] ?? "New user",
      })
      .select("id, role, academy_id, full_name")
      .single();

    if (upsertErr || !data) {
      setError(upsertErr?.message ?? "Could not save profile.");
      setLoading(false);
      return;
    }

    const profile: AuthProfile = {
      userId: data.id,
      role: data.role as UserRole,
      academyId: data.academy_id,
      fullName: data.full_name,
    };
    setProfile(profile);
    router.push(ROLE_ROUTES[profile.role] ?? "/dashboard/player");
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-3">
          <Logo />
          <h1 className="text-2xl font-bold tracking-tight">Who are you?</h1>
          <p className="text-center text-sm text-muted-foreground">
            Choose the role that best describes you. You can change this later.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {ROLES.map(({ value, label, description, Icon }) => (

            <button
              key={value}
              type="button"
              onClick={() => setSelected(value)}
              aria-pressed={selected === value}
              className={cn(
                "flex flex-col gap-2 rounded-xl border p-4 text-left transition-colors",
                selected === value
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:border-primary/40"
              )}
            >
              <span className="grid size-10 place-items-center rounded-lg bg-brand/15 text-primary">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span className="font-semibold">{label}</span>
              <span className="text-xs text-muted-foreground">{description}</span>
            </button>
          ))}
        </div>

        {/* Club join code */}
        <div className="space-y-1.5">
          <label htmlFor="club_code" className="text-sm font-medium">Club join code</label>
          <input
            id="club_code"
            type="text"
            autoComplete="off"
            placeholder="e.g. ABC123"
            value={clubCode}
            onChange={(e) => setClubCode(e.target.value.toUpperCase())}
            className={INPUT_CLASS}
          />
          <p className="text-xs text-muted-foreground">
            6-character code from your club admin.{" "}
            <Link href="/register-club" className="underline">
              Register a new club instead
            </Link>
          </p>
        </div>

        {error && (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button
          className="w-full"
          disabled={!selected || loading}
          onClick={handleContinue}
        >
          {loading ? "Saving…" : "Continue"}
        </Button>
      </div>
    </div>
  );
}
