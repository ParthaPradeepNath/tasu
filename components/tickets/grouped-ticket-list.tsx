import type { Role } from "@/lib/permissions";
import { STATUS_META, STATUS_ORDER } from "@/lib/status";
import type { TicketListItem } from "@/lib/tickets";

import { TicketList } from "./ticket-list";

export function GroupedTicketList({
  items,
  role,
  showRequester = false,
  compact = false,
}: {
  items: TicketListItem[];
  role: Role;
  showRequester?: boolean;
  compact?: boolean;
}) {
  const groups = STATUS_ORDER.map((status) => ({
    status,
    items: items.filter((ticket) => ticket.status === status),
  })).filter((group) => group.items.length > 0);

  return (
    <div>
      {groups.map((group, index) => (
        <section
          key={group.status}
          className={index > 0 ? "border-line border-t" : undefined}
        >
          <div className="border-separator sticky top-[var(--topbar-h)] z-10 flex h-8 items-center gap-2 border-b bg-[color-mix(in_srgb,var(--bg)_90%,transparent)] px-4 backdrop-blur-md">
            <h2 className="eyebrow m-0">{STATUS_META[group.status].label}</h2>
            <span className="num text-label-3 text-[10.5px]">
              {group.items.length}
            </span>
            <span className="text-label-3 ml-auto hidden text-[10.5px] sm:block">
              {STATUS_META[group.status].description}
            </span>
          </div>
          <TicketList
            items={group.items}
            role={role}
            showRequester={showRequester}
            compact={compact}
            className="divide-separator divide-y"
          />
        </section>
      ))}
    </div>
  );
}
