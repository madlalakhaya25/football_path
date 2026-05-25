import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        aria-hidden="true"
        className="grid size-8 place-items-center rounded-lg bg-brand text-brand-foreground font-black"
      >
        ⚽
      </span>
      <span className="text-lg font-bold tracking-tight">
        GrowFit<span className="text-primary"> Path</span>
      </span>
    </span>
  );
}
