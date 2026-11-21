import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-[6px] bg-fill", className)}
      {...props}
    />
  );
}

export function SkeletonRows({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-1 py-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex h-11 items-center gap-3 px-4">
          <Skeleton className="size-4 rounded-full" />
          <Skeleton className="h-3 w-14" />
          <Skeleton
            className="h-3"
            style={{ width: `${26 + ((i * 13) % 34)}%` }}
          />
          <Skeleton className="ml-auto h-3 w-16" />
        </div>
      ))}
    </div>
  );
}
