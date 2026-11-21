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
    <section
      className={cn(
        "surface-card min-w-0 overflow-hidden [--radius:14px]",
        className,
      )}
    >
      {title && (
        <header className="flex h-11 items-center justify-between gap-3 border-b border-separator px-4">
          <h2 className="m-0 text-[12.5px] font-semibold tracking-[-0.01em] text-label">
            {title}
          </h2>
          {action}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
