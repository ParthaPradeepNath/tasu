import type { TicketStatus } from "@/generated/prisma/enums";
import { prisma } from "./prisma";
import { isStaff } from "./permissions";
import { TICKET_LIST_SELECT, type TicketListItem } from "./tickets";
import type { Viewer } from "./session";

const ACTIVE: TicketStatus[] = ["OPEN", "IN_PROGRESS", "WAITING_ON_USER"];

export async function getInbox(viewer: Viewer) {
  const staff = isStaff(viewer.role);

  const needsWhere = staff
    ? {
        deletedAt: null,
        assigneeId: viewer.id,
        status: { in: ACTIVE },
      }
    : {
        deletedAt: null,
        requesterId: viewer.id,
        status: { in: ["WAITING_ON_USER", "RESOLVED"] as TicketStatus[] },
      };

  const [needs, unassigned, replies, counts] = await Promise.all([
    prisma.ticket.findMany({
      where: needsWhere,
      select: TICKET_LIST_SELECT,
      orderBy: [{ slaResolveDueAt: "asc" }, { lastActivityAt: "desc" }],
      take: 12,
    }),
    staff
      ? prisma.ticket.findMany({
          where: {
            deletedAt: null,
            assigneeId: null,
            status: "OPEN",
          },
          select: TICKET_LIST_SELECT,
          orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
          take: 5,
        })
      : Promise.resolve([]),
    prisma.reply.findMany({
      where: {
        ...(staff ? {} : { isInternal: false }),
        ticket: {
          deletedAt: null,
          ...(staff ? {} : { requesterId: viewer.id }),
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        author: { select: { name: true, avatarColor: true, role: true } },
        ticket: { select: { key: true, title: true, status: true } },
      },
    }),
    prisma.ticket.groupBy({
      by: ["status"],
      where: {
        deletedAt: null,
        ...(staff ? { assigneeId: viewer.id } : { requesterId: viewer.id }),
      },
      _count: { _all: true },
    }),
  ]);

  const byStatus = Object.fromEntries(
    counts.map((group) => [group.status, group._count._all]),
  ) as Partial<Record<TicketStatus, number>>;

  return {
    needs: needs as TicketListItem[],
    unassigned: unassigned as TicketListItem[],
    replies,
    byStatus,
  };
}
