import { cn } from "@/lib/utils";

export function Kbd({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <kbd
      className={cn(
        "border-line bg-surface-solid/60 text-label-3 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[4px] border px-1 font-mono text-[10.5px] leading-none font-medium shadow-[0_1px_0_rgba(0,0,0,0.04)]",
        className
      )}
    >
      {children}
    </kbd>
  );
}
