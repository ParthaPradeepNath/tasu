import type { Priority } from "@/generated/prisma/enums";
import { PRIORITY_META } from "@/lib/status";
import { cn } from "@/lib/utils";

export function PriorityBars({
  priority,
  className,
  showLabel = false,
}: {
  priority: Priority;
  className?: string;
  showLabel?: boolean;
}) {
  const meta = PRIORITY_META[priority];
  const color =
    meta.tone === "danger"
      ? "bg-danger"
      : meta.tone === "warning"
        ? "bg-warning"
        : meta.tone === "accent"
          ? "bg-label-2"
          : "bg-label-3";

  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      title={`${meta.label} priority`}
    >
      <span className="flex h-[11px] items-end gap-[2px]" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              "w-[3px] rounded-[1px]",
              priority === "NONE"
                ? "border-label-3 border border-dashed bg-transparent"
                : i < meta.bars
                  ? color
                  : "bg-line"
            )}
            style={{ height: `${5 + i * 3}px` }}
          />
        ))}
      </span>
      {showLabel && (
        <span className="text-label-2 text-[12px]">{meta.label}</span>
      )}
      <span className="sr-only">{meta.label} priority</span>
    </span>
  );
}
