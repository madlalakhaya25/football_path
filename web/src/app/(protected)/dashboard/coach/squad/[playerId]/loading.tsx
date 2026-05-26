import { Skeleton } from "@/components/ui/skeleton";

export default function PlayerDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Back button */}
      <Skeleton className="h-8 w-20 rounded-lg" />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Passport card */}
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="h-1 bg-muted" />
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="size-16 rounded-full" />
              <Skeleton className="size-[72px] rounded-full" />
            </div>
            <div className="space-y-2 pt-1">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-5 w-6" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-16" />
              </div>
            </div>
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        </div>

        {/* Rating history */}
        <div className="space-y-3 lg:col-span-2">
          <Skeleton className="h-7 w-36" />
          <div className="rounded-xl border border-border divide-y divide-border">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-4 px-4 py-3">
                {/* Stars */}
                <div className="flex shrink-0 gap-0.5 pt-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Skeleton key={n} className="size-4 rounded-sm" />
                  ))}
                </div>
                {/* Text */}
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
