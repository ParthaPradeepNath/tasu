import { startOfDay, subDays } from "date-fns";

import { prisma } from "@/lib/prisma";
import { REPORT_RANGES, type ReportRange } from "@/lib/reports";
import { getViewer } from "@/lib/session";

const RANGE_DAYS: Record<ReportRange, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

function cell(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET(request: Request) {
  const viewer = await getViewer();
  if (!viewer) {
    return new Response("Sign in to export reports.", { status: 401 });
  }
  if (viewer.role === "employee") {
    return new Response("Reports are only available to IT staff.", {
      status: 403,
    });
  }

  const url = new URL(request.url);
  const rangeParam = url.searchParams.get("range");
  const range: ReportRange = REPORT_RANGES.includes(rangeParam as ReportRange)
    ? (rangeParam as ReportRange)
    : "30d";

  const start = startOfDay(subDays(new Date(), RANGE_DAYS[range] - 1));
  const tickets = await prisma.ticket.findMany({
    where: { deletedAt: null, createdAt: { gte: start } },
    orderBy: { createdAt: "desc" },
    take: 5000,
    select: {
      key: true,
      title: true,
      status: true,
      priority: true,
      category: true,
      createdAt: true,
      firstResponseAt: true,
      resolvedAt: true,
      slaResolveDueAt: true,
      requester: { select: { name: true, email: true, department: true } },
      assignee: { select: { name: true } },
    },
  });

  const header = [
    "Key",
    "Title",
    "Status",
    "Priority",
    "Category",
    "Requester",
    "Requester email",
    "Department",
    "Assignee",
    "Created",
    "First response",
    "Resolved",
    "SLA resolve due",
    "SLA met",
  ];

  const rows = tickets.map((ticket) => [
    ticket.key,
    ticket.title,
    ticket.status,
    ticket.priority,
    ticket.category,
    ticket.requester.name,
    ticket.requester.email,
    ticket.requester.department,
    ticket.assignee?.name ?? "",
    ticket.createdAt.toISOString(),
    ticket.firstResponseAt?.toISOString() ?? "",
    ticket.resolvedAt?.toISOString() ?? "",
    ticket.slaResolveDueAt?.toISOString() ?? "",
    ticket.resolvedAt && ticket.slaResolveDueAt
      ? ticket.resolvedAt.getTime() <= ticket.slaResolveDueAt.getTime()
        ? "yes"
        : "no"
      : "",
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map(cell).join(","))
    .join("\n");
  const filename = `tasu-tickets-${range}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
