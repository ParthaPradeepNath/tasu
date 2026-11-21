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
    <div
      className={cn(
        "grid gap-px overflow-hidden rounded-[14px] border border-separator bg-separator shadow-[var(--shadow-card)]",
        columns === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-surface-solid px-4 py-4 sm:px-5 sm:py-[18px]"
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
    </div>
  );
}
