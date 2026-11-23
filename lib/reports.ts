import { format, startOfDay, subDays } from "date-fns";

import type { StaffVolumePoint } from "./dashboard";
import { prisma } from "./prisma";
import { SLA_TARGETS } from "./sla";
import { CATEGORY_ORDER, PRIORITY_ORDER } from "./status";

export const REPORT_RANGES = ["7d", "30d", "90d"] as const;
export type ReportRange = (typeof REPORT_RANGES)[number];

export const RANGE_LABEL: Record<ReportRange, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
};

const RANGE_DAYS: Record<ReportRange, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

function percentChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 100);
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export async function getReports(range: ReportRange) {
  const days = RANGE_DAYS[range];
  const now = new Date();
  const start = startOfDay(subDays(now, days - 1));
  const previousStart = startOfDay(subDays(start, days));

  const [
    created,
    resolved,
    createdPrevious,
    resolvedPrevious,
    workloadGroups,
    topArticles,
  ] = await Promise.all([
    prisma.ticket.findMany({
      where: { deletedAt: null, createdAt: { gte: start } },
      select: {
        id: true,
        priority: true,
        category: true,
        createdAt: true,
        firstResponseAt: true,
        slaFirstResponseDueAt: true,
      },
      take: 5000,
    }),
    prisma.ticket.findMany({
      where: { deletedAt: null, resolvedAt: { gte: start } },
      select: {
        id: true,
        priority: true,
        createdAt: true,
        resolvedAt: true,
        slaResolveDueAt: true,
      },
      take: 5000,
    }),
    prisma.ticket.count({
      where: {
        deletedAt: null,
        createdAt: { gte: previousStart, lt: start },
      },
    }),
    prisma.ticket.count({
      where: {
        deletedAt: null,
        resolvedAt: { gte: previousStart, lt: start },
      },
    }),
    prisma.ticket.groupBy({
      by: ["assigneeId"],
      where: {
        deletedAt: null,
        assigneeId: { not: null },
        status: { in: ["OPEN", "IN_PROGRESS", "WAITING_ON_USER"] },
      },
      _count: { _all: true },
      orderBy: { _count: { assigneeId: "desc" } },
    }),
    prisma.knowledgeArticle.findMany({
      where: { isPublished: true },
      orderBy: { views: "desc" },
      take: 5,
      select: {
        slug: true,
        title: true,
        category: true,
        views: true,
        helpfulCount: true,
        notHelpfulCount: true,
      },
    }),
  ]);

  const userIds = workloadGroups
    .map((group) => group.assigneeId)
    .filter((id): id is string => Boolean(id));
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, avatarColor: true },
  });
  const userMap = new Map(users.map((user) => [user.id, user]));

  const workload = workloadGroups
    .map((group) => ({
      id: group.assigneeId ?? "",
      name: userMap.get(group.assigneeId ?? "")?.name ?? "Unknown",
      avatarColor: userMap.get(group.assigneeId ?? "")?.avatarColor ?? null,
      count: group._count._all,
    }))
    .filter((row) => row.id);

  const firstResponseMinutes = created
    .filter((ticket) => ticket.firstResponseAt)
    .map(
      (ticket) =>
        (ticket.firstResponseAt!.getTime() - ticket.createdAt.getTime()) / 60000
    );

  const resolutionHours = resolved
    .filter((ticket) => ticket.resolvedAt)
    .map(
      (ticket) =>
        (ticket.resolvedAt!.getTime() - ticket.createdAt.getTime()) /
        (60 * 60 * 1000)
    );

  const withinTarget = created.filter(
    (ticket) =>
      ticket.firstResponseAt &&
      ticket.slaFirstResponseDueAt &&
      ticket.firstResponseAt.getTime() <= ticket.slaFirstResponseDueAt.getTime()
  ).length;

  const resolvedWithinSla = resolved.filter(
    (ticket) =>
      ticket.resolvedAt &&
      ticket.slaResolveDueAt &&
      ticket.resolvedAt.getTime() <= ticket.slaResolveDueAt.getTime()
  ).length;

  const categories = CATEGORY_ORDER.map((category) => ({
    category,
    count: created.filter((ticket) => ticket.category === category).length,
  })).sort((a, b) => b.count - a.count);

  const priorities = PRIORITY_ORDER.map((priority) => {
    const rows = created.filter((ticket) => ticket.priority === priority);
    const responded = rows.filter((ticket) => ticket.firstResponseAt);
    const within = responded.filter(
      (ticket) =>
        ticket.slaFirstResponseDueAt &&
        ticket.firstResponseAt!.getTime() <=
          ticket.slaFirstResponseDueAt.getTime()
    ).length;

    return {
      priority,
      count: rows.length,
      avgFirstResponseHours:
        responded.length === 0
          ? null
          : average(
              responded.map(
                (ticket) =>
                  (ticket.firstResponseAt!.getTime() -
                    ticket.createdAt.getTime()) /
                  (60 * 60 * 1000)
              )
            ),
      targetHours: SLA_TARGETS[priority].firstResponseHours,
      withinTargetPct:
        responded.length === 0
          ? null
          : Math.round((within / responded.length) * 100),
    };
  });

  const volume: StaffVolumePoint[] = [];
  if (range === "90d") {
    const weeks = 13;
    for (let index = weeks - 1; index >= 0; index -= 1) {
      const bucketStart = startOfDay(subDays(now, index * 7 + 6));
      const bucketEnd = startOfDay(subDays(now, index * 7 - 1));
      volume.push({
        day: format(bucketStart, "MMM d"),
        created: created.filter(
          (ticket) =>
            ticket.createdAt >= bucketStart && ticket.createdAt < bucketEnd
        ).length,
        resolved: resolved.filter(
          (ticket) =>
            ticket.resolvedAt &&
            ticket.resolvedAt >= bucketStart &&
            ticket.resolvedAt < bucketEnd
        ).length,
      });
    }
  } else {
    for (let index = days - 1; index >= 0; index -= 1) {
      const day = startOfDay(subDays(now, index));
      const dayEnd = startOfDay(subDays(day, -1));
      volume.push({
        day: format(day, range === "7d" ? "EEE" : "MMM d"),
        created: created.filter(
          (ticket) => ticket.createdAt >= day && ticket.createdAt < dayEnd
        ).length,
        resolved: resolved.filter(
          (ticket) =>
            ticket.resolvedAt &&
            ticket.resolvedAt >= day &&
            ticket.resolvedAt < dayEnd
        ).length,
      });
    }
  }

  return {
    range,
    days,
    start,
    created: created.length,
    resolved: resolved.length,
    createdPrevious,
    resolvedPrevious,
    createdDelta: percentChange(created.length, createdPrevious),
    resolvedDelta: percentChange(resolved.length, resolvedPrevious),
    avgFirstResponseHours: average(firstResponseMinutes) / 60,
    firstResponseSamples: firstResponseMinutes.length,
    withinTargetPct:
      firstResponseMinutes.length === 0
        ? null
        : Math.round((withinTarget / firstResponseMinutes.length) * 100),
    avgResolutionHours: average(resolutionHours),
    resolvedWithinSlaPct:
      resolved.length === 0
        ? null
        : Math.round((resolvedWithinSla / resolved.length) * 100),
    categories,
    priorities,
    volume,
    workload,
    topArticles,
  };
}
