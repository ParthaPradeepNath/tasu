import { Skeleton } from "@/components/ui/skeleton";

export default function WorkspaceLoading() {
  return (
    <div aria-busy="true" aria-label="Loading page">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <Skeleton className="mb-2 h-2.5 w-24" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-2.5 h-3 w-[320px] max-w-full" />
        </div>
        <Skeleton className="h-8 w-28 rounded-[9px]" />
      </div>

      <div className="border-separator bg-separator grid grid-cols-2 gap-px overflow-hidden rounded-[14px] border lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-surface-solid px-5 py-[18px]">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="mt-2.5 h-7 w-14" />
            <Skeleton className="mt-2 h-2.5 w-24" />
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <div className="surface-card p-4">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="mt-4 h-[190px] w-full rounded-[10px]" />
        </div>
        <div className="surface-card p-4">
          <Skeleton className="h-3 w-28" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="size-5 rounded-full" />
                <Skeleton className="h-3 flex-1" />
                <Skeleton className="h-3 w-8" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
