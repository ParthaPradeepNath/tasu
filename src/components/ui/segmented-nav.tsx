"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type Segment = {
  label: string;
  href: string;
  count?: number;
  exact?: boolean;
};

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

  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        "inline-flex h-8 max-w-full items-center gap-0.5 overflow-x-auto rounded-[9px] border border-separator bg-fill p-[3px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {segments.map((segment) => {
        const [path, query] = segment.href.split("?");
        const target = new URLSearchParams(query ?? "");
        let active = pathname === path;
        if (active && target.size > 0) {
          active = Array.from(target.entries()).every(
            ([key, value]) => searchParams.get(key) === value,
          );
        }
        if (active && target.size === 0) {
          active = ![
            "view",
            "status",
            "priority",
            "category",
            "assignee",
            "q",
            "range",
          ].some((key) => searchParams.has(key));
        }

        return (
          <Link
            key={segment.href}
            href={segment.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex h-[26px] shrink-0 items-center gap-1.5 rounded-[6px] px-2.5 text-[12px] font-medium transition-[background-color,color,box-shadow] duration-150",
              active
                ? "bg-surface-solid text-label shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                : "text-label-2 hover:text-label",
            )}
          >
            {segment.label}
            {typeof segment.count === "number" && (
              <span
                className={cn(
                  "num text-[10.5px]",
                  active ? "text-label-3" : "text-label-3",
                )}
              >
                {segment.count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
