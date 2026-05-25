"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useTransition } from "react";

export function AdminPlayerSearch({ initialQ }: { initialQ: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, start] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    const next = new URLSearchParams(params.toString());
    if (q) next.set("q", q); else next.delete("q");
    start(() => router.replace(`${pathname}?${next.toString()}`));
  }

  return (
    <div className="relative max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
      <input
        type="search"
        placeholder="Search players…"
        defaultValue={initialQ}
        onChange={handleChange}
        className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}
