import { Skeleton } from "@/components/ui/skeleton";

export default function FixturesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <div className="rounded-xl border border-border divide-y divide-border">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-3 w-32" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-6 w-14 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
