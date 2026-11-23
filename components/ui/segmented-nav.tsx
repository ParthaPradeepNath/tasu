"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { GlassLens } from "@/components/liquid-glass";
import { useWebHaptics } from "@/hooks/use-web-haptics";
import { cn } from "@/lib/utils";

type Segment = {
  label: string;
  href: string;
  count?: number;
  exact?: boolean;
};

const FILTER_KEYS = [
  "view",
  "status",
  "priority",
  "category",
  "assignee",
  "q",
  "range",
];

export function SegmentedNav({
  segments,
  className,
  ariaLabel = "Views",
}: {
  segments: Segment[];
  className?: string;
  ariaLabel?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { triggerHaptic } = useWebHaptics();

  function isActive(segment: Segment) {
    const [path, query] = segment.href.split("?");
    const target = new URLSearchParams(query ?? "");
    let active = pathname === path;
    if (active && target.size > 0) {
      active = Array.from(target.entries()).every(
        ([key, value]) => searchParams.get(key) === value
      );
    }
    if (active && target.size === 0) {
      active = !FILTER_KEYS.some((key) => searchParams.has(key));
    }
    return active;
  }

  const activeHref = segments.find(isActive)?.href ?? segments[0]?.href ?? "";

  return (
    <nav
      role="radiogroup"
      aria-label={ariaLabel}
      data-glass-host=""
      className={cn(
        "border-separator/80 bg-fill/70 relative isolate inline-flex h-8 max-w-full [scrollbar-width:none] items-center gap-0.5 overflow-x-auto rounded-[9px] border p-[3px] [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      <GlassLens value={activeHref} />
      {segments.map((segment) => {
        const active = isActive(segment);

        return (
          <Link
            key={segment.href}
            href={segment.href}
            onClick={() => triggerHaptic("light")}
            role="radio"
            aria-checked={active}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative inline-flex h-[26px] shrink-0 items-center justify-center rounded-[6px] px-2.5 text-[12px] font-medium transition-colors duration-100 outline-none select-none",
              active
                ? "text-label [[data-glass-traveling]_&]:text-label-3"
                : "text-label-2 hover:text-label"
            )}
          >
            {active && (
              <span
                aria-hidden
                data-glass-highlight=""
                className="bg-surface-solid absolute inset-0 rounded-[6px] shadow-[0_1px_2px_rgba(0,0,0,0.08)] [[data-glass-moving]_&]:opacity-0"
              />
            )}
            <span className="relative z-20 inline-flex items-center gap-1.5">
              {segment.label}
              {typeof segment.count === "number" && (
                <span className="num text-label-3 text-[10.5px]">
                  {segment.count}
                </span>
              )}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
