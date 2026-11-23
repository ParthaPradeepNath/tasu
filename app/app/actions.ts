"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { z } from "zod";

import type { Priority, TicketStatus } from "@/generated/prisma/enums";
import { isStaff } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireStaff, requireViewer } from "@/lib/session";
import { computeSla } from "@/lib/sla";
import { CATEGORY_META, PRIORITY_META, STATUS_META } from "@/lib/status";

export type ActionState = { error: string | null };

const createSchema = z.object({
  title: z
    .string()
    .trim()
    .min(4, "Give the ticket a clear title.")
    .max(140, "Keep the title under 140 characters."),
  description: z
    .string()
    .trim()
    .min(12, "Add a little detail so IT can start on the right foot.")
    .max(20000, "That description is a little long."),
  category: z.enum(["HARDWARE", "SOFTWARE", "NETWORK", "ACCESS", "OTHER"]),
  priority: z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "URGENT"]),
  tags: z.array(z.string().trim().min(1).max(32)).max(8),
});

async function nextTicketKey() {
  const counter = await prisma.counter.upsert({
    where: { id: "ticket" },
    create: { id: "ticket", seq: 1041 },
    update: { seq: { increment: 1 } },
  });
  return `HD-${counter.seq}`;
}

export async function createTicket(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const viewer = await requireViewer();

  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((tag) => tag.trim().replace(/^#/, ""))
    .filter(Boolean)
    .slice(0, 8);

  const parsed = createSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category") || "OTHER",
    priority: formData.get("priority") || "MEDIUM",
    tags,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const key = await nextTicketKey();
  const sla = computeSla(parsed.data.priority);

  await prisma.ticket.create({
    data: {
      key,
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      priority: parsed.data.priority,
      tags: parsed.data.tags,
      requesterId: viewer.id,
      ...sla,
    },
  });

  revalidatePath("/app");
  revalidatePath("/app/tickets");
  revalidatePath("/app/queue");
  redirect(`/app/tickets/${key}?created=1`);
}

const replySchema = z.object({
  ticketId: z.string().min(1),
  body: z.string().trim().min(1, "Write a reply first.").max(20000),
  isInternal: z.boolean().optional(),
});

export async function addReply(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const viewer = await requireViewer();
  const parsed = replySchema.safeParse({
    ticketId: formData.get("ticketId"),
    body: formData.get("body"),
    isInternal: formData.get("isInternal") === "true",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Write a reply first." };
  }

  const ticket = await prisma.ticket.findFirst({
    where: {
      id: parsed.data.ticketId,
      deletedAt: null,
      ...(isStaff(viewer.role) ? {} : { requesterId: viewer.id }),
    },
  });

  if (!ticket) return { error: "That ticket is no longer available." };

  const staff = isStaff(viewer.role);
  const internal = staff && Boolean(parsed.data.isInternal);
  const now = new Date();

  const nextStatus: TicketStatus | null = internal
    ? null
    : staff
      ? ticket.status === "OPEN"
        ? "IN_PROGRESS"
        : ticket.status === "RESOLVED" || ticket.status === "CLOSED"
          ? "OPEN"
          : null
      : ticket.status === "WAITING_ON_USER" ||
          ticket.status === "RESOLVED" ||
          ticket.status === "CLOSED"
        ? "IN_PROGRESS"
        : null;

  await prisma.$transaction([
    prisma.reply.create({
      data: {
        ticketId: ticket.id,
        authorId: viewer.id,
        body: parsed.data.body,
        isInternal: internal,
      },
    }),
    prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: nextStatus ?? ticket.status,
        firstResponseAt:
          staff && !internal && !ticket.firstResponseAt
            ? now
            : ticket.firstResponseAt,
        resolvedAt:
          nextStatus === "IN_PROGRESS" || nextStatus === "OPEN"
            ? null
            : ticket.resolvedAt,
        lastActivityAt: now,
        replyCount: { increment: 1 },
      },
    }),
  ]);

  revalidatePath(`/app/tickets/${ticket.key}`);
  revalidatePath("/app/tickets");
  revalidatePath("/app/queue");
  revalidatePath("/app/inbox");
  revalidatePath("/app");
  return { error: null };
}

const updateSchema = z.object({
  ticketId: z.string().min(1),
  status: z
    .enum(["OPEN", "IN_PROGRESS", "WAITING_ON_USER", "RESOLVED", "CLOSED"])
    .optional(),
  priority: z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  category: z
    .enum(["HARDWARE", "SOFTWARE", "NETWORK", "ACCESS", "OTHER"])
    .optional(),
  assigneeId: z.string().nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(32)).max(8).optional(),
});

export async function updateTicket(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const viewer = await requireViewer();
  const staff = isStaff(viewer.role);

  const rawStatus = formData.get("status");
  const parsed = updateSchema.safeParse({
    ticketId: formData.get("ticketId"),
    status: rawStatus ? String(rawStatus) : undefined,
    priority: formData.get("priority")
      ? String(formData.get("priority"))
      : undefined,
    category: formData.get("category")
      ? String(formData.get("category"))
      : undefined,
    assigneeId:
      formData.get("assigneeId") === null
        ? undefined
        : String(formData.get("assigneeId")) || null,
    tags: formData.get("tags")
      ? String(formData.get("tags"))
          .split(",")
          .map((tag) => tag.trim().replace(/^#/, ""))
          .filter(Boolean)
          .slice(0, 8)
      : undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "That change didn't apply.",
    };
  }

  const ticket = await prisma.ticket.findFirst({
    where: {
      id: parsed.data.ticketId,
      deletedAt: null,
      ...(staff ? {} : { requesterId: viewer.id }),
    },
  });

  if (!ticket) return { error: "That ticket is no longer available." };

  const { status, priority, category, assigneeId, tags } = parsed.data;

  // Employees can only confirm a fix (resolve → closed) or reopen a resolved
  // ticket. Everything else belongs to IT.
  if (!staff) {
    const allowed =
      (status === "CLOSED" && ticket.status === "RESOLVED") ||
      (status === "OPEN" && ticket.status === "RESOLVED") ||
      (priority === undefined &&
        category === undefined &&
        assigneeId === undefined &&
        tags === undefined);
    if (!allowed) return { error: "Only IT can make that change." };
  }

  const changes: string[] = [];
  if (status && status !== ticket.status) {
    changes.push(`moved this to ${STATUS_META[status].label.toLowerCase()}`);
  }
  if (priority && priority !== ticket.priority) {
    changes.push(
      `set priority to ${PRIORITY_META[priority].label.toLowerCase()}`
    );
  }
  if (category && category !== ticket.category) {
    changes.push(
      `changed the category to ${CATEGORY_META[category].label.toLowerCase()}`
    );
  }

  let assigneeName: string | null = null;
  if (assigneeId !== undefined && assigneeId !== ticket.assigneeId) {
    if (assigneeId) {
      const assignee = await prisma.user.findUnique({
        where: { id: assigneeId },
        select: { name: true },
      });
      assigneeName = assignee?.name ?? null;
      if (assigneeName) changes.push(`assigned this to ${assigneeName}`);
    } else {
      changes.push("removed the assignee");
    }
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.ticket.update({
      where: { id: ticket.id },
      data: {
        ...(status ? { status } : {}),
        ...(priority ? { priority } : {}),
        ...(category ? { category } : {}),
        ...(assigneeId !== undefined ? { assigneeId } : {}),
        ...(tags ? { tags } : {}),
        ...(status === "RESOLVED" ? { resolvedAt: now } : {}),
        ...(status === "CLOSED" ? { closedAt: now } : {}),
        ...(status && status !== "RESOLVED" && status !== "CLOSED"
          ? { resolvedAt: null, closedAt: null }
          : {}),
        lastActivityAt: now,
      },
    });

    if (changes.length > 0) {
      await tx.reply.create({
        data: {
          ticketId: ticket.id,
          authorId: viewer.id,
          body: `${viewer.name} ${changes.join(", ")}.`,
          type: "SYSTEM",
        },
      });
      await tx.ticket.update({
        where: { id: ticket.id },
        data: { replyCount: { increment: 1 } },
      });
    }
  });

  revalidatePath(`/app/tickets/${ticket.key}`);
  revalidatePath("/app/tickets");
  revalidatePath("/app/queue");
  revalidatePath("/app/inbox");
  revalidatePath("/app/reports");
  revalidatePath("/app");
  return { error: null };
}

const bulkSchema = z.object({
  ids: z
    .array(z.string().min(1))
    .min(1, "Select at least one ticket.")
    .max(100),
  status: z
    .enum(["OPEN", "IN_PROGRESS", "WAITING_ON_USER", "RESOLVED", "CLOSED"])
    .optional(),
  priority: z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assigneeId: z.string().nullable().optional(),
});

export async function bulkUpdateTickets(input: {
  ids: string[];
  status?: TicketStatus;
  priority?: Priority;
  assigneeId?: string | null;
}): Promise<{ error: string | null; updated?: number }> {
  const viewer = await requireStaff();
  const parsed = bulkSchema.safeParse(input);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "That change didn't apply.",
    };
  }

  const { ids, status, priority, assigneeId } = parsed.data;
  if (
    status === undefined &&
    priority === undefined &&
    assigneeId === undefined
  ) {
    return { error: "Pick a change to apply." };
  }

  const tickets = await prisma.ticket.findMany({
    where: { id: { in: ids }, deletedAt: null },
    select: { id: true, status: true, priority: true, assigneeId: true },
  });

  if (tickets.length === 0)
    return { error: "Those tickets are no longer available." };

  let assigneeName: string | null = null;
  if (assigneeId) {
    const assignee = await prisma.user.findFirst({
      where: { id: assigneeId, role: { in: ["agent", "admin"] } },
      select: { name: true },
    });
    if (!assignee) return { error: "That agent is no longer available." };
    assigneeName = assignee.name;
  }

  const now = new Date();
  const changed: { id: string; body: string }[] = [];

  for (const ticket of tickets) {
    const changes: string[] = [];
    if (status && status !== ticket.status) {
      changes.push(`moved this to ${STATUS_META[status].label.toLowerCase()}`);
    }
    if (priority && priority !== ticket.priority) {
      changes.push(
        `set priority to ${PRIORITY_META[priority].label.toLowerCase()}`
      );
    }
    if (assigneeId !== undefined && assigneeId !== ticket.assigneeId) {
      changes.push(
        assigneeId
          ? `assigned this to ${assigneeName ?? "an agent"}`
          : "removed the assignee"
      );
    }
    if (changes.length === 0) continue;
    changed.push({
      id: ticket.id,
      body: `${viewer.name} ${changes.join(", ")}.`,
    });
  }

  if (changed.length === 0) return { error: null, updated: 0 };

  const changedIds = changed.map((ticket) => ticket.id);

  // Three batched writes instead of three per ticket — bulk selection can span
  // the whole queue, and Neon round trips add up quickly.
  await prisma.$transaction([
    prisma.ticket.updateMany({
      where: { id: { in: changedIds } },
      data: {
        ...(status ? { status } : {}),
        ...(priority ? { priority } : {}),
        ...(assigneeId !== undefined ? { assigneeId } : {}),
        ...(status === "RESOLVED" ? { resolvedAt: now } : {}),
        ...(status === "CLOSED" ? { closedAt: now } : {}),
        ...(status && status !== "RESOLVED" && status !== "CLOSED"
          ? { resolvedAt: null, closedAt: null }
          : {}),
        lastActivityAt: now,
      },
    }),
    prisma.reply.createMany({
      data: changed.map((ticket) => ({
        ticketId: ticket.id,
        authorId: viewer.id,
        body: ticket.body,
        type: "SYSTEM" as const,
      })),
    }),
    prisma.ticket.updateMany({
      where: { id: { in: changedIds } },
      data: { replyCount: { increment: 1 } },
    }),
  ]);

  revalidatePath("/app/tickets");
  revalidatePath("/app/queue");
  revalidatePath("/app/inbox");
  revalidatePath("/app/reports");
  revalidatePath("/app");
  return { error: null, updated: changed.length };
}

export async function voteArticle(slug: string, helpful: boolean) {
  await requireViewer();
  await prisma.knowledgeArticle.update({
    where: { slug },
    data: helpful
      ? { helpfulCount: { increment: 1 } }
      : { notHelpfulCount: { increment: 1 } },
  });
  revalidatePath(`/app/knowledge/${slug}`);
}

export async function markArticleView(slug: string) {
  await prisma.knowledgeArticle.update({
    where: { slug },
    data: { views: { increment: 1 } },
  });
}

const articleSchema = z.object({
  title: z
    .string()
    .trim()
    .min(6, "Give the article a descriptive title.")
    .max(160, "Keep the title under 160 characters."),
  body: z
    .string()
    .trim()
    .min(40, "Write at least a short paragraph so the article is useful.")
    .max(60000, "That article is a little long."),
  category: z.enum(["HARDWARE", "SOFTWARE", "NETWORK", "ACCESS", "OTHER"]),
  tags: z.array(z.string().trim().min(1).max(32)).max(10),
  isPublished: z.boolean(),
});

function articleSlug(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 72) || "article"
  );
}

async function uniqueArticleSlug(title: string, excludeId?: string) {
  const base = articleSlug(title);
  let slug = base;
  let suffix = 2;

  while (
    await prisma.knowledgeArticle.findFirst({
      where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    })
  ) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

export async function saveArticle(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const viewer = await requireStaff();
  const id = String(formData.get("id") ?? "").trim() || null;

  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((tag) => tag.trim().replace(/^#/, "").toLowerCase())
    .filter(Boolean)
    .slice(0, 10);

  const parsed = articleSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    category: formData.get("category") || "OTHER",
    tags,
    isPublished: formData.get("isPublished") === "true",
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Check the article fields.",
    };
  }

  const existing = id
    ? await prisma.knowledgeArticle.findUnique({ where: { id } })
    : null;
  if (id && !existing) return { error: "That article no longer exists." };

  const slug = existing?.slug ?? (await uniqueArticleSlug(parsed.data.title));

  const article = existing
    ? await prisma.knowledgeArticle.update({
        where: { id: existing.id },
        data: {
          title: parsed.data.title,
          body: parsed.data.body,
          category: parsed.data.category,
          tags: parsed.data.tags,
          isPublished: parsed.data.isPublished,
        },
      })
    : await prisma.knowledgeArticle.create({
        data: {
          slug,
          title: parsed.data.title,
          body: parsed.data.body,
          category: parsed.data.category,
          tags: parsed.data.tags,
          isPublished: parsed.data.isPublished,
          authorId: viewer.id,
        },
      });

  revalidatePath("/app/knowledge");
  revalidatePath(`/app/knowledge/${article.slug}`);
  revalidatePath("/app/reports");
  redirect(`/app/knowledge/${article.slug}`);
}
