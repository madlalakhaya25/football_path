"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { loginSchema, type LoginInput } from "@/lib/validation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit({ phone }: LoginInput) {
    setServerError(null);
    const normalised = phone.startsWith("+27")
      ? phone
      : "+27" + phone.replace(/^0/, "");

    const { error } = await supabase.auth.signInWithOtp({ phone: normalised });
    if (error) {
      setServerError(error.message);
      return;
    }
    router.push(`/auth/verify?phone=${encodeURIComponent(normalised)}`);
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <Logo />
          <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
          <p className="text-center text-sm text-muted-foreground">
            Enter your South African mobile number to receive a one-time PIN.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="phone" className="text-sm font-medium">
              Phone number
            </label>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="071 234 5678"
              {...register("phone")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
            {errors.phone && (
              <p role="alert" className="text-xs text-destructive">
                {errors.phone.message}
              </p>
            )}
          </div>

          {serverError && (
            <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Sending…" : "Send OTP"}
          </Button>
        </form>
      </div>
    </div>
  );
}
