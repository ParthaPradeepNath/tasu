import type { Priority, Ticket, TicketStatus } from "@/generated/prisma/client";

export const SLA_TARGETS: Record<
  Priority,
  { firstResponseHours: number; resolveHours: number }
> = {
  URGENT: { firstResponseHours: 1, resolveHours: 8 },
  HIGH: { firstResponseHours: 4, resolveHours: 24 },
  MEDIUM: { firstResponseHours: 8, resolveHours: 48 },
  LOW: { firstResponseHours: 24, resolveHours: 72 },
  NONE: { firstResponseHours: 48, resolveHours: 96 },
};

export function computeSla(priority: Priority, createdAt = new Date()) {
  const target = SLA_TARGETS[priority];
  return {
    slaFirstResponseDueAt: new Date(
      createdAt.getTime() + target.firstResponseHours * 60 * 60 * 1000,
    ),
    slaResolveDueAt: new Date(
      createdAt.getTime() + target.resolveHours * 60 * 60 * 1000,
    ),
  };
}

export type SlaState = "breached" | "due_soon" | "on_track" | "met" | "none";

const DONE: TicketStatus[] = ["RESOLVED", "CLOSED"];

export function slaState(
  ticket: Pick<
    Ticket,
    | "status"
    | "slaFirstResponseDueAt"
    | "slaResolveDueAt"
    | "firstResponseAt"
    | "resolvedAt"
  >,
  now = new Date(),
): SlaState {
  if (ticket.status === "CLOSED") return "none";
  const responseOverdue =
    !ticket.firstResponseAt &&
    ticket.slaFirstResponseDueAt &&
    ticket.slaFirstResponseDueAt.getTime() < now.getTime();
  const resolveOverdue =
    !DONE.includes(ticket.status) &&
    ticket.slaResolveDueAt &&
    ticket.slaResolveDueAt.getTime() < now.getTime();

  if (responseOverdue || resolveOverdue) return "breached";

  if (DONE.includes(ticket.status)) return "met";

  const due = ticket.slaResolveDueAt?.getTime() ?? 0;
  const twoHours = 2 * 60 * 60 * 1000;
  if (due - now.getTime() < twoHours) return "due_soon";

  return "on_track";
}

export const SLA_LABEL: Record<SlaState, string> = {
  breached: "SLA breached",
  due_soon: "Due soon",
  on_track: "On track",
  met: "Met",
  none: "No SLA",
};

/**
 * How far the ticket is through its resolve window, as a percentage clamped to
 * 3–100 so the progress bar always reads. Lives here so server components
 * don't call Date.now() directly during render.
 */
export function slaProgress(
  ticket: Pick<Ticket, "createdAt" | "slaResolveDueAt">,
): number {
  const start = ticket.createdAt.getTime();
  const end = ticket.slaResolveDueAt?.getTime() ?? start;
  if (end <= start) return 100;
  const percent = ((Date.now() - start) / (end - start)) * 100;
  return Math.min(100, Math.max(3, percent));
}

export function isFirstResponseOverdue(
  ticket: Pick<Ticket, "firstResponseAt" | "slaFirstResponseDueAt">,
): boolean {
  return (
    !ticket.firstResponseAt &&
    Boolean(ticket.slaFirstResponseDueAt) &&
    ticket.slaFirstResponseDueAt!.getTime() < Date.now()
  );
}
