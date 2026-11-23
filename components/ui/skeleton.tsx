import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("bg-fill animate-pulse rounded-[6px]", className)}
      {...props}
    />
  );
}
