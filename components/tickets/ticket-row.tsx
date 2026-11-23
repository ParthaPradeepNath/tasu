import Link from "next/link";

import { ChevronRight } from "lucide-react";

import { CategoryIcon } from "@/components/tickets/category-icon";
import { PriorityBars } from "@/components/tickets/priority-bars";
import { StatusDot } from "@/components/tickets/status-chip";
import { Avatar } from "@/components/ui/avatar";
import { compactRelative, relativeTime } from "@/lib/dates";
import type { Role } from "@/lib/permissions";
import type { TicketListItem } from "@/lib/tickets";
import { cn } from "@/lib/utils";

export function TicketRow({
  ticket,
  role,
  showRequester = false,
  compact = false,
  selected = false,
  className,
  rowRef,
  onFocus,
  onMouseEnter,
}: {
  ticket: TicketListItem;
  role: Role;
  showRequester?: boolean;
  compact?: boolean;
  selected?: boolean;
  className?: string;
  rowRef?: (element: HTMLAnchorElement | null) => void;
  onFocus?: () => void;
  onMouseEnter?: () => void;
}) {
  const isStaff = role !== "employee";
  const person = showRequester || !isStaff ? ticket.requester : ticket.assignee;

  return (
    <Link
      href={`/app/tickets/${ticket.key}`}
      ref={rowRef}
      onFocus={onFocus}
      onMouseEnter={onMouseEnter}
      data-ticket-row
      className={cn(
        "group lift-hover relative flex items-center gap-3 px-4 outline-none",
        compact ? "h-[37px] gap-2.5 px-3.5" : "h-[46px] sm:gap-3.5",
        selected
          ? "bg-accent-soft shadow-[inset_0_0_0_1px_rgba(0,113,227,0.12)]"
          : "hover:bg-surface-hover",
        className
      )}
    >
      {selected && (
        <span
          aria-hidden
          className="indicator-in bg-accent absolute inset-y-2 left-0 w-[2px] rounded-r-full"
        />
      )}

      <StatusDot status={ticket.status} />

      <span
        className={cn(
          "num text-label-3 hidden shrink-0 font-mono whitespace-nowrap sm:block",
          compact ? "w-[68px] text-[10.5px]" : "w-[76px] text-[11px]"
        )}
      >
        {ticket.key}
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "text-label block truncate leading-4 font-medium",
            compact ? "text-[12px]" : "text-[12.8px]"
          )}
        >
          {ticket.title}
        </span>
        {!compact && (
          <span className="text-label-3 mt-0.5 flex items-center gap-1.5 text-[10.5px] leading-3 sm:hidden">
            <span className="num font-mono">{ticket.key}</span>
            <span aria-hidden>·</span>
            <span>{ticket.replyCount} replies</span>
          </span>
        )}
      </span>

      {!compact && (
        <CategoryIcon
          category={ticket.category}
          className="hidden size-3.5 md:block"
        />
      )}
      <PriorityBars
        priority={ticket.priority}
        className="hidden shrink-0 sm:inline-flex"
      />

      {!compact && (
        <span className="hidden w-[120px] justify-end lg:flex">
          <StatusMini status={ticket.status} role={role} />
        </span>
      )}

      {person ? (
        <Avatar
          name={person.name}
          color={person.avatarColor}
          size={compact ? 19 : 21}
          className="hidden shrink-0 sm:inline-flex"
        />
      ) : (
        <span
          className={cn(
            "border-line hidden shrink-0 rounded-full border border-dashed sm:inline-block",
            compact ? "size-[19px]" : "size-[21px]"
          )}
        />
      )}

      <time
        dateTime={ticket.lastActivityAt.toISOString()}
        suppressHydrationWarning
        className={cn(
          "num text-label-3 shrink-0 text-right whitespace-nowrap",
          compact ? "w-[34px] text-[10.5px]" : "w-[68px] text-[11px]"
        )}
      >
        {compact
          ? compactRelative(ticket.lastActivityAt)
          : relativeTime(ticket.lastActivityAt)}
      </time>

      <ChevronRight
        aria-hidden
        className="text-label-3 ease-amicro size-3.5 shrink-0 opacity-0 transition-[opacity,transform] duration-150 group-hover:translate-x-[3px] group-hover:opacity-100 group-focus-visible:opacity-100"
      />
    </Link>
  );
}

function StatusMini({
  status,
  role,
}: {
  status: TicketListItem["status"];
  role: Role;
}) {
  const label =
    status === "OPEN"
      ? "Open"
      : status === "IN_PROGRESS"
        ? "In progress"
        : status === "WAITING_ON_USER"
          ? role === "employee"
            ? "Waiting on you"
            : "Waiting"
          : status === "RESOLVED"
            ? "Resolved"
            : "Closed";

  return (
    <span className="text-label-2 inline-flex items-center gap-1.5 text-[11px] whitespace-nowrap">
      <span className="truncate">{label}</span>
    </span>
  );
}
