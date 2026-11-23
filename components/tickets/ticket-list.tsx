"use client";

import * as React from "react";
import type { Role } from "@/lib/permissions";
import type { TicketListItem } from "@/lib/tickets";
import { cn } from "@/lib/utils";
import { TicketRow } from "./ticket-row";

export function TicketList({
  items,
  role,
  showRequester = false,
  compact = false,
  className,
}: {
  items: TicketListItem[];
  role: Role;
  showRequester?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const rowRefs = React.useRef<Array<HTMLAnchorElement | null>>([]);
  const [selected, setSelected] = React.useState(-1);

  function focusRow(index: number) {
    const bounded = Math.max(0, Math.min(items.length - 1, index));
    rowRefs.current[bounded]?.focus();
    setSelected(bounded);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const key = event.key.toLowerCase();

    if (key === "j" || event.key === "ArrowDown") {
      event.preventDefault();
      focusRow(selected + 1);
    } else if (key === "k" || event.key === "ArrowUp") {
      event.preventDefault();
      focusRow(selected - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusRow(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusRow(items.length - 1);
    }
  }

  return (
    <div
      role="list"
      aria-label="Tickets. Use J and K to move, Enter to open."
      onKeyDown={onKeyDown}
      className={cn("list-enter", className)}
    >
      {items.map((ticket, index) => (
        <TicketRow
          key={ticket.id}
          ticket={ticket}
          role={role}
          showRequester={showRequester}
          compact={compact}
          selected={selected === index}
          rowRef={(element) => {
            rowRefs.current[index] = element;
          }}
          onFocus={() => setSelected(index)}
          onMouseEnter={() => setSelected(index)}
        />
      ))}
    </div>
  );
}
