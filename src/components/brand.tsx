import { LifeBuoy } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  size = 30,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[9px] text-white shadow-[0_1px_2px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.24)]",
        className,
      )}
      style={{
        width: size,
        height: size,
        background:
          "linear-gradient(160deg, #3f9bff 0%, #0071e3 46%, #0055b3 100%)",
      }}
      aria-hidden
    >
      <LifeBuoy
        style={{ width: size * 0.56, height: size * 0.56 }}
        strokeWidth={2}
      />
      <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/16 to-transparent" />
    </span>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "text-[15px] font-semibold tracking-[-0.02em] text-label",
        className,
      )}
    >
      Tasu
    </span>
  );
}
