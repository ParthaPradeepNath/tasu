import { STATUS_META, STATUS_ORDER } from "@/lib/status";
import type { Role } from "@/lib/permissions";
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
        <section key={group.status} className={index > 0 ? "border-t border-line" : undefined}>
          <div className="sticky top-[52px] z-10 flex h-8 items-center gap-2 border-b border-separator bg-[color-mix(in_srgb,var(--bg)_90%,transparent)] px-4 backdrop-blur-md">
            <h2 className="eyebrow m-0">{STATUS_META[group.status].label}</h2>
            <span className="num text-[10.5px] text-label-3">
              {group.items.length}
            </span>
            <span className="ml-auto hidden text-[10.5px] text-label-3 sm:block">
              {STATUS_META[group.status].description}
            </span>
          </div>
          <TicketList
            items={group.items}
            role={role}
            showRequester={showRequester}
            compact={compact}
            className="divide-y divide-separator"
          />
        </section>
      ))}
    </div>
  );
}
