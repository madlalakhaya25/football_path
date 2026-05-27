import { redirect } from "next/navigation";
import Link from "next/link";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { joinByInviteCode } from "@/app/actions/squad";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?next=/join/${code}`);
  }

  // Attempt to join
  const result = await joinByInviteCode(code);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 w-full max-w-lg items-center px-4">
          <Logo />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-5 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-brand/15">
            <Users className="size-7 text-primary" aria-hidden="true" />
          </span>

          {result.error ? (
            <>
              <div>
                <h1 className="text-xl font-bold">Couldn&apos;t join</h1>
                <p className="mt-2 text-sm text-muted-foreground">{result.error}</p>
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/player">Go to dashboard</Link>
              </Button>
            </>
          ) : (
            <>
              <div>
                <h1 className="text-xl font-bold">You&apos;re in!</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  You have joined <span className="font-semibold text-foreground">{result.teamName}</span>. Welcome to the squad.
                </p>
              </div>
              <Button asChild className="w-full">
                <Link href="/dashboard/player">Go to my dashboard</Link>
              </Button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
