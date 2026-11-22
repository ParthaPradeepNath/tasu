import Link from "next/link";
import { MessageSquareText, Sparkles } from "lucide-react";
import type { TicketStatus } from "@/generated/prisma/enums";
import { relativeTime } from "@/lib/dates";
import { Avatar } from "@/components/ui/avatar";
import { GlassBadge } from "@/components/liquid-glass";
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
            className="flex items-start gap-2.5 px-4 py-3 transition-colors duration-100 hover:bg-surface-hover"
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
                      <GlassBadge
                        tone="warning"
                        width={66}
                        height={17}
                        speed={0.45}
                        className="ml-1.5 align-middle text-[9px] uppercase tracking-[0.04em]"
                      >
                        Internal
                      </GlassBadge>
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
                className="num whitespace-nowrap text-[10.5px] text-label-3"
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
