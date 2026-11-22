import type { TicketStatus } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";
import { GlassBadge } from "@/components/liquid-glass";
import {
  firstName,
  STATUS_META,
  TONE_CLASSES,
  type Tone,
} from "@/lib/status";

export function StatusChip({
  status,
  viewer = "agent",
  assigneeName,
  requesterName,
  className,
  premium = false,
}: {
  status: TicketStatus;
  viewer?: "requester" | "agent";
  assigneeName?: string | null;
  requesterName?: string | null;
  className?: string;
  premium?: boolean;
}) {
  const meta = STATUS_META[status];
  let label = meta.label;
  const tone: Tone = meta.tone;

  if (viewer === "requester") {
    if (status === "WAITING_ON_USER") label = "Waiting on you";
    if (status === "RESOLVED") label = "Confirm fix";
  } else {
    if (status === "OPEN") label = "Unassigned";
    if (status === "IN_PROGRESS" && assigneeName)
      label = `With ${firstName(assigneeName)}`;
    if (status === "WAITING_ON_USER")
      label = requesterName
        ? `Waiting on ${firstName(requesterName)}`
        : "Waiting on requester";
  }

  if (premium) {
    const glassTone =
      tone === "info" || tone === "purple" ? "accent" : tone;

    return (
      <GlassBadge
        tone={glassTone}
        width={Math.max(78, Math.round(label.length * 6.4 + 28))}
        height={22}
        speed={0.75}
        className={cn("text-[11.5px] font-medium", className)}
      >
        {label}
      </GlassBadge>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex h-[22px] max-w-full items-center gap-1.5 rounded-full px-2 text-[11.5px] font-medium leading-none",
        TONE_CLASSES[tone],
        className,
      )}
      title={meta.description}
    >
      <span className="size-[6px] shrink-0 rounded-full bg-current" />
      <span className="truncate">{label}</span>
    </span>
  );
}

export function StatusDot({
  status,
  className,
}: {
  status: TicketStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block size-[7px] shrink-0 rounded-full",
        STATUS_META[status].tone === "accent" && "bg-accent",
        STATUS_META[status].tone === "info" && "bg-info",
        STATUS_META[status].tone === "warning" && "bg-warning",
        STATUS_META[status].tone === "success" && "bg-success",
        STATUS_META[status].tone === "neutral" && "bg-label-3",
        className,
      )}
      aria-hidden
    />
  );
}
