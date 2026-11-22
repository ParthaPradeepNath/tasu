import Link from "next/link";
import {
  BookOpen,
  Download,
  Target,
} from "lucide-react";
import { requireStaff } from "@/lib/session";
import {
  getReports,
  RANGE_LABEL,
  REPORT_RANGES,
  type ReportRange,
} from "@/lib/reports";
import {
  CATEGORY_META,
  CATEGORY_TONE,
  PRIORITY_META,
  TONE_CLASSES,
} from "@/lib/status";
import { formatDate } from "@/lib/dates";
import { PageHeader } from "@/components/ui/page-header";
import { StatStrip } from "@/components/ui/stat-strip";
import { MeterBar } from "@/components/ui/meter-bar";
import { SectionCard } from "@/components/ui/section-card";
import { SegmentedNav } from "@/components/ui/segmented-nav";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { PriorityBars } from "@/components/tickets/priority-bars";
import { CategoryIcon } from "@/components/tickets/category-icon";
import { ChartLegend, VolumeChart } from "@/components/dashboard/volume-chart";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Reports",
};

type Params = Record<string, string | string[] | undefined>;
const single = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  await requireStaff();

  const rangeParam = single(params.range);
  const range: ReportRange = REPORT_RANGES.includes(rangeParam as ReportRange)
    ? (rangeParam as ReportRange)
    : "30d";

  const data = await getReports(range);
  const maxCategory = Math.max(1, ...data.categories.map((row) => row.count));
  const maxWorkload = Math.max(1, ...data.workload.map((row) => row.count));

  return (
    <div>
      <PageHeader
        eyebrow="IT performance"
        title="Reports"
        description={`Volume, response, and resolution for ${RANGE_LABEL[range].toLowerCase()}. Compare the desk against its own targets — not vanity metrics.`}
        actions={
          <>
            <SegmentedNav
              className="min-w-0 flex-1 sm:flex-none"
              ariaLabel="Report range"
              segments={REPORT_RANGES.map((key) => ({
                label: key === "7d" ? "7 days" : key === "30d" ? "30 days" : "90 days",
                href: key === "30d" ? "/app/reports" : `/app/reports?range=${key}`,
              }))}
            />
            <Button asChild variant="secondary" size="md">
              <a href={`/app/reports/export?range=${range}`}>
                <Download />
                Export CSV
              </a>
            </Button>
          </>
        }
      />

      <StatStrip
        stats={[
          {
            label: "Tickets created",
            value: data.created,
            hint:
              data.createdPrevious === 0
                ? `No tickets in the previous ${data.days} days`
                : `${signed(data.createdDelta)} vs previous ${data.days} days`,
          },
          {
            label: "Resolved",
            value: data.resolved,
            hint:
              data.resolvedPrevious === 0
                ? `No resolutions in the previous ${data.days} days`
                : `${signed(data.resolvedDelta)} vs previous ${data.days} days`,
            tone: data.resolved >= data.created ? "success" : undefined,
          },
          {
            label: "Avg first response",
            value: `${data.avgFirstResponseHours.toFixed(1)}h`,
            hint:
              data.withinTargetPct === null
                ? "No responses yet in range"
                : `${data.withinTargetPct}% within target`,
            tone:
              data.withinTargetPct !== null && data.withinTargetPct < 80
                ? "warning"
                : undefined,
          },
          {
            label: "SLA compliance",
            value:
              data.resolvedWithinSlaPct === null
                ? "—"
                : `${data.resolvedWithinSlaPct}%`,
            hint:
              data.resolvedWithinSlaPct === null
                ? "No resolutions yet in range"
                : `Avg resolution ${data.avgResolutionHours.toFixed(1)}h`,
            tone:
              data.resolvedWithinSlaPct === null
                ? undefined
                : data.resolvedWithinSlaPct >= 90
                  ? "success"
                  : data.resolvedWithinSlaPct >= 75
                    ? "warning"
                    : "danger",
          },
        ]}
      />

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <SectionCard
          title={`Volume · ${RANGE_LABEL[range]}`}
          action={<ChartLegend />}
        >
          <VolumeChart data={data.volume} height={224} />
        </SectionCard>

        <SectionCard
          title="Where requests come from"
          action={
            <span className="text-[11px] text-label-3">Created in range</span>
          }
        >
          {data.created === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No tickets in this range"
              description="Try a wider range to see category volume."
            />
          ) : (
            <ul className="space-y-3 px-4 py-4">
              {data.categories.map((row) => (
                <li key={row.category}>
                  <div className="mb-1.5 flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex size-5 items-center justify-center rounded-[5px]",
                        TONE_CLASSES[CATEGORY_TONE[row.category]],
                      )}
                    >
                      <CategoryIcon category={row.category} className="size-3" />
                    </span>
                    <span className="text-[12px] font-medium text-label">
                      {CATEGORY_META[row.category].label}
                    </span>
                    <span className="num ml-auto text-[11px] text-label-2">
                      {row.count}
                    </span>
                    <span className="num w-9 text-right text-[10.5px] text-label-3">
                      {data.created === 0
                        ? "0%"
                        : `${Math.round((row.count / data.created) * 100)}%`}
                    </span>
                  </div>
                  <MeterBar
                    className="h-1.5"
                    fillClassName="bg-accent/75"
                    value={Math.max(
                      row.count === 0 ? 0 : 0.04,
                      row.count / maxCategory,
                    )}
                  />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <SectionCard
          title="Response by priority"
          action={
            <span className="inline-flex items-center gap-1 text-[11px] text-label-3">
              <Target className="size-3" />
              First response target
            </span>
          }
        >
          <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr className="border-b border-separator text-[10.5px] uppercase tracking-[0.05em] text-label-3">
                <th className="whitespace-nowrap px-4 py-2 font-medium">Priority</th>
                <th className="whitespace-nowrap px-3 py-2 text-right font-medium">Tickets</th>
                <th className="whitespace-nowrap px-3 py-2 text-right font-medium">Avg response</th>
                <th className="whitespace-nowrap px-3 py-2 text-right font-medium">Target</th>
                <th className="whitespace-nowrap px-4 py-2 text-right font-medium">Within target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-separator">
              {data.priorities.map((row) => (
                <tr key={row.priority} className="text-[12px] text-label-2">
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-2 text-label">
                      <PriorityBars priority={row.priority} />
                      {PRIORITY_META[row.priority].label}
                    </span>
                  </td>
                  <td className="num whitespace-nowrap px-3 py-2.5 text-right">{row.count}</td>
                  <td className="num whitespace-nowrap px-3 py-2.5 text-right text-label">
                    {row.avgFirstResponseHours === null
                      ? "—"
                      : `${row.avgFirstResponseHours.toFixed(1)}h`}
                  </td>
                  <td className="num whitespace-nowrap px-3 py-2.5 text-right text-label-3">
                    {row.targetHours}h
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-2">
                      <MeterBar
                        className="h-1 w-14"
                        fillClassName={
                          (row.withinTargetPct ?? 0) >= 90
                            ? "bg-success"
                            : (row.withinTargetPct ?? 0) >= 75
                              ? "bg-warning"
                              : "bg-danger"
                        }
                        value={(row.withinTargetPct ?? 0) / 100}
                      />
                      <span className="num w-9 whitespace-nowrap text-right text-[11px] font-medium text-label">
                        {row.withinTargetPct === null
                          ? "—"
                          : `${row.withinTargetPct}%`}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <p className="border-t border-separator px-4 py-2.5 text-[11px] leading-4 text-label-3">
            Based on {data.firstResponseSamples} tickets that received a first
            reply in this range. Targets scale with priority.
          </p>
        </SectionCard>

        <SectionCard
          title="Agent workload"
          action={
            <span className="text-[11px] text-label-3">Active now</span>
          }
        >
          {data.workload.length === 0 ? (
            <EmptyState
              icon={Target}
              title="Nothing assigned"
              description="No active tickets are assigned to an agent right now."
            />
          ) : (
            <ul className="divide-y divide-separator">
              {data.workload.map((row) => (
                <li key={row.id} className="flex items-center gap-3 px-4 py-2.5">
                  <Avatar name={row.name} color={row.avatarColor} size={24} />
                  <span className="w-[92px] shrink-0 truncate text-[12px] font-medium text-label">
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

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <SectionCard
          title="Most read knowledge"
          action={
            <Link
              href="/app/knowledge"
              className="text-[11px] font-medium text-accent hover:underline"
            >
              Browse
            </Link>
          }
        >
          {data.topArticles.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No articles yet"
              description="Publish a few guides and they will show up here with read counts."
            />
          ) : (
            <ul className="divide-y divide-separator">
              {data.topArticles.map((article, index) => {
                const total = article.helpfulCount + article.notHelpfulCount;
                const rate =
                  total === 0 ? null : Math.round((article.helpfulCount / total) * 100);
                return (
                  <li key={article.slug}>
                    <Link
                      href={`/app/knowledge/${article.slug}`}
                      className="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface-hover"
                    >
                      <span className="num w-4 shrink-0 text-[11px] text-label-3">
                        {index + 1}
                      </span>
                      <span
                        className={cn(
                          "inline-flex size-6 shrink-0 items-center justify-center rounded-[6px]",
                          TONE_CLASSES[CATEGORY_TONE[article.category]],
                        )}
                      >
                        <CategoryIcon category={article.category} className="size-3" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12px] font-medium text-label">
                          {article.title}
                        </span>
                        <span className="mt-0.5 block text-[10.5px] text-label-3">
                          {CATEGORY_META[article.category].label} ·{" "}
                          {rate === null ? "No votes yet" : `${rate}% helpful`}
                        </span>
                      </span>
                      <span className="num shrink-0 text-right text-[11px] text-label-2">
                        {article.views.toLocaleString()}
                        <span className="ml-1 text-[9.5px] text-label-3">reads</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        <div className="surface-card flex flex-col justify-between p-4">
          <div>
            <p className="eyebrow mb-1.5">Window</p>
            <p className="m-0 text-[13px] font-medium text-label">
              {formatDate(data.start)} — today
            </p>
            <p className="mt-1.5 text-[11.5px] leading-4 text-label-3">
              {data.created} created, {data.resolved} resolved. Export the raw
              ticket list if you need to slice it elsewhere.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Button asChild variant="secondary" size="sm" className="flex-1">
              <a href={`/app/reports/export?range=${range}`}>
                <Download />
                Export
              </a>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/app/queue">Queue</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function signed(value: number) {
  if (value === 0) return "No change";
  return `${value > 0 ? "+" : ""}${value}%`;
}
