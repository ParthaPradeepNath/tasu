import { GlassCard } from "@/components/liquid-glass";
import { cn } from "@/lib/utils";

export function SectionCard({
  title,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <GlassCard
      role="region"
      aria-label={typeof title === "string" ? title : undefined}
      tint={0.86}
      blur={10}
      className={cn(
        "min-w-0 overflow-clip rounded-[16px] [--radius:14px]",
        className
      )}
    >
      {title && (
        <header className="border-separator flex min-h-11 items-center justify-between gap-3 border-b px-4">
          <h2 className="text-label m-0 min-w-0 truncate text-[12.5px] font-semibold tracking-[-0.01em]">
            {title}
          </h2>
          {action && <span className="shrink-0">{action}</span>}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </GlassCard>
  );
}
