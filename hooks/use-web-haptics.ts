"use client";

import { useCallback } from "react";

export type HapticType = "light" | "medium" | "success" | "error";

/** Short, battery-friendly patterns — all well under a second. */
const PATTERNS: Record<HapticType, number | number[]> = {
  light: 8,
  medium: 14,
  success: [10, 24, 10],
  error: [24, 32, 24],
};

/**
 * Progressive-enhancement haptics. No-ops on devices without the Vibration API
 * (most desktops), so callers can trigger haptics unconditionally.
 */
export function useWebHaptics() {
  const triggerHaptic = useCallback((type: HapticType = "medium") => {
    if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
    try {
      navigator.vibrate(PATTERNS[type]);
    } catch {
      // Haptics are optional — never let them break an interaction.
    }
  }, []);

  return { triggerHaptic };
}
