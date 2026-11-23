import { AppWindow, CircleHelp, KeyRound, Laptop, Wifi } from "lucide-react";

import type { Category } from "@/generated/prisma/enums";
import { CATEGORY_META } from "@/lib/status";

export function CategoryIcon({
  category,
  className = "size-3.5",
}: {
  category: Category;
  className?: string;
}) {
  const Icon =
    category === "HARDWARE"
      ? Laptop
      : category === "SOFTWARE"
        ? AppWindow
        : category === "NETWORK"
          ? Wifi
          : category === "ACCESS"
            ? KeyRound
            : CircleHelp;

  return (
    <span
      className="text-label-3 inline-flex items-center justify-center"
      title={CATEGORY_META[category].label}
    >
      <Icon className={className} strokeWidth={1.7} />
      <span className="sr-only">{CATEGORY_META[category].label}</span>
    </span>
  );
}
