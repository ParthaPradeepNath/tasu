import { format, startOfDay, startOfMonth, subDays } from "date-fns";
import type { TicketStatus } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "./prisma";
import { TICKET_LIST_SELECT, type TicketListItem } from "./tickets";
import type { Viewer } from "./session";

const ACTIVE: TicketStatus[] = ["OPEN", "IN_PROGRESS", "WAITING_ON_USER"];

async function countsFor(where: Prisma.TicketWhereInput) {
  return prisma.ticket.count({ where });
}

export async function getEmployeeDashboard(viewer: Viewer) {
  const now = new Date();
  const monthStart = startOfMonth(now);

  const [open, waiting, resolvedThisMonth, attention, activity, categories] =
    await Promise.all([
      countsFor({
        deletedAt: null,
        requesterId: viewer.id,
        status: { in: ACTIVE },
      }),
      countsFor({
        deletedAt: null,
        requesterId: viewer.id,
        status: "WAITING_ON_USER",
      }),
      countsFor({
        deletedAt: null,
        requesterId: viewer.id,
        status: { in: ["RESOLVED", "CLOSED"] },
        resolvedAt: { gte: monthStart },
      }),
      prisma.ticket.findMany({
        where: {
          deletedAt: null,
          requesterId: viewer.id,
          status: { in: ["WAITING_ON_USER", "RESOLVED"] },
        },
        select: TICKET_LIST_SELECT,
        orderBy: { lastActivityAt: "desc" },
        take: 4,
      }),
      prisma.reply.findMany({
        where: {
          isInternal: false,
          ticket: { requesterId: viewer.id, deletedAt: null },
        },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          author: { select: { name: true, avatarColor: true } },
          ticket: { select: { key: true, title: true, status: true } },
        },
      }),
      prisma.ticket.findMany({
        where: { requesterId: viewer.id, deletedAt: null },
        select: { category: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);

  const categorySet = Array.from(new Set(categories.map((c) => c.category))).filter(
    (category) => category !== "OTHER",
  );

  const suggested = await prisma.knowledgeArticle.findMany({
    where: {
      isPublished: true,
      ...(categorySet.length ? { category: { in: categorySet } } : {}),
    },
    orderBy: [{ views: "desc" }, { createdAt: "desc" }],
    take: 3,
    select: {
      slug: true,
      title: true,
      category: true,
      body: true,
      views: true,
    },
  });

  return {
    open,
    waiting,
    resolvedThisMonth,
    attention: attention as TicketListItem[],
    activity,
    suggested,
  };
}

export type StaffVolumePoint = {
  day: string;
  created: number;
  resolved: number;
};

export async function getStaffDashboard() {
  const now = new Date();
  const today = startOfDay(now);
  const weekStart = startOfDay(subDays(now, 6));
  const monthAgo = subDays(now, 30);

  const [
    unassigned,
    breaching,
    waiting,
    resolvedToday,
    activeAssigned,
    oldestUnassigned,
    waitingTickets,
    recentReplies,
    responseSamples,
    volumeTickets,
  ] = await Promise.all([
    countsFor({
      deletedAt: null,
      assigneeId: null,
      status: { in: ["OPEN", "IN_PROGRESS"] },
    }),
    countsFor({
      deletedAt: null,
      status: { notIn: ["RESOLVED", "CLOSED"] },
      OR: [
        { slaResolveDueAt: { lt: now } },
        { firstResponseAt: null, slaFirstResponseDueAt: { lt: now } },
      ],
    }),
    countsFor({ deletedAt: null, status: "WAITING_ON_USER" }),
    countsFor({
      deletedAt: null,
      resolvedAt: { gte: today },
      status: { in: ["RESOLVED", "CLOSED"] },
    }),
    prisma.ticket.groupBy({
      by: ["assigneeId"],
      where: {
        deletedAt: null,
        assigneeId: { not: null },
        status: { in: ACTIVE },
      },
      _count: { _all: true },
      orderBy: { _count: { assigneeId: "desc" } },
      take: 6,
    }),
    prisma.ticket.findMany({
      where: {
        deletedAt: null,
        status: "OPEN",
        assigneeId: null,
      },
      select: TICKET_LIST_SELECT,
      orderBy: { createdAt: "asc" },
      take: 3,
    }),
    prisma.ticket.findMany({
      where: { deletedAt: null, status: "WAITING_ON_USER" },
      select: TICKET_LIST_SELECT,
      orderBy: { lastActivityAt: "asc" },
      take: 3,
    }),
    prisma.reply.findMany({
      where: { ticket: { deletedAt: null } },
      orderBy: { createdAt: "desc" },
      take: 7,
      include: {
        author: { select: { name: true, avatarColor: true, role: true } },
        ticket: { select: { key: true, title: true, status: true } },
      },
    }),
    prisma.ticket.findMany({
      where: {
        deletedAt: null,
        firstResponseAt: { not: null },
        createdAt: { gte: monthAgo },
      },
      select: { createdAt: true, firstResponseAt: true },
      take: 200,
    }),
    prisma.ticket.findMany({
      where: {
        deletedAt: null,
        OR: [{ createdAt: { gte: weekStart } }, { resolvedAt: { gte: weekStart } }],
      },
      select: { createdAt: true, resolvedAt: true },
      take: 1000,
    }),
  ]);

  const userIds = activeAssigned
    .map((group) => group.assigneeId)
    .filter((id): id is string => Boolean(id));
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, avatarColor: true },
  });
  const userMap = new Map(users.map((user) => [user.id, user]));

  const workload = activeAssigned
    .map((group) => ({
      id: group.assigneeId ?? "",
      name: userMap.get(group.assigneeId ?? "")?.name ?? "Unknown",
      avatarColor: userMap.get(group.assigneeId ?? "")?.avatarColor ?? null,
      count: group._count._all,
    }))
    .filter((row) => row.id);

  const avgFirstResponseHours =
    responseSamples.length === 0
      ? 0
      : responseSamples.reduce((total, ticket) => {
          if (!ticket.firstResponseAt) return total;
          return (
            total +
            (ticket.firstResponseAt.getTime() - ticket.createdAt.getTime()) /
              (60 * 60 * 1000)
          );
        }, 0) / responseSamples.length;

  const volume: StaffVolumePoint[] = Array.from({ length: 7 }).map((_, index) => {
    const day = subDays(now, 6 - index);
    const dayStart = startOfDay(day);
    const dayEnd = subDays(dayStart, -1);
    return {
      day: format(day, "EEE"),
      created: volumeTickets.filter(
        (ticket) => ticket.createdAt >= dayStart && ticket.createdAt < dayEnd,
      ).length,
      resolved: volumeTickets.filter(
        (ticket) =>
          ticket.resolvedAt &&
          ticket.resolvedAt >= dayStart &&
          ticket.resolvedAt < dayEnd,
      ).length,
    };
  });

  return {
    unassigned,
    breaching,
    waiting,
    resolvedToday,
    avgFirstResponseHours,
    workload,
    oldestUnassigned: oldestUnassigned as TicketListItem[],
    waitingTickets: waitingTickets as TicketListItem[],
    activity: recentReplies,
    volume,
  };
}

export async function getRecentActivity(
  viewer: Viewer,
  limit = 8,
) {
  return prisma.reply.findMany({
    where: {
      ...(viewer.role === "employee" ? { isInternal: false } : {}),
      ticket: {
        deletedAt: null,
        ...(viewer.role === "employee" ? { requesterId: viewer.id } : {}),
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      author: { select: { name: true, avatarColor: true, role: true } },
      ticket: { select: { key: true, title: true, status: true } },
    },
  });
}
