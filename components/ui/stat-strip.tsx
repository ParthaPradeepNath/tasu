import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/liquid-glass";

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
        columns === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-surface/55 px-4 py-4 sm:px-5 sm:py-[18px] dark:bg-black/10"
        >
          <p className="m-0 text-[10.5px] font-medium uppercase tracking-[0.055em] text-label-3">
            {stat.label}
          </p>
          <p
            className={cn(
              "num mt-1.5 text-[27px] font-semibold leading-none tracking-[-0.03em]",
              stat.tone === "warning" && "text-warning",
              stat.tone === "danger" && "text-danger",
              stat.tone === "success" && "text-success",
              stat.tone === "accent" && "text-accent",
            )}
          >
            {stat.value}
          </p>
          {stat.hint && (
            <p className="mt-1.5 text-[11px] leading-4 text-label-3">
              {stat.hint}
            </p>
          )}
        </div>
      ))}
    </GlassCard>
  );
}
