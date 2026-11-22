import Link from "next/link";
import type { Role } from "@/lib/permissions";
import { compactRelative, relativeTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { StatusDot } from "@/components/tickets/status-chip";
import { PriorityBars } from "@/components/tickets/priority-bars";
import { CategoryIcon } from "@/components/tickets/category-icon";
import { Avatar } from "@/components/ui/avatar";
import type { TicketListItem } from "@/lib/tickets";

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
        "group relative flex items-center gap-3 px-4 outline-none transition-colors duration-100",
        compact ? "h-[37px] gap-2.5 px-3.5" : "h-[46px] sm:gap-3.5",
        selected
          ? "bg-accent-soft shadow-[inset_0_0_0_1px_rgba(0,113,227,0.12)]"
          : "hover:bg-surface-hover",
        className,
      )}
    >
      {selected && (
        <span
          aria-hidden
          className="absolute inset-y-2 left-0 w-[2px] rounded-r-full bg-accent"
        />
      )}

      <StatusDot status={ticket.status} />

      <span
        className={cn(
          "num hidden shrink-0 whitespace-nowrap font-mono text-label-3 sm:block",
          compact ? "w-[68px] text-[10.5px]" : "w-[76px] text-[11px]",
        )}
      >
        {ticket.key}
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate font-medium leading-4 text-label",
            compact ? "text-[12px]" : "text-[12.8px]",
          )}
        >
          {ticket.title}
        </span>
        {!compact && (
          <span className="mt-0.5 flex items-center gap-1.5 text-[10.5px] leading-3 text-label-3 sm:hidden">
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
            "hidden shrink-0 rounded-full border border-dashed border-line sm:inline-block",
            compact ? "size-[19px]" : "size-[21px]",
          )}
        />
      )}

      <time
        dateTime={ticket.lastActivityAt.toISOString()}
        suppressHydrationWarning
        className={cn(
          "num shrink-0 whitespace-nowrap text-right text-label-3",
          compact ? "w-[34px] text-[10.5px]" : "w-[68px] text-[11px]",
        )}
      >
        {compact
          ? compactRelative(ticket.lastActivityAt)
          : relativeTime(ticket.lastActivityAt)}
      </time>
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
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] text-label-2">
      <span className="truncate">{label}</span>
    </span>
  );
}
