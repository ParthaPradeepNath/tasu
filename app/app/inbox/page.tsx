import Link from "next/link";
import { format, isToday, isYesterday } from "date-fns";
import {
  ArrowRight,
  CheckCheck,
  Inbox as InboxIcon,
  Lock,
  MessageSquareText,
} from "lucide-react";
import type { TicketStatus } from "@/generated/prisma/enums";
import { requireViewer } from "@/lib/session";
import { isStaff } from "@/lib/permissions";
import { getInbox } from "@/lib/inbox";
import { relativeTime } from "@/lib/dates";
import { plainText } from "@/components/markdown";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { SegmentedNav } from "@/components/ui/segmented-nav";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { TicketList } from "@/components/tickets/ticket-list";
import { StatusDot } from "@/components/tickets/status-chip";

export const metadata = {
  title: "Inbox",
};

type Params = Record<string, string | string[] | undefined>;
const single = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

function dayKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function dayHeading(date: Date) {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, MMMM d");
}

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const viewer = await requireViewer();
  const staff = isStaff(viewer.role);
  const { needs, unassigned, replies, byStatus } = await getInbox(viewer);
  const totalNeeds = needs.length + unassigned.length;

  const view = single(params.view) === "activity" ? "activity" : "needs";

  const groups: { key: string; date: Date; items: typeof replies }[] = [];
  for (const reply of replies) {
    const key = dayKey(reply.createdAt);
    const existing = groups.find((group) => group.key === key);
    if (existing) {
      existing.items.push(reply);
    } else {
      groups.push({ key, date: reply.createdAt, items: [reply] });
    }
  }

  const statusSummary = (
    [
      ["WAITING_ON_USER", staff ? "Waiting on requester" : "Waiting on you"],
      ["RESOLVED", "Awaiting confirmation"],
      ["OPEN", "Open"],
      ["IN_PROGRESS", "In progress"],
    ] as [TicketStatus, string][]
  )
    .map(([status, label]) => ({ status, label, count: byStatus[status] ?? 0 }))
    .filter((row) => row.count > 0);

  return (
    <div className="mx-auto max-w-[900px]">
      <PageHeader
        eyebrow="Notifications"
        title="Inbox"
        description={
          staff
            ? "Replies across the desk, plus the tickets that are waiting on a decision from you."
            : "Everything IT has said about your tickets, in one place. Reply once and it keeps moving."
        }
        actions={
          staff ? (
            <Button asChild variant="secondary" size="md">
              <Link href="/app/queue">
                Open queue
                <ArrowRight />
              </Link>
            </Button>
          ) : (
            <Button asChild variant="primary" size="md">
              <Link href="/app/tickets/new">New ticket</Link>
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SegmentedNav
          ariaLabel="Inbox views"
          segments={[
            {
              label: "Needs you",
              href: "/app/inbox",
              count: totalNeeds,
            },
            {
              label: "All activity",
              href: "/app/inbox?view=activity",
              count: replies.length,
            },
          ]}
        />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-label-3">
          {statusSummary.slice(0, 3).map((row) => (
            <span key={row.status} className="inline-flex items-center gap-1.5">
              <StatusDot status={row.status} className="size-1.5" />
              <span className="num font-medium text-label-2">{row.count}</span>
              {row.label}
            </span>
          ))}
        </div>
      </div>

      {view === "needs" ? (
        <div className="space-y-4">
          {totalNeeds === 0 && (
            <div className="surface-card overflow-clip">
              <EmptyState
                icon={staff ? CheckCheck : InboxIcon}
                title={staff ? "Your inbox is clear" : "Nothing needs you"}
                description={
                  staff
                    ? "No active tickets are assigned to you, and the unassigned queue is empty. Nice work."
                    : "When IT asks a question or marks a ticket resolved, it will land here."
                }
                action={
                  <Button asChild variant="secondary" size="sm">
                    <Link href={staff ? "/app/queue" : "/app/tickets"}>
                      {staff ? "Go to queue" : "View my tickets"}
                    </Link>
                  </Button>
                }
              />
            </div>
          )}

          {needs.length > 0 && (
            <div className="surface-card overflow-clip">
              <div className="flex items-center justify-between border-b border-separator px-4 py-2.5">
                <h2 className="m-0 min-w-0 truncate text-[12px] font-semibold text-label">
                  {staff ? "Assigned to you" : "Waiting on your reply"}
                </h2>
                <span className="num shrink-0 text-[10.5px] text-label-3">
                  {needs.length} {needs.length === 1 ? "ticket" : "tickets"}
                </span>
              </div>
              <TicketList
                items={needs}
                role={viewer.role}
                showRequester={staff}
                className="divide-y divide-separator"
              />
            </div>
          )}

          {staff && unassigned.length > 0 && (
            <div className="surface-card overflow-clip">
              <div className="flex items-center justify-between border-b border-separator px-4 py-2.5">
                <h2 className="m-0 text-[12px] font-semibold text-label">
                  New · waiting for triage
                </h2>
                <Link
                  href="/app/queue?view=unassigned"
                  className="shrink-0 text-[11px] font-medium text-accent hover:underline"
                >
                  View all
                </Link>
              </div>
              <TicketList
                items={unassigned}
                role={viewer.role}
                showRequester
                className="divide-y divide-separator"
              />
            </div>
          )}
        </div>
      ) : (
        <div>
          {replies.length === 0 ? (
            <div className="surface-card overflow-clip">
              <EmptyState
                icon={MessageSquareText}
                title="No activity yet"
                description={
                  staff
                    ? "Replies from requesters and agents will appear here as they happen."
                    : "Replies on your tickets will appear here as soon as IT writes back."
                }
              />
            </div>
          ) : (
            <div className="space-y-5">
              {groups.map((group) => (
                <section key={group.key}>
                  <div className="mb-2 flex items-center gap-2 px-1">
                    <h2 className="m-0 text-[11.5px] font-semibold text-label">
                      {dayHeading(group.date)}
                    </h2>
                    <span className="h-px flex-1 bg-separator" />
                    <span className="num text-[10.5px] text-label-3">
                      {group.items.length}
                    </span>
                  </div>

                  <div className="surface-card overflow-clip">
                    <ul className="divide-y divide-separator">
                      {group.items.map((reply) => (
                        <li key={reply.id}>
                          <Link
                            href={`/app/tickets/${reply.ticket.key}`}
                            className="group flex items-start gap-3 px-4 py-3.5 transition-colors duration-100 hover:bg-surface-hover"
                          >
                            <Avatar
                              name={reply.author.name}
                              color={reply.author.avatarColor}
                              size={26}
                              className="mt-0.5"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-[11.5px]">
                                <span className="font-semibold text-label">
                                  {reply.author.name}
                                </span>
                                <span className="text-label-3">replied on</span>
                                <span className="num font-mono text-[10.5px] font-medium text-label-2">
                                  {reply.ticket.key}
                                </span>
                                {reply.isInternal && (
                                  <span className="inline-flex items-center gap-1 rounded-[4px] bg-warning-soft px-1.5 py-px text-[9.5px] font-medium uppercase tracking-[0.04em] text-warning">
                                    <Lock className="size-2.5" />
                                    Internal
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 line-clamp-2 text-[12px] leading-[1.5] text-label-2">
                                {plainText(reply.body, 180)}
                              </p>
                              <p className="mt-1 truncate text-[10.5px] text-label-3">
                                {reply.ticket.title}
                              </p>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-1 pt-0.5">
                              <time
                                dateTime={reply.createdAt.toISOString()}
                                className="num whitespace-nowrap text-[10.5px] text-label-3"
                              >
                                {relativeTime(reply.createdAt)}
                              </time>
                              <StatusDot
                                status={reply.ticket.status}
                                className="size-1.5"
                              />
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="mt-4 px-1 text-[11px] leading-4 text-label-3">
        {staff
          ? "Inbox is a reading view. Assign, reply, and resolve from the ticket itself."
          : "You can also reply straight from a ticket. Every update sends an email too."}
      </p>
    </div>
  );
}
