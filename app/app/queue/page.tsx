import Link from "next/link";
import { CheckCircle2, Inbox, Plus, SearchX } from "lucide-react";
import type { Category, Priority, TicketStatus } from "@/generated/prisma/enums";
import { requireStaff } from "@/lib/session";
import { getTicketCounts, listTickets, type TicketView } from "@/lib/tickets";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { SegmentedNav } from "@/components/ui/segmented-nav";
import { EmptyState } from "@/components/ui/empty-state";
import { TicketFilterBar } from "@/components/tickets/ticket-filters";
import { QueueBulkList } from "@/components/tickets/queue-bulk-list";

export const metadata = {
  title: "Queue",
};

type Params = Record<string, string | string[] | undefined>;
const single = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const VIEWS: TicketView[] = ["all", "unassigned", "mine", "breaching", "waiting"];

const EMPTY_COPY: Record<
  string,
  { title: string; description: string; icon: typeof Inbox }
> = {
  unassigned: {
    title: "Every ticket has an owner",
    description: "Nothing is waiting for triage. New requests will appear here.",
    icon: CheckCircle2,
  },
  mine: {
    title: "Your plate is clear",
    description: "No active tickets are assigned to you right now.",
    icon: CheckCircle2,
  },
  breaching: {
    title: "No SLA breaches",
    description: "Every active ticket is inside its response and resolve targets.",
    icon: CheckCircle2,
  },
  waiting: {
    title: "No one is blocked on a requester",
    description: "When you need more information, the ticket waits here.",
    icon: Inbox,
  },
  all: {
    title: "The queue is empty",
    description: "When someone needs help, their request lands here.",
    icon: Inbox,
  },
};

const STATUSES: TicketStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_ON_USER",
  "RESOLVED",
  "CLOSED",
];

export default async function QueuePage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const viewer = await requireStaff();

  const viewParam = single(params.view);
  const view = VIEWS.includes(viewParam as TicketView)
    ? (viewParam as TicketView)
    : "all";
  const statusParam = single(params.status);
  const status = STATUSES.includes(statusParam as TicketStatus)
    ? (statusParam as TicketStatus)
    : undefined;
  const priority = single(params.priority) as Priority | undefined;
  const category = single(params.category) as Category | undefined;
  const assignee = single(params.assignee);
  const q = single(params.q)?.trim();

  const [{ items }, counts, assignees] = await Promise.all([
    listTickets(
      { id: viewer.id, role: viewer.role },
      {
        view,
        status: status ? [status] : undefined,
        priority,
        category,
        assignee,
        q,
        limit: 80,
      },
    ),
    getTicketCounts({ id: viewer.id, role: viewer.role }),
    prisma.user.findMany({
      where: { role: { in: ["agent", "admin"] } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const filtered = Boolean(status || priority || category || assignee || q);
  // Remount the list when the filters change so stale selections never carry
  // over to a different result set.
  const listKey = [view, status, priority, category, assignee, q]
    .filter(Boolean)
    .join("|");
  const copy = EMPTY_COPY[view] ?? EMPTY_COPY.all;
  const totalActive =
    (counts.byStatus.OPEN ?? 0) +
    (counts.byStatus.IN_PROGRESS ?? 0) +
    (counts.byStatus.WAITING_ON_USER ?? 0);

  const segments = [
    { label: "All", href: "/app/queue", count: totalActive },
    {
      label: "Unassigned",
      href: "/app/queue?view=unassigned",
      count: counts.unassigned,
    },
    { label: "Mine", href: "/app/queue?view=mine" },
    {
      label: "Breaching",
      href: "/app/queue?view=breaching",
      count: counts.breaching,
    },
    {
      label: "Waiting on user",
      href: "/app/queue?view=waiting",
      count: counts.byStatus.WAITING_ON_USER ?? 0,
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="IT workspace"
        title="Queue"
        description={`${counts.unassigned} unassigned · ${counts.breaching} breaching · ${totalActive} active in total.`}
        actions={
          <Button asChild variant="primary" size="md">
            <Link href="/app/tickets/new">
              <Plus />
              New ticket
            </Link>
          </Button>
        }
      />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <SegmentedNav segments={segments} ariaLabel="Queue views" />
        <span className="num text-[11px] text-label-3">
          {items.length}
          {items.length === 80 ? "+" : ""} shown
        </span>
      </div>

      <div className="mb-4">
        <TicketFilterBar
          assignees={assignees}
          showAssignee
          placeholder="Search the queue…"
        />
      </div>

      <div className="surface-card overflow-clip">
        {items.length === 0 ? (
          filtered ? (
            <EmptyState
              icon={SearchX}
              title="No tickets match those filters"
              description="Try a different search, or clear the filters to see the whole queue."
              action={
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/app/queue${view !== "all" ? `?view=${view}` : ""}`}>
                    Clear filters
                  </Link>
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={copy.icon}
              title={copy.title}
              description={copy.description}
            />
          )
        ) : (
          <QueueBulkList
            key={listKey}
            items={items}
            role={viewer.role}
            viewerId={viewer.id}
          />
        )}
      </div>
    </div>
  );
}
