import { GlassCard } from "@/components/liquid-glass";
import { cn } from "@/lib/utils";

type Stat = {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "accent" | "warning" | "danger" | "success";
  href?: string;
};

export function StatStrip({
  stats,
  columns = 4,
  className,
}: {
  stats: Stat[];
  columns?: 3 | 4;
  className?: string;
}) {
  return (
    <GlassCard
      tint={0.88}
      blur={12}
      className={cn(
        "grid gap-px overflow-hidden rounded-[18px]",
        columns === 3
          ? "grid-cols-1 sm:grid-cols-3"
          : "grid-cols-2 lg:grid-cols-4",
        className
      )}
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-surface/55 px-4 py-4 sm:px-5 sm:py-[18px] dark:bg-black/10"
        >
          <p className="text-label-3 m-0 text-[10.5px] font-medium tracking-[0.055em] uppercase">
            {stat.label}
          </p>
          <p
            className={cn(
              "num mt-1.5 text-[27px] leading-none font-semibold tracking-[-0.03em]",
              stat.tone === "warning" && "text-warning",
              stat.tone === "danger" && "text-danger",
              stat.tone === "success" && "text-success",
              stat.tone === "accent" && "text-accent"
            )}
          >
            {stat.value}
          </p>
          {stat.hint && (
            <p className="text-label-3 mt-1.5 text-[11px] leading-4">
              {stat.hint}
            </p>
          )}
        </div>
      ))}
    </GlassCard>
  );
}
