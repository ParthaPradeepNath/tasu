"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export function MeterBar({
  value,
  fillClassName,
  trackClassName,
  className,
}: {
  /** 0–1. Values outside the range are clamped. */
  value: number;
  fillClassName?: string;
  trackClassName?: string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const scale = Math.min(1, Math.max(0, value));

  return (
    <span
      aria-hidden
      className={cn(
        "relative block w-full overflow-hidden rounded-full bg-surface-sunken",
        trackClassName,
        className,
      )}
    >
      <motion.span
        initial={false}
        animate={{ transform: `scaleX(${scale})` }}
        transition={
          reduced
            ? { duration: 0 }
            : { duration: 0.25, ease: [0.16, 1, 0.3, 1] }
        }
        className={cn(
          "block h-full w-full origin-left rounded-full bg-accent",
          fillClassName,
        )}
      />
    </span>
  );
}
