import Link from "next/link";
import { WifiOff } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ReloadButton } from "./reload-button";

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo />
      <div className="grid size-20 place-items-center rounded-full bg-muted">
        <WifiOff className="size-9 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">You&apos;re offline</h1>
        <p className="max-w-sm text-muted-foreground">
          No internet connection. Pages you&apos;ve visited recently are still
          available — check your connection and try again.
        </p>
      </div>
      <ReloadButton />
      <Button asChild variant="ghost">
        <Link href="/">Go home</Link>
      </Button>
    </div>
  );
}
