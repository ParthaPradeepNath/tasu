import Link from "next/link";
import { ArrowUpRight, MessageSquareText, Sparkles } from "lucide-react";
import type { TicketStatus } from "@/generated/prisma/enums";
import { relativeTime } from "@/lib/dates";
import { Avatar } from "@/components/ui/avatar";
import { StatusDot } from "@/components/tickets/status-chip";
import { cn } from "@/lib/utils";

type ActivityItem = {
  id: string;
  body: string;
  createdAt: Date;
  isInternal: boolean;
  type: "REPLY" | "SYSTEM";
  author: { name: string; avatarColor: string | null; role?: string };
  ticket: { key: string; title: string; status: TicketStatus };
};

export function ActivityFeed({
  items,
  empty,
  showTicket = true,
  className,
}: {
  items: ActivityItem[];
  empty?: React.ReactNode;
  showTicket?: boolean;
  className?: string;
}) {
  if (items.length === 0 && empty) return <>{empty}</>;

  return (
    <ol className={cn("divide-y divide-separator", className)}>
      {items.map((item) => {
        const system = item.type === "SYSTEM";
        return (
          <li
            key={item.id}
            className="flex items-start gap-2.5 px-4 py-3 transition-colors duration-150 hover:bg-surface-hover"
          >
            {system ? (
              <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-fill text-label-3">
                <Sparkles className="size-3" />
              </span>
            ) : (
              <Avatar
                name={item.author.name}
                color={item.author.avatarColor}
                size={20}
                className="mt-0.5"
              />
            )}

            <div className="min-w-0 flex-1">
              <p className="m-0 text-[12px] leading-[1.45] text-label-2">
                {system ? (
                  <span>{item.body}</span>
                ) : (
                  <>
                    <span className="font-medium text-label">
                      {item.author.name}
                    </span>{" "}
                    replied
                    {item.isInternal && (
                      <span className="ml-1.5 rounded-[4px] bg-warning-soft px-1 py-0.5 text-[9.5px] font-medium uppercase tracking-[0.04em] text-warning">
                        internal
                      </span>
                    )}
                    {showTicket && (
                      <>
                        {" on "}
                        <Link
                          href={`/app/tickets/${item.ticket.key}`}
                          className="num font-mono text-[11px] font-medium text-label hover:text-accent"
                        >
                          {item.ticket.key}
                        </Link>
                      </>
                    )}
                  </>
                )}
              </p>
              {!system && (
                <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-[1.45] text-label-3">
                  {item.body}
                </p>
              )}
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1 pt-0.5">
              <time
                dateTime={item.createdAt.toISOString()}
                suppressHydrationWarning
                className="num text-[10.5px] text-label-3"
              >
                {relativeTime(item.createdAt)}
              </time>
              <StatusDot status={item.ticket.status} className="size-1.5" />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function AttentionRow({
  key: ticketKey,
  title,
  status,
  meta,
}: {
  key: string;
  title: string;
  status: TicketStatus;
  meta: string;
}) {
  return (
    <Link
      href={`/app/tickets/${ticketKey}`}
      className="group flex items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-surface-hover"
    >
      <StatusDot status={status} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] font-medium text-label">
          {title}
        </span>
        <span className="mt-0.5 block text-[11px] text-label-3">{meta}</span>
      </span>
      <ArrowUpRight className="size-3.5 text-label-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
    </Link>
  );
}

export function EmptyFeed({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center px-4 py-8 text-center">
      <MessageSquareText className="mb-2 size-5 text-label-3" strokeWidth={1.6} />
      <p className="m-0 text-[12.5px] font-medium text-label">{title}</p>
      <p className="mt-1 max-w-[240px] text-[11.5px] leading-4 text-label-3">
        {hint}
      </p>
    </div>
  );
}
