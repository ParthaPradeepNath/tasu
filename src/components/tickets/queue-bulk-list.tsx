"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Check,
  ChevronDown,
  CircleDot,
  Flag,
  Loader2,
  Minus,
  UserRoundPlus,
  X,
} from "lucide-react";
import type { Priority, TicketStatus } from "@/generated/prisma/enums";
import { bulkUpdateTickets } from "@/app/app/actions";
import type { Role } from "@/lib/permissions";
import type { TicketListItem } from "@/lib/tickets";
import {
  PRIORITY_META,
  PRIORITY_ORDER,
  STATUS_META,
  STATUS_ORDER,
} from "@/lib/status";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PriorityBars } from "./priority-bars";
import { StatusDot } from "./status-chip";
import { TicketRow } from "./ticket-row";

type BulkChange = {
  status?: TicketStatus;
  priority?: Priority;
  assigneeId?: string | null;
};

const STAFF_STATUS_LABEL: Record<TicketStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  WAITING_ON_USER: "Waiting on requester",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

function statusMessage(status: TicketStatus) {
  if (status === "RESOLVED") return "Marked resolved";
  if (status === "CLOSED") return "Tickets closed";
  return `Moved to ${STATUS_META[status].label.toLowerCase()}`;
}

export function QueueBulkList({
  items,
  role,
  viewerId,
}: {
  items: TicketListItem[];
  role: Role;
  viewerId: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [pending, startTransition] = React.useTransition();
  const rowRefs = React.useRef<Array<HTMLAnchorElement | null>>([]);
  const [cursor, setCursor] = React.useState(-1);

  const allSelected = items.length > 0 && selected.size === items.length;
  const someSelected = selected.size > 0 && !allSelected;

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(items.map((ticket) => ticket.id)));
  }

  function apply(payload: BulkChange, message: string) {
    if (selected.size === 0 || pending) return;
    const ids = Array.from(selected);

    startTransition(async () => {
      const result = await bulkUpdateTickets({ ids, ...payload });
      if (result.error) {
        toast.error(result.error);
        return;
      }

      setSelected(new Set());

      if ((result.updated ?? 0) === 0) {
        toast.info("No changes needed", {
          description: "Those tickets already match.",
        });
        return;
      }

      toast.success(message, {
        description: `${result.updated} ${
          result.updated === 1 ? "ticket" : "tickets"
        } updated.`,
      });
      router.refresh();
    });
  }

  function focusRow(index: number) {
    const bounded = Math.max(0, Math.min(items.length - 1, index));
    rowRefs.current[bounded]?.focus();
    setCursor(bounded);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const key = event.key.toLowerCase();

    if (key === "j" || event.key === "ArrowDown") {
      event.preventDefault();
      focusRow(cursor + 1);
    } else if (key === "k" || event.key === "ArrowUp") {
      event.preventDefault();
      focusRow(cursor - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusRow(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusRow(items.length - 1);
    } else if (key === "x" && cursor >= 0 && items[cursor]) {
      event.preventDefault();
      toggle(items[cursor].id);
    }
  }

  return (
    <>
      <div onKeyDown={onKeyDown}>
      <div className="flex h-9 items-center gap-2 border-b border-separator bg-surface-sunken/40 pl-3 pr-4">
        <SelectionCheckbox
          checked={allSelected}
          indeterminate={someSelected}
          onChange={toggleAll}
          label="Select all tickets"
        />
        <span className="text-[11px] font-medium text-label-2">Select all</span>
        {selected.size > 0 && (
          <span className="num text-[10.5px] text-label-3">
            {selected.size} of {items.length}
          </span>
        )}
        <span className="num ml-auto text-[10.5px] text-label-3">
          {items.length} {items.length === 1 ? "ticket" : "tickets"}
        </span>
      </div>

      <ul
        role="list"
        aria-label="Ticket queue. Use J and K to move, X to select, Enter to open."
        className="divide-y divide-separator"
      >
        {items.map((ticket, index) => {
          const checked = selected.has(ticket.id);
          return (
            <li key={ticket.id} className="group/row relative">
              <span
                className={cn(
                  "absolute inset-y-0 left-0 z-10 flex w-10 items-center justify-center transition-colors duration-150",
                  checked ? "bg-accent-soft" : "group-hover/row:bg-surface-hover",
                )}
              >
                <SelectionCheckbox
                  checked={checked}
                  onChange={() => toggle(ticket.id)}
                  label={`Select ${ticket.key}: ${ticket.title}`}
                />
              </span>
              <TicketRow
                ticket={ticket}
                role={role}
                showRequester
                selected={checked || cursor === index}
                rowRef={(element) => {
                  rowRefs.current[index] = element;
                }}
                onFocus={() => setCursor(index)}
                className="pl-10"
              />
            </li>
          );
        })}
      </ul>
      </div>

      {selected.size > 0 && (
        <div
          role="region"
          aria-label="Bulk ticket actions"
          className="motion-pop fixed inset-x-3 bottom-4 z-40 mx-auto flex max-w-[620px] items-center gap-1.5 rounded-[14px] border border-line bg-[color-mix(in_srgb,var(--surface-solid)_92%,transparent)] p-1.5 shadow-[var(--shadow-pop)] backdrop-blur-2xl sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2"
        >
          <span className="num inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-accent px-2 text-[11.5px] font-semibold text-white">
            {selected.size}
          </span>
          <span className="text-[11.5px] font-medium text-label-2">
            selected
          </span>
          {pending && (
            <Loader2 className="size-3.5 animate-spin text-label-3" aria-hidden />
          )}

          <span className="mx-1 hidden h-4 w-px bg-separator sm:block" />

          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() =>
              apply({ assigneeId: viewerId }, "Assigned to you")
            }
            aria-label="Assign selected tickets to me"
          >
            <UserRoundPlus />
            <span className="hidden sm:inline">Assign to me</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={pending}>
              <Button variant="ghost" size="sm" aria-label="Change priority">
                <Flag />
                <span className="hidden sm:inline">Priority</span>
                <ChevronDown className="size-3 text-label-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-[196px]">
              <DropdownMenuLabel>Set priority</DropdownMenuLabel>
              {PRIORITY_ORDER.map((priority) => (
                <DropdownMenuItem
                  key={priority}
                  onSelect={() =>
                    apply(
                      { priority },
                      `Priority set to ${PRIORITY_META[priority].label.toLowerCase()}`,
                    )
                  }
                >
                  <PriorityBars priority={priority} className="w-4" />
                  {PRIORITY_META[priority].label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={pending}>
              <Button variant="ghost" size="sm" aria-label="Change status">
                <CircleDot />
                <span className="hidden sm:inline">Status</span>
                <ChevronDown className="size-3 text-label-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-[224px]">
              <DropdownMenuLabel>Move selected to</DropdownMenuLabel>
              {STATUS_ORDER.map((status) => (
                <DropdownMenuItem
                  key={status}
                  onSelect={() => apply({ status }, statusMessage(status))}
                >
                  <StatusDot status={status} />
                  {STAFF_STATUS_LABEL[status]}
                  {status === "RESOLVED" && (
                    <span className="ml-auto text-[10px] text-label-3">confirm</span>
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() =>
                  apply({ status: "CLOSED" }, "Tickets closed")
                }
              >
                <StatusDot status="CLOSED" />
                Close tickets
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon-sm"
            disabled={pending}
            onClick={() => setSelected(new Set())}
            aria-label="Clear selection"
            className="ml-auto text-label-3 sm:ml-1"
          >
            <X />
          </Button>
        </div>
      )}
    </>
  );
}

function SelectionCheckbox({
  checked,
  indeterminate = false,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label className="relative inline-flex size-[15px] cursor-pointer items-center justify-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={label}
        className={cn(
          "focus-ring size-[15px] cursor-pointer appearance-none rounded-[4px] border transition-[background-color,border-color,box-shadow] duration-150",
          checked || indeterminate
            ? "border-accent bg-accent"
            : "border-line bg-surface-solid shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)] hover:border-label-3",
        )}
      />
      {indeterminate ? (
        <Minus
          className="pointer-events-none absolute size-2.5 text-white"
          strokeWidth={3.5}
        />
      ) : (
        <Check
          className={cn(
            "pointer-events-none absolute size-2.5 text-white transition-opacity duration-100",
            checked ? "opacity-100" : "opacity-0",
          )}
          strokeWidth={3.5}
        />
      )}
    </label>
  );
}
