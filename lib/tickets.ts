import type {
  Category,
  Priority,
  TicketStatus,
} from "@/generated/prisma/enums";

import { isStaff, type Role } from "./permissions";
import { prisma } from "./prisma";

export const TICKET_LIST_SELECT = {
  id: true,
  key: true,
  title: true,
  status: true,
  priority: true,
  category: true,
  tags: true,
  replyCount: true,
  lastActivityAt: true,
  createdAt: true,
  slaFirstResponseDueAt: true,
  slaResolveDueAt: true,
  firstResponseAt: true,
  resolvedAt: true,
  requester: { select: { id: true, name: true, avatarColor: true } },
  assignee: { select: { id: true, name: true, avatarColor: true } },
} as const;

export type TicketListItem = {
  id: string;
  key: string;
  title: string;
  status: TicketStatus;
  priority: Priority;
  category: Category;
  tags: string[];
  replyCount: number;
  lastActivityAt: Date;
  createdAt: Date;
  slaFirstResponseDueAt: Date | null;
  slaResolveDueAt: Date | null;
  firstResponseAt: Date | null;
  resolvedAt: Date | null;
  requester: { id: string; name: string; avatarColor: string | null };
  assignee: { id: string; name: string; avatarColor: string | null } | null;
};

export type TicketView =
  "all" | "unassigned" | "mine" | "breaching" | "waiting";

export type TicketFilters = {
  status?: TicketStatus[];
  priority?: Priority;
  category?: Category;
  assignee?: string;
  q?: string;
  view?: TicketView;
  cursor?: string;
  limit?: number;
};

function viewerScope(role: Role, viewerId: string) {
  return isStaff(role) ? {} : { requesterId: viewerId };
}

function viewWhere(
  view: TicketView | undefined,
  viewerId: string,
  role: Role,
  now = new Date()
) {
  switch (view) {
    case "unassigned":
      return {
        assigneeId: null,
        status: { notIn: ["CLOSED", "RESOLVED"] as TicketStatus[] },
      };
    case "mine":
      return isStaff(role)
        ? { assigneeId: viewerId }
        : { requesterId: viewerId };
    case "breaching":
      return {
        status: { notIn: ["RESOLVED", "CLOSED"] as TicketStatus[] },
        OR: [
          { slaResolveDueAt: { lt: now } },
          { firstResponseAt: null, slaFirstResponseDueAt: { lt: now } },
        ],
      };
    case "waiting":
      return { status: "WAITING_ON_USER" as TicketStatus };
    default:
      return {};
  }
}

export async function listTickets(
  viewer: { id: string; role: Role },
  filters: TicketFilters = {}
) {
  const limit = Math.min(filters.limit ?? 40, 100);
  const now = new Date();
  const view = viewWhere(filters.view, viewer.id, viewer.role, now);
  const viewOr = "OR" in view ? view.OR : undefined;
  const viewRest =
    "OR" in view ? { status: view.status, assigneeId: view.assigneeId } : view;

  const where = {
    deletedAt: null,
    ...viewerScope(viewer.role, viewer.id),
    ...viewRest,
    ...(filters.status?.length ? { status: { in: filters.status } } : {}),
    ...(filters.priority ? { priority: filters.priority } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.assignee === "unassigned"
      ? { assigneeId: null }
      : filters.assignee === "me"
        ? { assigneeId: viewer.id }
        : filters.assignee
          ? { assigneeId: filters.assignee }
          : {}),
    ...(viewOr || filters.q
      ? {
          AND: [
            ...(viewOr ? [{ OR: viewOr }] : []),
            ...(filters.q
              ? [
                  {
                    OR: [
                      {
                        title: {
                          contains: filters.q,
                          mode: "insensitive" as const,
                        },
                      },
                      {
                        key: {
                          contains: filters.q,
                          mode: "insensitive" as const,
                        },
                      },
                      {
                        description: {
                          contains: filters.q,
                          mode: "insensitive" as const,
                        },
                      },
                    ],
                  },
                ]
              : []),
          ],
        }
      : {}),
  };

  const items = await prisma.ticket.findMany({
    where,
    select: TICKET_LIST_SELECT,
    orderBy: [{ lastActivityAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
  });

  const hasMore = items.length > limit;
  const page = hasMore ? items.slice(0, limit) : items;

  return {
    items: page as TicketListItem[],
    nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null,
  };
}

export async function getTicketByKey(
  viewer: { id: string; role: Role },
  key: string
) {
  return prisma.ticket.findFirst({
    where: {
      key,
      deletedAt: null,
      ...viewerScope(viewer.role, viewer.id),
    },
    include: {
      requester: {
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          title: true,
          avatarColor: true,
        },
      },
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          title: true,
          avatarColor: true,
        },
      },
      replies: {
        where: isStaff(viewer.role) ? {} : { isInternal: false },
        orderBy: { createdAt: "asc" },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatarColor: true,
              role: true,
              title: true,
            },
          },
        },
      },
    },
  });
}

export async function getTicketCounts(viewer: { id: string; role: Role }) {
  const scope = viewerScope(viewer.role, viewer.id);
  const now = new Date();

  const [groups, unassigned, breaching] = await Promise.all([
    prisma.ticket.groupBy({
      by: ["status"],
      where: { deletedAt: null, ...scope },
      _count: { _all: true },
    }),
    prisma.ticket.count({
      where: {
        deletedAt: null,
        assigneeId: null,
        status: { in: ["OPEN", "IN_PROGRESS"] },
      },
    }),
    prisma.ticket.count({
      where: {
        deletedAt: null,
        status: { notIn: ["RESOLVED", "CLOSED"] },
        OR: [
          { slaResolveDueAt: { lt: now } },
          { firstResponseAt: null, slaFirstResponseDueAt: { lt: now } },
        ],
      },
    }),
  ]);

  const byStatus = Object.fromEntries(
    groups.map((group) => [group.status, group._count._all])
  ) as Partial<Record<TicketStatus, number>>;

  return {
    byStatus,
    total: groups.reduce((sum, group) => sum + group._count._all, 0),
    unassigned,
    breaching,
  };
}
