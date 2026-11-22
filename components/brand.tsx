import { cn } from "@/lib/utils";

export function Logo({
  size = 30,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const iconSize = size * 0.62;

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
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        focusable="false"
        aria-hidden
      >
        <path
          fill="currentColor"
          d="M10.71 14H8c-2.76 0-5 2.24-5 5 0 1.66 1.34 3 3 3h6.58C11.45 20.94 10 19.11 10 16.65c0-1 .27-1.9.71-2.65"
          opacity=".28"
        />
        <path
          fill="currentColor"
          d="M7 7c0-2.76 2.24-5 5-5s5 2.24 5 5-2.24 5-5 5-5-2.24-5-5"
        />
        <path
          fill="currentColor"
          d="M17 13.74c.51-.31 1.09-.43 1.61-.42 1.65.02 3.39 1.33 3.39 3.33 0 1.8-1.17 3.22-2.19 4.11-.53.46-1.08.83-1.52 1.08-.22.13-.43.23-.61.31-.09.04-.18.07-.27.1-.07.02-.23.07-.41.07s-.34-.05-.41-.07c-.09-.03-.18-.06-.27-.1-.18-.08-.39-.18-.61-.31-.44-.25-.99-.62-1.52-1.08-1.02-.89-2.19-2.31-2.19-4.11 0-1.99 1.73-3.33 3.4-3.33.51 0 1.08.11 1.6.42"
        />
      </svg>
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
