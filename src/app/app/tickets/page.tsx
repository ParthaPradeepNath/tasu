import Link from "next/link";
import { Inbox, Plus, SearchX, Ticket } from "lucide-react";
import type { Category, Priority, TicketStatus } from "@/generated/prisma/enums";
import { requireViewer } from "@/lib/session";
import { isStaff } from "@/lib/permissions";
import { getTicketCounts, listTickets, type TicketView } from "@/lib/tickets";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { SegmentedNav } from "@/components/ui/segmented-nav";
import { EmptyState } from "@/components/ui/empty-state";
import { TicketFilterBar } from "@/components/tickets/ticket-filters";
import { GroupedTicketList } from "@/components/tickets/grouped-ticket-list";
import { TicketList } from "@/components/tickets/ticket-list";

export const metadata = {
  title: "Tickets",
};

type Params = Record<string, string | string[] | undefined>;

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const STATUSES: TicketStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_ON_USER",
  "RESOLVED",
  "CLOSED",
];

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const viewer = await requireViewer();
  const staff = isStaff(viewer.role);

  const statusParam = single(params.status);
  const status = STATUSES.includes(statusParam as TicketStatus)
    ? (statusParam as TicketStatus)
    : undefined;
  const priority = single(params.priority) as Priority | undefined;
  const category = single(params.category) as Category | undefined;
  const assignee = single(params.assignee);
  const q = single(params.q)?.trim();
  const view = single(params.view) as TicketView | undefined;
  const viewValid = ["all", "unassigned", "mine", "breaching", "waiting"].includes(
    view ?? "",
  )
    ? view
    : undefined;

  const [{ items }, counts, assignees] = await Promise.all([
    listTickets(
      { id: viewer.id, role: viewer.role },
      {
        status: status ? [status] : undefined,
        priority,
        category,
        assignee,
        q,
        view: staff ? viewValid : viewValid === "mine" ? "mine" : undefined,
        limit: 60,
      },
    ),
    getTicketCounts({ id: viewer.id, role: viewer.role }),
    staff
      ? prisma.user.findMany({
          where: { role: { in: ["agent", "admin"] } },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const filtered = Boolean(status || priority || category || assignee || q || viewValid);
  const total = Object.values(counts.byStatus).reduce((sum, n) => sum + (n ?? 0), 0);

  const segments = staff
    ? [
        { label: "All", href: "/app/tickets", count: total },
        { label: "Mine", href: "/app/tickets?view=mine" },
        {
          label: "Unassigned",
          href: "/app/tickets?view=unassigned",
          count: counts.unassigned,
        },
        {
          label: "Breaching",
          href: "/app/tickets?view=breaching",
          count: counts.breaching,
        },
        {
          label: "Waiting",
          href: "/app/tickets?view=waiting",
          count: counts.byStatus.WAITING_ON_USER ?? 0,
        },
      ]
    : [
        { label: "All", href: "/app/tickets", count: total },
        {
          label: "Open",
          href: "/app/tickets?status=OPEN",
          count: counts.byStatus.OPEN ?? 0,
        },
        {
          label: "In progress",
          href: "/app/tickets?status=IN_PROGRESS",
          count: counts.byStatus.IN_PROGRESS ?? 0,
        },
        {
          label: "Waiting",
          href: "/app/tickets?status=WAITING_ON_USER",
          count: counts.byStatus.WAITING_ON_USER ?? 0,
        },
        {
          label: "Resolved",
          href: "/app/tickets?status=RESOLVED",
          count: counts.byStatus.RESOLVED ?? 0,
        },
      ];

  return (
    <div>
      <PageHeader
        eyebrow={staff ? "All requests" : "Your requests"}
        title={staff ? "Tickets" : "My tickets"}
        description={
          staff
            ? "Every request in the company, newest activity first."
            : "Everything you've asked IT for, from first reply to final fix."
        }
        actions={
          staff ? (
            <>
              <Button asChild variant="secondary" size="md">
                <Link href="/app/queue">Open queue</Link>
              </Button>
              <Button asChild variant="primary" size="md">
                <Link href="/app/tickets/new">
                  <Plus />
                  New ticket
                </Link>
              </Button>
            </>
          ) : (
            <Button asChild variant="primary" size="md">
              <Link href="/app/tickets/new">
                <Plus />
                New ticket
              </Link>
            </Button>
          )
        }
      />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <SegmentedNav segments={segments} ariaLabel="Ticket views" />
        <span className="num text-[11px] text-label-3">
          {items.length}
          {items.length === 60 ? "+" : ""} shown
        </span>
      </div>

      <div className="mb-4">
        <TicketFilterBar assignees={assignees} showAssignee={staff} />
      </div>

      <div className="surface-card overflow-clip">
        {items.length === 0 ? (
          q || filtered ? (
            <EmptyState
              icon={SearchX}
              title="No tickets match those filters"
              description="Try a different search, or clear the filters to see everything."
              action={
                <Button asChild variant="secondary" size="sm">
                  <Link href="/app/tickets">Clear filters</Link>
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={Inbox}
              title={staff ? "The queue is empty" : "No tickets yet"}
              description={
                staff
                  ? "When someone needs help, their request lands here."
                  : "Something broken? Create a ticket and IT will pick it up."
              }
              action={
                <Button asChild variant="primary" size="sm">
                  <Link href="/app/tickets/new">
                    <Plus />
                    New ticket
                  </Link>
                </Button>
              }
            />
          )
        ) : filtered ? (
          <TicketList
            items={items}
            role={viewer.role}
            showRequester={staff}
            className="divide-y divide-separator"
          />
        ) : (
          <GroupedTicketList
            items={items}
            role={viewer.role}
            showRequester={staff}
          />
        )}
      </div>

      {items.length > 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-label-3">
          <Ticket className="size-3" />
          Tip: press{" "}
          <kbd className="rounded border border-line bg-surface-solid px-1 font-mono text-[10px]">
            J
          </kbd>{" "}
          and{" "}
          <kbd className="rounded border border-line bg-surface-solid px-1 font-mono text-[10px]">
            K
          </kbd>{" "}
          to move, Enter to open.
        </p>
      )}
    </div>
  );
}
