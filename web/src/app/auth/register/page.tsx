"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Shield, Target, Users } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { registerSchema, type RegisterInput } from "@/lib/validation";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_ACADEMY_ID } from "@/lib/constants";

const INPUT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const ROLE_ROUTES: Record<string, string> = {
  admin: "/dashboard/admin",
  coach: "/dashboard/coach",
  player: "/dashboard/player",
  parent: "/dashboard/parent",
};

const ROLES = [
  { value: "player" as const, label: "Player",  description: "Build your passport and get seen.", Icon: Target },
  { value: "coach"  as const, label: "Coach",   description: "Manage your squad and log results.", Icon: Users },
  { value: "parent" as const, label: "Parent",  description: "Follow your child's progress.", Icon: Shield },
];

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const selectedRole = watch("role");

  async function onSubmit(data: RegisterInput) {
    setServerError(null);
    const supabase = createClient();
    if (!supabase) { setServerError("Auth service unavailable — check Supabase env vars."); return; }

    const { data: signUpData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { full_name: data.full_name, role: data.role } },
    });
    if (error) { setServerError(error.message); return; }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setConfirmationSent(true);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setServerError("Could not retrieve user after sign-up."); return; }

    await supabase
      .from("profiles")
      .update({ full_name: data.full_name, role: data.role, academy_id: DEFAULT_ACADEMY_ID })
      .eq("id", user.id);

    if (data.role === "parent" && data.share_token && data.share_token.trim() !== "") {
      const { data: player } = await supabase
        .from("players")
        .select("id")
        .eq("share_token", data.share_token.trim().toLowerCase())
        .single();

      if (player) {
        await supabase
          .from("parent_player_links")
          .upsert({ parent_id: user.id, player_id: player.id }, { onConflict: "parent_id,player_id" });
      }
    }

    router.push(ROLE_ROUTES[data.role]);
  }

  if (confirmationSent) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <Logo />
          <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            Check your email to confirm your account.
          </p>
          <Link href="/auth/login" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col px-4 py-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground w-fit">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back
      </Link>
      <div className="flex flex-1 flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-3">
          <Logo />
          <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-medium text-primary hover:underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {/* Full name */}
          <div className="space-y-1.5">
            <label htmlFor="full_name" className="text-sm font-medium">Full name</label>
            <input
              id="full_name"
              type="text"
              autoComplete="name"
              placeholder="Sipho Dlamini"
              {...register("full_name")}
              className={INPUT_CLASS}
            />
            {errors.full_name && <p role="alert" className="text-xs text-destructive">{errors.full_name.message}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...register("email")}
              className={INPUT_CLASS}
            />
            {errors.email && <p role="alert" className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              {...register("password")}
              className={INPUT_CLASS}
            />
            {errors.password && <p role="alert" className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          {/* Role */}
          <div className="space-y-2">
            <p className="text-sm font-medium">I am a…</p>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map(({ value, label, description, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setValue("role", value, { shouldValidate: true })}
                  aria-pressed={selectedRole === value}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-colors",
                    selectedRole === value
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-primary/40"
                  )}
                >
                  <span className={cn(
                    "grid size-9 place-items-center rounded-lg",
                    selectedRole === value ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="font-semibold text-sm">{label}</span>
                  <span className="text-xs text-muted-foreground leading-tight">{description}</span>
                </button>
              ))}
            </div>
            {errors.role && <p role="alert" className="text-xs text-destructive">{errors.role.message}</p>}
          </div>

          {/* Player code — shown only for parents */}
          {selectedRole === "parent" && (
            <div className="space-y-1.5">
              <label htmlFor="share_token" className="text-sm font-medium">
                Child&apos;s player code <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <input
                id="share_token"
                type="text"
                autoComplete="off"
                placeholder="e.g. a3f9b2c1d4"
                {...register("share_token")}
                className={INPUT_CLASS}
              />
              <p className="text-xs text-muted-foreground">You can also add this later from your dashboard.</p>
            </div>
          )}

          {serverError && (
            <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account…" : "Create account"}
          </Button>
        </form>
      </div>
      </div>
    </div>
  );
}
