import { cn } from "@/lib/utils";

export function TicketSection({
  label,
  count,
  children,
  className,
}: {
  label: string;
  count: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("min-w-0", className)}>
      <div className="sticky top-[52px] z-10 flex h-8 items-center justify-between border-b border-separator bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] px-4 backdrop-blur-md">
        <h2 className="eyebrow m-0">{label}</h2>
        <span className="num text-[11px] text-label-3">{count}</span>
      </div>
      <div className="divide-y divide-separator">{children}</div>
    </section>
  );
}
