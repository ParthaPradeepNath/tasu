import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Inbox,
  Plus,
  Ticket,
} from "lucide-react";
import { requireViewer } from "@/lib/session";
import { getEmployeeDashboard, getStaffDashboard } from "@/lib/dashboard";
import { firstName } from "@/lib/status";
import { PageHeader } from "@/components/ui/page-header";
import { StatStrip } from "@/components/ui/stat-strip";
import { MeterBar } from "@/components/ui/meter-bar";
import { SectionCard } from "@/components/ui/section-card";
import { Button } from "@/components/ui/button";
import { GlassButton } from "@/components/liquid-glass";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { TicketList } from "@/components/tickets/ticket-list";
import { ActivityFeed, EmptyFeed } from "@/components/dashboard/activity-feed";
import { ChartLegend, VolumeChart } from "@/components/dashboard/volume-chart";

export const metadata = {
  title: "Overview",
};

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function OverviewPage() {
  const viewer = await requireViewer();
  const isStaff = viewer.role !== "employee";

  if (isStaff) {
    const data = await getStaffDashboard();
    const maxWorkload = Math.max(1, ...data.workload.map((row) => row.count));

    return (
      <div>
        <PageHeader
          eyebrow={format(new Date(), "EEEE, MMMM d")}
          title="IT overview"
          description={`Triage first. ${data.unassigned} unassigned, ${data.waiting} waiting on requesters, and ${data.breaching} at SLA risk right now.`}
          actions={
            <>
              <Button asChild variant="secondary" size="md">
                <Link href="/app/queue">
                  Open queue
                  <ArrowRight />
                </Link>
              </Button>
              <GlassButton
                asChild
                material="tinted"
                size="md"
                className="rounded-[10px] border border-white/15 bg-accent text-white"
              >
                <Link href="/app/tickets/new">
                  <Plus />
                  New ticket
                </Link>
              </GlassButton>
            </>
          }
        />

        <StatStrip
          stats={[
            {
              label: "Unassigned",
              value: data.unassigned,
              hint: data.unassigned > 0 ? "Waiting for an agent" : "Queue is clear",
              tone: data.unassigned > 0 ? "warning" : "success",
            },
            {
              label: "Breaching SLA",
              value: data.breaching,
              hint: data.breaching > 0 ? "Needs attention now" : "All within target",
              tone: data.breaching > 0 ? "danger" : "success",
            },
            {
              label: "Avg first response",
              value: `${data.avgFirstResponseHours.toFixed(1)}h`,
              hint: "Last 30 days",
            },
            {
              label: "Resolved today",
              value: data.resolvedToday,
              hint: "Since midnight",
              tone: data.resolvedToday > 0 ? "success" : undefined,
            },
          ]}
        />

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <div className="min-w-0 space-y-4">
            <SectionCard
              title="Volume · last 7 days"
              action={<ChartLegend />}
            >
              <VolumeChart data={data.volume} />
            </SectionCard>

            <SectionCard
              title="Agent workload"
              action={
                <span className="text-[11px] text-label-3">
                  Active tickets
                </span>
              }
            >
              {data.workload.length === 0 ? (
                <EmptyFeed
                  title="No active assignments"
                  hint="Assigned tickets will show up here with each agent's load."
                />
              ) : (
                <ul className="divide-y divide-separator">
                  {data.workload.map((row) => (
                    <li
                      key={row.id}
                      className="flex items-center gap-3 px-4 py-2.5"
                    >
                      <Avatar
                        name={row.name}
                        color={row.avatarColor}
                        size={24}
                      />
                      <span className="w-[104px] shrink-0 truncate text-[12.5px] font-medium text-label">
                        {row.name}
                      </span>
                      <MeterBar
                        className="h-1.5 min-w-0 flex-1"
                        fillClassName="bg-accent/80"
                        value={Math.max(0.06, row.count / maxWorkload)}
                      />
                      <span className="num w-6 text-right text-[12px] font-medium text-label-2">
                        {row.count}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>

          <div className="min-w-0 space-y-4">
            <SectionCard
              title="Oldest unassigned"
              action={
                <Link
                  href="/app/queue?view=unassigned"
                  className="text-[11px] font-medium text-accent hover:underline"
                >
                  View all
                </Link>
              }
            >
              {data.oldestUnassigned.length === 0 ? (
                <EmptyFeed
                  title="Nothing unassigned"
                  hint="Every open ticket has an owner. Nice work."
                />
              ) : (
                <TicketList
                  items={data.oldestUnassigned}
                  role={viewer.role}
                  showRequester
                  compact
                  className="divide-y divide-separator"
                />
              )}
            </SectionCard>

            <SectionCard
              title="Waiting on requesters"
              action={
                <Link
                  href="/app/queue?view=waiting"
                  className="text-[11px] font-medium text-accent hover:underline"
                >
                  View all
                </Link>
              }
            >
              {data.waitingTickets.length === 0 ? (
                <EmptyFeed
                  title="No one is blocked"
                  hint="When you need more information, the ticket will wait here."
                />
              ) : (
                <TicketList
                  items={data.waitingTickets}
                  role={viewer.role}
                  showRequester
                  compact
                  className="divide-y divide-separator"
                />
              )}
            </SectionCard>

            <SectionCard
              title="Latest activity"
              action={
                <Link
                  href="/app/inbox"
                  className="text-[11px] font-medium text-accent hover:underline"
                >
                  Inbox
                </Link>
              }
            >
              <ActivityFeed
                items={data.activity}
                empty={<EmptyFeed title="Quiet for now" hint="New replies will land here." />}
              />
            </SectionCard>
          </div>
        </div>
      </div>
    );
  }

  const data = await getEmployeeDashboard(viewer);

  return (
    <div>
      <PageHeader
        eyebrow={format(new Date(), "EEEE, MMMM d")}
        title={`${greeting()}, ${firstName(viewer.name)}`}
        description={
          data.waiting > 0
            ? `${data.waiting} ${data.waiting === 1 ? "ticket needs" : "tickets need"} your reply. Everything else is with IT.`
            : "Everything is moving. Open a ticket any time something isn't working."
        }
        actions={
          <GlassButton
            asChild
            material="tinted"
            size="md"
            className="rounded-[10px] border border-white/15 bg-accent text-white"
          >
            <Link href="/app/tickets/new">
              <Plus />
              New ticket
            </Link>
          </GlassButton>
        }
      />

      <StatStrip
        columns={3}
        stats={[
          {
            label: "Open",
            value: data.open,
            hint: "With IT right now",
          },
          {
            label: "Waiting on you",
            value: data.waiting,
            hint: data.waiting > 0 ? "IT needs a reply" : "You're all caught up",
            tone: data.waiting > 0 ? "warning" : "success",
          },
          {
            label: "Resolved this month",
            value: data.resolvedThisMonth,
            hint: "Tickets closed out",
            tone: data.resolvedThisMonth > 0 ? "success" : undefined,
          },
        ]}
      />

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <SectionCard
          title="Needs your attention"
          action={
            <Link
              href="/app/tickets"
              className="flex items-center gap-1 text-[11px] font-medium text-accent hover:underline"
            >
              My tickets
              <ArrowUpRight className="size-3" />
            </Link>
          }
        >
          {data.attention.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="Nothing needs you"
              description="When IT replies or resolves a ticket, it will show up here."
              action={
                <Button asChild variant="secondary" size="sm">
                  <Link href="/app/tickets">View my tickets</Link>
                </Button>
              }
            />
          ) : (
            <TicketList
              items={data.attention}
              role={viewer.role}
              className="divide-y divide-separator"
            />
          )}
        </SectionCard>

        <div className="min-w-0 space-y-4">
          <SectionCard
            title="Recent activity"
            action={
              <Link
                href="/app/inbox"
                className="text-[11px] font-medium text-accent hover:underline"
              >
                Inbox
              </Link>
            }
          >
            <ActivityFeed
              items={data.activity}
              empty={
                <EmptyFeed
                  title="No activity yet"
                  hint="Replies on your tickets will appear here."
                />
              }
            />
          </SectionCard>

          <SectionCard title="Suggested reading">
            <ul className="divide-y divide-separator">
              {data.suggested.map((article) => (
                <li key={article.slug}>
                  <Link
                    href={`/app/knowledge/${article.slug}`}
                    className="group flex items-start gap-3 px-4 py-3 transition-colors duration-100 hover:bg-surface-hover"
                  >
                    <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-[8px] bg-fill text-label-3">
                      <BookOpen className="size-3.5" strokeWidth={1.7} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12.5px] font-medium leading-[1.35] text-label">
                        {article.title}
                      </span>
                      <span className="mt-0.5 block text-[10.5px] text-label-3">
                        {article.category.toLowerCase()} ·{" "}
                        {Math.max(
                          2,
                          Math.round(
                            article.body.split(/\s+/).length / 200,
                          ),
                        )}{" "}
                        min read
                      </span>
                    </span>
                    <ArrowUpRight className="mt-1 size-3.5 shrink-0 text-label-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
              {data.suggested.length === 0 && (
                <li className="px-4 py-6 text-center text-[12px] text-label-3">
                  Articles matching your tickets will appear here.
                </li>
              )}
            </ul>
          </SectionCard>

          <div className="surface-card flex items-center gap-3 p-4">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-accent-soft text-accent">
              <Ticket className="size-4" strokeWidth={1.7} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="m-0 text-[12.5px] font-medium text-label">
                Something broken?
              </p>
              <p className="m-0 mt-0.5 text-[11px] leading-4 text-label-3">
                Describe it in a sentence. We&apos;ll take it from there.
              </p>
            </div>
            <Button asChild variant="secondary" size="sm">
              <Link href="/app/tickets/new">New ticket</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
