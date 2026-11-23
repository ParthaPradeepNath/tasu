import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-14 text-center",
        className
      )}
    >
      <span className="border-separator bg-surface-solid text-label-3 mb-4 inline-flex size-12 items-center justify-center rounded-[13px] border shadow-[var(--shadow-card)]">
        <Icon className="size-5" strokeWidth={1.6} />
      </span>
      <h3 className="text-label m-0 text-[14px] font-medium tracking-[-0.01em]">
        {title}
      </h3>
      {description && (
        <p className="text-label-2 mt-1 max-w-[320px] text-[12.5px] leading-5">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
