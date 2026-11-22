import type { ReactNode } from "react";
import type { TicketStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { requireViewer } from "@/lib/session";
import { AppShell } from "@/components/layout/app-shell";

export default async function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  const viewer = await requireViewer();
  const isStaff = viewer.role !== "employee";
  const active: TicketStatus[] = ["OPEN", "IN_PROGRESS", "WAITING_ON_USER"];

  const [waiting, unassigned, inbox] = await Promise.all([
    prisma.ticket.count({
      where: {
        deletedAt: null,
        status: "WAITING_ON_USER",
        ...(isStaff ? {} : { requesterId: viewer.id }),
      },
    }),
    prisma.ticket.count({
      where: {
        deletedAt: null,
        assigneeId: null,
        status: { in: ["OPEN", "IN_PROGRESS"] },
      },
    }),
    isStaff
      ? prisma.ticket.count({
          where: {
            deletedAt: null,
            assigneeId: viewer.id,
            status: { in: active },
          },
        })
      : prisma.ticket.count({
          where: {
            deletedAt: null,
            requesterId: viewer.id,
            status: { in: ["WAITING_ON_USER", "RESOLVED"] },
          },
        }),
  ]);

  return (
    <AppShell
      user={viewer}
      counts={{ inbox, unassigned, waiting }}
    >
      {children}
    </AppShell>
  );
}
