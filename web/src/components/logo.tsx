import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image src="/growfit.png" alt="Growfit FA" width={32} height={32} className="rounded-sm" unoptimized />
      <span className="text-lg font-bold tracking-tight">
        Growfit<span className="text-primary"> FA</span>
      </span>
    </span>
  );
}
