import Link from "next/link";

import { MessageSquareText, Sparkles } from "lucide-react";

import { GlassBadge } from "@/components/liquid-glass";
import { StatusDot } from "@/components/tickets/status-chip";
import { Avatar } from "@/components/ui/avatar";
import type { TicketStatus } from "@/generated/prisma/enums";
import { relativeTime } from "@/lib/dates";
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
    <ol className={cn("list-enter divide-separator divide-y", className)}>
      {items.map((item) => {
        const system = item.type === "SYSTEM";
        return (
          <li
            key={item.id}
            className="hover:bg-surface-hover flex items-start gap-2.5 px-4 py-3 transition-colors duration-100"
          >
            {system ? (
              <span className="bg-fill text-label-3 mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full">
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
              <p className="text-label-2 m-0 text-[12px] leading-[1.45]">
                {system ? (
                  <span>{item.body}</span>
                ) : (
                  <>
                    <span className="text-label font-medium">
                      {item.author.name}
                    </span>{" "}
                    replied
                    {item.isInternal && (
                      <GlassBadge
                        tone="warning"
                        width={66}
                        height={17}
                        speed={0.45}
                        className="ml-1.5 align-middle text-[9px] tracking-[0.04em] uppercase"
                      >
                        Internal
                      </GlassBadge>
                    )}
                    {showTicket && (
                      <>
                        {" on "}
                        <Link
                          href={`/app/tickets/${item.ticket.key}`}
                          className="num text-label hover:text-accent font-mono text-[11px] font-medium"
                        >
                          {item.ticket.key}
                        </Link>
                      </>
                    )}
                  </>
                )}
              </p>
              {!system && (
                <p className="text-label-3 mt-0.5 line-clamp-2 text-[11.5px] leading-[1.45]">
                  {item.body}
                </p>
              )}
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1 pt-0.5">
              <time
                dateTime={item.createdAt.toISOString()}
                suppressHydrationWarning
                className="num text-label-3 text-[10.5px] whitespace-nowrap"
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
      <MessageSquareText
        className="text-label-3 mb-2 size-5"
        strokeWidth={1.6}
      />
      <p className="text-label m-0 text-[12.5px] font-medium">{title}</p>
      <p className="text-label-3 mt-1 max-w-[240px] text-[11.5px] leading-4">
        {hint}
      </p>
    </div>
  );
}
