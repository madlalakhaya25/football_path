"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { loginSchema, type LoginInput } from "@/lib/validation";
import { createClient } from "@/lib/supabase/client";

const INPUT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const ROLE_ROUTES: Record<string, string> = {
  admin: "/dashboard/admin",
  coach: "/dashboard/coach",
  player: "/dashboard/player",
  parent: "/dashboard/parent",
};

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit({ email, password }: LoginInput) {
    setServerError(null);
    const supabase = createClient();
    if (!supabase) { setServerError("Auth service unavailable — check Supabase env vars."); return; }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setServerError(error.message);
      return;
    }

    const user = data.user;
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, role, academy_id, full_name")
      .eq("id", user.id)
      .single();

    if (!profileData?.role) {
      const metaRole = user.user_metadata?.role as string | undefined;
      router.push(metaRole === "admin" ? "/register-club" : "/auth/role");
      return;
    }

    router.push(ROLE_ROUTES[profileData.role] ?? "/dashboard/player");
  }

  return (
    <div className="flex min-h-dvh flex-col px-4 py-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground w-fit">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back
      </Link>
      <div className="flex flex-1 flex-col items-center justify-center">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <Logo />
          <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
          <p className="text-center text-sm text-muted-foreground">
            Enter your email and password to sign in.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...register("email")}
              className={INPUT_CLASS}
            />
            {errors.email && (
              <p role="alert" className="text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              {...register("password")}
              className={INPUT_CLASS}
            />
            {errors.password && (
              <p role="alert" className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
            <div className="text-right">
              <Link
                href="/auth/forgot-password"
                className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          {serverError && (
            <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="font-medium text-primary underline-offset-4 hover:underline">
            Create one
          </Link>
        </p>
      </div>
      </div>
    </div>
  );
}
