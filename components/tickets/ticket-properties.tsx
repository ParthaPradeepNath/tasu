"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Category, Priority, TicketStatus } from "@/generated/prisma/enums";
import { updateTicket } from "@/app/app/actions";
import { useWebHaptics } from "@/hooks/use-web-haptics";
import {
  CATEGORY_META,
  CATEGORY_ORDER,
  PRIORITY_META,
  PRIORITY_ORDER,
  STATUS_META,
  STATUS_ORDER,
} from "@/lib/status";
import { PropertySelect, type SelectOption } from "@/components/ui/property-select";
import { StatusChip } from "@/components/tickets/status-chip";
import { PriorityBars } from "@/components/tickets/priority-bars";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: SelectOption[] = STATUS_ORDER.map((status) => ({
  value: status,
  label: STATUS_META[status].label,
}));
const PRIORITY_OPTIONS: SelectOption[] = PRIORITY_ORDER.map((priority) => ({
  value: priority,
  label: PRIORITY_META[priority].label,
}));
const CATEGORY_OPTIONS: SelectOption[] = CATEGORY_ORDER.map((category) => ({
  value: category,
  label: CATEGORY_META[category].label,
}));

export function TicketProperties({
  ticket,
  agents,
  staff,
  requester,
}: {
  ticket: {
    id: string;
    status: TicketStatus;
    priority: Priority;
    category: Category;
    assigneeId: string | null;
    tags: string[];
  };
  agents: { id: string; name: string; avatarColor: string | null }[];
  staff: boolean;
  requester: { name: string; email: string; avatarColor: string | null };
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const { triggerHaptic } = useWebHaptics();
  const assignee = agents.find((agent) => agent.id === ticket.assigneeId);

  function change(payload: Record<string, string>, message: string) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("ticketId", ticket.id);
      for (const [key, value] of Object.entries(payload)) {
        formData.set(key, value);
      }
      const result = await updateTicket({ error: null }, formData);
      if (result.error) {
        triggerHaptic("error");
        toast.error(result.error);
        return;
      }
      triggerHaptic("success");
      toast.success(message);
      router.refresh();
    });
  }

  const assigneeOptions: SelectOption[] = [
    { value: "unassigned", label: "Unassigned" },
    ...agents.map((agent) => ({ value: agent.id, label: agent.name })),
  ];

  return (
    <div
      className={cn(
        "surface-card overflow-clip transition-opacity duration-100",
        pending && "opacity-70",
      )}
    >
      <header className="flex h-10 items-center justify-between border-b border-separator px-3.5">
        <h2 className="m-0 text-[12px] font-semibold text-label">Properties</h2>
        {pending && (
          <span className="text-[10.5px] text-label-3">Saving…</span>
        )}
      </header>

      <div className="space-y-0.5 p-2">
        <div className="flex h-8 items-center gap-2 px-1.5">
          <span className="w-[74px] shrink-0 text-[12.5px] text-label-3">Status</span>
          {staff ? (
            <PropertySelect
              label="Status"
              value={ticket.status}
              options={STATUS_OPTIONS}
              onChange={(value) =>
                change({ status: value }, `Status set to ${STATUS_META[value as TicketStatus].label.toLowerCase()}.`)
              }
              className="[&>span:first-child]:hidden"
            />
          ) : (
            <StatusChip status={ticket.status} viewer="requester" />
          )}
        </div>

        <div className="flex h-8 items-center gap-2 px-1.5">
          <span className="w-[74px] shrink-0 text-[12.5px] text-label-3">
            Assignee
          </span>
          {staff ? (
            <PropertySelect
              label="Assignee"
              value={ticket.assigneeId ?? "unassigned"}
              options={assigneeOptions}
              onChange={(value) =>
                change(
                  { assigneeId: value === "unassigned" ? "" : value },
                  value === "unassigned"
                    ? "Assignee removed."
                    : `Assigned to ${agents.find((agent) => agent.id === value)?.name ?? "agent"}.`,
                )
              }
              emptyLabel="Unassigned"
              className="[&>span:first-child]:hidden"
            />
          ) : assignee ? (
            <span className="flex min-w-0 items-center gap-1.5 text-[12.5px] text-label">
              <Avatar name={assignee.name} color={assignee.avatarColor} size={18} />
              <span className="truncate">{assignee.name}</span>
            </span>
          ) : (
            <span className="text-[12.5px] text-label-2">IT triage</span>
          )}
        </div>

        <div className="flex h-8 items-center gap-2 px-1.5">
          <span className="w-[74px] shrink-0 text-[12.5px] text-label-3">
            Priority
          </span>
          {staff ? (
            <PropertySelect
              label="Priority"
              value={ticket.priority}
              options={PRIORITY_OPTIONS}
              onChange={(value) =>
                change({ priority: value }, `Priority set to ${PRIORITY_META[value as Priority].label.toLowerCase()}.`)
              }
              className="[&>span:first-child]:hidden"
            />
          ) : (
            <span className="flex items-center gap-2 text-[12.5px] text-label">
              <PriorityBars priority={ticket.priority} />
              {PRIORITY_META[ticket.priority].label}
            </span>
          )}
        </div>

        <div className="flex h-8 items-center gap-2 px-1.5">
          <span className="w-[74px] shrink-0 text-[12.5px] text-label-3">
            Category
          </span>
          {staff ? (
            <PropertySelect
              label="Category"
              value={ticket.category}
              options={CATEGORY_OPTIONS}
              onChange={(value) =>
                change({ category: value }, `Category set to ${CATEGORY_META[value as Category].label.toLowerCase()}.`)
              }
              className="[&>span:first-child]:hidden"
            />
          ) : (
            <span className="text-[12.5px] text-label">
              {CATEGORY_META[ticket.category].label}
            </span>
          )}
        </div>

        {ticket.tags.length > 0 && (
          <div className="flex items-start gap-2 px-1.5 py-1.5">
            <span className="mt-0.5 w-[74px] shrink-0 text-[12.5px] text-label-3">
              Tags
            </span>
            <span className="flex flex-wrap gap-1">
              {ticket.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex h-5 items-center rounded-[4px] bg-fill px-1.5 text-[10.5px] font-medium text-label-2"
                >
                  <span className="max-w-[140px] truncate">{tag}</span>
                </span>
              ))}
            </span>
          </div>
        )}

        <div className="my-1 h-px bg-separator" />

        <div className="flex items-center gap-2 px-1.5 py-1">
          <span className="w-[74px] shrink-0 text-[12.5px] text-label-3">
            Requester
          </span>
          <span className="flex min-w-0 items-center gap-1.5">
            <Avatar
              name={requester.name}
              color={requester.avatarColor}
              size={18}
            />
            <span className="truncate text-[12.5px] text-label">
              {requester.name}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
