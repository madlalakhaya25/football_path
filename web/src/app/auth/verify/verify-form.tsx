"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/authStore";
import type { AuthProfile } from "@/store/authStore";
import type { UserRole } from "@/lib/types";

const DEFAULT_ACADEMY_ID = "00000000-0000-0000-0000-000000000001";

const ROLE_ROUTES: Record<UserRole, string> = {
  admin: "/dashboard/admin",
  coach: "/dashboard/coach",
  player: "/dashboard/player",
  parent: "/dashboard/parent",
};

interface RegistrationData {
  full_name: string;
  role: UserRole;
  phone: string;
}

export function VerifyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const phone = params.get("phone") ?? "";
  const setProfile = useAuthStore((s) => s.setProfile);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { inputs.current[0]?.focus(); }, []);

  function handleChange(idx: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[idx] = value;
    setOtp(next);
    if (value && idx < 5) inputs.current[idx + 1]?.focus();
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = otp.join("");
    if (token.length !== 6) { setError("Enter all 6 digits."); return; }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    if (!supabase) { setError("Auth service unavailable — check Supabase env vars."); setLoading(false); return; }

    const { error: authErr } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
    if (authErr) { setError(authErr.message); setLoading(false); return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // ── New registration: create profile from sessionStorage ──
    const raw = sessionStorage.getItem("gf-register");
    if (raw) {
      sessionStorage.removeItem("gf-register");
      const reg: RegistrationData = JSON.parse(raw);

      const { data, error: upsertErr } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          full_name: reg.full_name,
          role: reg.role,
          phone: reg.phone,
          academy_id: DEFAULT_ACADEMY_ID,
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
      return;
    }

    // ── Returning sign-in: look up existing profile ───────────
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, role, academy_id, full_name")
      .eq("id", user.id)
      .single();

    if (!profileData?.role || !profileData.academy_id) {
      router.push("/auth/role");
      return;
    }

    const profile: AuthProfile = {
      userId: profileData.id,
      role: profileData.role as UserRole,
      academyId: profileData.academy_id,
      fullName: profileData.full_name,
    };
    setProfile(profile);
    router.push(ROLE_ROUTES[profile.role] ?? "/dashboard/player");
  }

  async function resend() {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signInWithOtp({ phone });
    setError(null);
    setOtp(["", "", "", "", "", ""]);
    inputs.current[0]?.focus();
  }

  return (
    <div className="flex min-h-dvh flex-col px-4 py-6">
      <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground w-fit">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back
      </Link>
      <div className="flex flex-1 flex-col items-center justify-center">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <Logo />
          <h1 className="text-2xl font-bold tracking-tight">Check your phone</h1>
          <p className="text-center text-sm text-muted-foreground">
            We sent a 6-digit code to{" "}
            <span className="font-medium text-foreground">{phone}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2" role="group" aria-label="One-time passcode">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                aria-label={`Digit ${i + 1}`}
                className="h-12 w-10 rounded-md border border-input bg-background text-center text-lg font-bold tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            ))}
          </div>

          {error && (
            <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Verifying…" : "Confirm"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Didn&apos;t receive it?{" "}
          <button
            type="button"
            onClick={resend}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Resend
          </button>
        </p>
      </div>
      </div>
    </div>
  );
}
