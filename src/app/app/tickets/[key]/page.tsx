import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Building2,
  Clock,
  Mail,
  ShieldCheck,
  Timer,
  TriangleAlert,
} from "lucide-react";
import { formatDateTime, formatHours, relativeTime, countdown } from "@/lib/dates";
import { getViewer, requireViewer } from "@/lib/session";
import { isStaff } from "@/lib/permissions";
import { getTicketByKey } from "@/lib/tickets";
import { suggestArticles } from "@/lib/articles";
import { SLA_LABEL, isFirstResponseOverdue, slaProgress, slaState } from "@/lib/sla";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/ui/avatar";
import { StatusChip } from "@/components/tickets/status-chip";
import { TicketActions } from "@/components/tickets/ticket-actions";
import { TicketProperties } from "@/components/tickets/ticket-properties";
import { TicketThread } from "@/components/tickets/ticket-thread";
import { CreatedToast } from "./created-toast";
import { cn } from "@/lib/utils";

type Params = Record<string, string | string[] | undefined>;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ key: string }>;
}): Promise<Metadata> {
  const { key } = await params;
  const viewer = await getViewer();
  if (!viewer) return { title: "Ticket" };

  const ticket = await getTicketByKey(
    { id: viewer.id, role: viewer.role },
    decodeURIComponent(key),
  );

  return { title: ticket ? `${ticket.key} · ${ticket.title}` : "Ticket not found" };
}

export default async function TicketDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ key: string }>;
  searchParams: Promise<Params>;
}) {
  const { key } = await params;
  const query = await searchParams;
  const viewer = await requireViewer();
  const staff = isStaff(viewer.role);

  const ticket = await getTicketByKey(
    { id: viewer.id, role: viewer.role },
    decodeURIComponent(key),
  );

  if (!ticket) notFound();

  const [agents, suggested] = await Promise.all([
    staff
      ? prisma.user.findMany({
          where: { role: { in: ["agent", "admin"] } },
          select: { id: true, name: true, avatarColor: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    suggestArticles(ticket),
  ]);

  const state = slaState(ticket);
  const remaining = countdown(ticket.slaResolveDueAt);
  const elapsed = slaProgress(ticket);
  const firstResponseOverdue = isFirstResponseOverdue(ticket);
  const done = ticket.status === "RESOLVED" || ticket.status === "CLOSED";

  const firstResponseMinutes = ticket.firstResponseAt
    ? (ticket.firstResponseAt.getTime() - ticket.createdAt.getTime()) / 60000
    : null;

  return (
    <div className="mx-auto max-w-[1120px]">
      <CreatedToast
        ticketKey={ticket.key}
        created={query.created === "1"}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link
          href={staff ? "/app/queue" : "/app/tickets"}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-label-2 transition-colors hover:text-label"
        >
          <ArrowLeft className="size-3.5" />
          {staff ? "Queue" : "My tickets"}
        </Link>
        <span className="text-label-3" aria-hidden>
          /
        </span>
        <span className="num font-mono text-[11.5px] text-label-3">{ticket.key}</span>
        <StatusChip
          status={ticket.status}
          viewer={staff ? "agent" : "requester"}
          assigneeName={ticket.assignee?.name}
          requesterName={ticket.requester.name}
        />
        <div className="ml-auto">
          <TicketActions
            ticketId={ticket.id}
            status={ticket.status}
            assigneeId={ticket.assigneeId}
            viewerId={viewer.id}
            staff={staff}
          />
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <header className="mb-5">
            <h1 className="m-0 text-[23px] font-semibold leading-[1.25] tracking-[-0.026em] text-label text-balance">
              {ticket.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-label-3">
              <Avatar
                name={ticket.requester.name}
                color={ticket.requester.avatarColor}
                size={18}
              />
              <span className="font-medium text-label-2">
                {ticket.requester.name}
              </span>
              {ticket.requester.department && (
                <>
                  <span aria-hidden>·</span>
                  <span>{ticket.requester.department}</span>
                </>
              )}
              <span aria-hidden>·</span>
              <span>opened {relativeTime(ticket.createdAt)}</span>
              <span aria-hidden>·</span>
              <span className="num font-mono">{ticket.key}</span>
            </div>
          </header>

          <TicketThread
            ticketId={ticket.id}
            description={ticket.description}
            requester={{
              name: ticket.requester.name,
              avatarColor: ticket.requester.avatarColor,
              title: ticket.requester.title,
              department: ticket.requester.department,
              createdAt: ticket.createdAt.toISOString(),
            }}
            replies={ticket.replies.map((reply) => ({
              id: reply.id,
              body: reply.body,
              isInternal: reply.isInternal,
              type: reply.type,
              createdAt: reply.createdAt.toISOString(),
              author: {
                id: reply.author.id,
                name: reply.author.name,
                avatarColor: reply.author.avatarColor,
                role: reply.author.role,
                title: reply.author.title,
              },
            }))}
            viewer={{
              id: viewer.id,
              name: viewer.name,
              avatarColor: viewer.avatarColor,
              role: viewer.role,
            }}
            staff={staff}
            locked={ticket.status === "CLOSED" && !staff}
          />
        </div>

        <aside className="space-y-3 lg:sticky lg:top-[76px]">
          <div className="surface-card overflow-hidden">
            <header className="flex h-10 items-center justify-between border-b border-separator px-3.5">
              <h2 className="m-0 text-[12px] font-semibold text-label">
                Service level
              </h2>
              <span
                className={cn(
                  "inline-flex h-5 items-center gap-1 rounded-full px-1.5 text-[10px] font-medium",
                  state === "breached" && "bg-danger-soft text-danger",
                  state === "due_soon" && "bg-warning-soft text-warning",
                  state === "on_track" && "bg-accent-soft text-accent",
                  state === "met" && "bg-success-soft text-success",
                  state === "none" && "bg-fill text-label-3",
                )}
              >
                {state === "breached" ? (
                  <TriangleAlert className="size-2.5" />
                ) : state === "met" ? (
                  <ShieldCheck className="size-2.5" />
                ) : (
                  <Timer className="size-2.5" />
                )}
                {SLA_LABEL[state]}
              </span>
            </header>

            <div className="p-3.5">
              <p
                className={cn(
                  "num m-0 text-[22px] font-semibold leading-none tracking-[-0.03em]",
                  state === "breached" && "text-danger",
                  state === "due_soon" && "text-warning",
                  state === "met" && "text-success",
                )}
              >
                {done
                  ? ticket.resolvedAt
                    ? `Resolved ${relativeTime(ticket.resolvedAt)}`
                    : "Resolved"
                  : (remaining ?? "No target")}
              </p>
              <p className="m-0 mt-1.5 text-[11px] leading-4 text-label-3">
                Resolve target {formatDateTime(ticket.slaResolveDueAt)}
              </p>

              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-300",
                    state === "breached"
                      ? "bg-danger"
                      : state === "due_soon"
                        ? "bg-warning"
                        : state === "met"
                          ? "bg-success"
                          : "bg-accent",
                  )}
                  style={{ width: `${done ? 100 : elapsed}%` }}
                />
              </div>

              <dl className="mt-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <dt className="flex items-center gap-1.5 text-[11.5px] text-label-3">
                    <Clock className="size-3" />
                    First reply
                  </dt>
                  <dd
                    className={cn(
                      "num text-[11.5px] font-medium text-label-2",
                      !ticket.firstResponseAt &&
                        ticket.slaFirstResponseDueAt &&
                        firstResponseOverdue &&
                        "text-danger",
                    )}
                  >
                    {firstResponseMinutes !== null
                      ? formatHours(firstResponseMinutes)
                      : countdown(ticket.slaFirstResponseDueAt)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-[11.5px] text-label-3">Created</dt>
                  <dd className="num text-[11.5px] text-label-2">
                    {formatDateTime(ticket.createdAt)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-[11.5px] text-label-3">Last activity</dt>
                  <dd className="num text-[11.5px] text-label-2">
                    {relativeTime(ticket.lastActivityAt)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <TicketProperties
            ticket={{
              id: ticket.id,
              status: ticket.status,
              priority: ticket.priority,
              category: ticket.category,
              assigneeId: ticket.assigneeId,
              tags: ticket.tags,
            }}
            agents={agents}
            staff={staff}
            requester={{
              name: ticket.requester.name,
              email: ticket.requester.email,
              avatarColor: ticket.requester.avatarColor,
            }}
          />

          {suggested.length > 0 && (
            <div className="surface-card overflow-hidden">
              <header className="flex h-10 items-center justify-between border-b border-separator px-3.5">
                <h2 className="m-0 text-[12px] font-semibold text-label">
                  Related reading
                </h2>
                <Link
                  href="/app/knowledge"
                  className="text-[10.5px] font-medium text-accent hover:underline"
                >
                  All
                </Link>
              </header>
              <ul className="divide-y divide-separator">
                {suggested.map((article) => (
                  <li key={article.slug}>
                    <Link
                      href={`/app/knowledge/${article.slug}`}
                      className="group flex items-start gap-2.5 px-3.5 py-2.5 transition-colors hover:bg-surface-hover"
                    >
                      <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-[6px] bg-fill text-label-3">
                        <BookOpen className="size-3" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11.5px] font-medium leading-4 text-label">
                          {article.title}
                        </span>
                        <span className="block text-[10.5px] text-label-3">
                          {article.category.toLowerCase()}
                        </span>
                      </span>
                      <ArrowUpRight className="mt-0.5 size-3 shrink-0 text-label-3 opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="surface-card p-3.5">
            <div className="flex items-center gap-2.5">
              <Avatar
                name={ticket.requester.name}
                color={ticket.requester.avatarColor}
                size={30}
              />
              <div className="min-w-0">
                <p className="m-0 truncate text-[12.5px] font-medium text-label">
                  {ticket.requester.name}
                </p>
                <p className="m-0 truncate text-[10.5px] text-label-3">
                  {ticket.requester.title ?? "Requester"}
                </p>
              </div>
            </div>
            <dl className="mt-3 space-y-1.5">
              <div className="flex items-center gap-2 text-[11.5px] text-label-2">
                <Building2 className="size-3 shrink-0 text-label-3" />
                <span className="truncate">
                  {ticket.requester.department ?? "No department"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11.5px] text-label-2">
                <Mail className="size-3 shrink-0 text-label-3" />
                <a
                  href={`mailto:${ticket.requester.email}`}
                  className="truncate hover:text-accent"
                >
                  {ticket.requester.email}
                </a>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
